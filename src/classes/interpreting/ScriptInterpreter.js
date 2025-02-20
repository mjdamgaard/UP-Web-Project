
import {ScriptParser} from "./ScriptParser.js";
import {EntityReference, EntityPlaceholder} from "../parsing/RegEntParser.js";
import {LexError, SyntaxError} from "../parsing/Parser.js";

export {LexError, SyntaxError};


const MAX_ARRAY_INDEX = 1E+15;

const GAS_NAMES = {
  comp: "computation",
  fetch: "fetching",
  cacheSet: "cache inserting",
  time: "time",
};

function getParsingGasCost(str) {
  return {comp: str.length / 100 + 1};
}



export class ScriptInterpreter {

  constructor(builtInFunctions, builtInConstants) {
    this.builtInFunctions = builtInFunctions;
    this.builtInConstants = builtInConstants;
    this.globalEnv = undefined;
    this.fetchScript = builtInFunctions.fetchScript?.fun ?? (() => {
      throw "ScriptInterpreter: builtInFunctions need to include fetchScript()";
    })();
    this.fetchStructDef = builtInFunctions.fetchStructDef?.fun  ?? (() => {
      throw "ScriptInterpreter: builtInFunctions need to include " +
        "fetchStructDef()";
    })();
    this.getStructModuleIDs = builtInFunctions.getStructModuleIDs ?? (() => {
      throw "ScriptInterpreter: builtInFunctions need to include " +
        "getStructModuleIDs()";
    })();
  }



  async interpretScript(
    gas, reqUserID, script, scriptID = "0", permissions
  ) {
    let scriptGlobals = {
      gas: gas, log: {}, reqUserID: reqUserID, scriptID: scriptID,
      permissions: permissions, shouldExit: false, parsedScripts: {},
      structDefs: {}, liveModules: {}, resolveScript: undefined,
    };

    // First create global environment if not yet done, and then create an
    // initial user environment, used for the , and as a parent environment
    // for all scripts/modules.
    let globalEnv = this.createGlobalEnvironment(scriptGlobals);

    // If only a scriptID is provided, rather than a script, fetch and 
    // preprocess the script from scratch, via a call to preprocessScript().
    try {
      if (!script && scriptID !== "0") {
        await this.preprocessScript(scriptID, globalEnv);
      }
      
      // Else pretend that the input script has the otherwise invalid ID, "0",
      // parse it, and add it to the parsedScripts buffer before calling
      // preprocessScript() to continue from there
      else {
        payGas(globalEnv, {comp: getParsingGasCost(script)});
        let scriptSyntaxTree = ScriptParser.parse(script);
        if (scriptSyntaxTree.error) throw scriptSyntaxTree.error;
        scriptID = "0";
        scriptGlobals.parsedScripts = {"#0": scriptSyntaxTree};
        await this.preprocessScript(scriptID, globalEnv);
      }

      // After this preprocessing, execute the script, and return the log.
      this.executeScript(scriptID, globalEnv);
    } catch (err) {
      // If any non-internal error occurred, log it in log.error and set
      // shouldExit to true (both contained in globalEnv).
      this.handleException(err, globalEnv);
    }

    // If the shouldExit is true, we can return the resulting log.
    if (scriptGlobals.shouldExit) {
      return scriptGlobals.log;
    }

    // Else we create and wait for a promise for obtaining the log, which might
    // be resolved by a custom callback function within the script, waiting to
    // be called, possibly after some data has been fetched. We also set a timer
    // dependent on gas.time, which might resolve the log with an error first.
    else {
      if (gas.time >= 10) {
        // Create a new promise to get the log, and store a modified resolve()
        // callback on scriptGlobals (which is contained by globalEnv).
        let logPromise = new Promise(resolve => {
          scriptGlobals.resolveScript = () => resolve(scriptGlobals.log);
        });

        // Then set an expiration time after which the script resolves with an
        // error. 
        setTimeout(
          () => {
            scriptGlobals.log.error = new OutOfGasError(
              "Ran out of " + GAS_NAMES.time + " gas"
            );
            scriptGlobals.resolveScript();
          },
          Date.now() + gas.time
        );

        // Then wait for the log to be resolved, either by a custom callback,
        // or by the timeout callback.
        return await logPromise;
      }
      else {
        scriptGlobals.log.error = new OutOfGasError(
          "Ran out of " + GAS_NAMES.time + " gas (no exit statement reached)"
        );
        return scriptGlobals.log;
      }
    }
  }




  createGlobalEnvironment(scriptGlobals) {
    let globalEnv = new Environment(
      undefined, undefined, "global", undefined, scriptGlobals
    );
    Object.entries(this.builtInFunctions).forEach(([funName, fun]) => {
      globalEnv.declare(funName, fun, true);
    });
    Object.entries(this.builtInConstants).forEach(([ident, val]) => {
      globalEnv.declare(ident, val, true);
    });
    return globalEnv;
  }



  handleException(err, environment) {
    let scriptGlobals = environment.scriptGlobals, {log} = scriptGlobals; 
    if (
      err instanceof LexError || err instanceof SyntaxError ||
      err instanceof PreprocessingError || err instanceof RuntimeError ||
      err instanceof CustomException || err instanceof OutOfGasError
    ) {
      log.error = err;
    } else if (err instanceof ReturnException) {
      log.error = new RuntimeError(
        "Cannot return from outside of a function",
        err.node, environment
      );
    } else if (err instanceof CustomException) {
      log.error = new RuntimeError(
        `Uncaught exception: "${err.val.toString()}"`,
        err.node, environment
      );
    } else if (err instanceof BreakException) {
      log.error = new RuntimeError(
        `Invalid break statement outside of loop`,
        err.node, environment
      );
    } else if (err instanceof ContinueException) {
      log.error = new RuntimeError(
        `Invalid continue statement outside of loop or switch-case statement`,
        err.node, environment
      );
    } else if (err instanceof ExitException) {
      scriptGlobals.shouldExit;
      if (scriptGlobals.resolveScript) scriptGlobals.resolveScript();
    } else {
      throw err;
    }
  }





  async preprocessScript(curScriptID, globalEnv, callerScriptIDs = []) {
    decrCompGas(globalEnv);
    let {parsedScripts, structDefs, permissions} = globalEnv.scriptGlobals;

    // First check that scriptID is not one of the callers, meaning that the
    // preprocess recursion is infinite.
    let indOfSelf = callerScriptIDs.indexOf(curScriptID)
    if (indOfSelf !== -1) {
      throw new PreprocessingError(
        `Script @[${curScriptID}] imports itself recursively through ` +
        callerScriptIDs.slice(indOfSelf + 1).map(id => "@[" + id + "]")
          .join(" -> ") +
        " -> @[" + curScriptID + "]",
      );
    }

    // Try to get the parsed script first from the parsedScripts buffer, or
    // else fetch it and add it to said buffer.
    let scriptSyntaxTree = parsedScripts["#" + curScriptID];
    if (!scriptSyntaxTree) {
      let scriptSyntaxTree = await this.fetchParsedScript(
        globalEnv, curScriptID
      );
      parsedScripts["#" + curScriptID] = scriptSyntaxTree;
    }

    // Once the script syntax tree is gotten, we look for any import statements
    // at the top of the script, then call this method recursively in parallel
    // to import dependencies.
    if (scriptSyntaxTree.importStmtArr.length !== 0) {
      // Append scriptID to callerScriptIDs (without muting the input), and
      // initialize a promiseArr to process all the modules in parallel, as
      // well as an array with all imported structs' IDs, and the IDs of the
      // modules they import from, which will later be used to verify that no
      // struct imports from a wrong module.
      callerScriptIDs = [...callerScriptIDs, curScriptID];
      let promiseArr = [];
      let structAndModulePairs = [];
      let globalPermissions = permissions?.global ?? "";
      let curScriptPermissions = permissions?.scripts["#" + curScriptID] ?? "";
      scriptSyntaxTree.importStmtArr.forEach(stmt => {
        // Get the moduleID for the given import statement.
        let moduleRef = stmt.moduleRef;
        if (moduleRef.isTBD) throw new PreprocessingError(
          `Script @[${curScriptID}] imports from a TBD module reference`
        );
        let moduleID = moduleRef.lexeme;

        // Then push a promise preprocess the module to promiseArr.
        promiseArr.push(
          this.preprocessScript(moduleID, globalEnv, callerScriptIDs)
        );

        // And for each structRef in the import statement, we also want to push
        // a promise to get the struct's definition, as well as to verify that
        // the permissions that the struct import requires is granted.
        let modulePermissions = permissions?.modules["#" + moduleID] ?? "";
        stmt.structImports.forEach(([structRef, flagStr]) => {
          // Get the structID, or throw if the structRef is yet just a
          // placeholder.
          if (structRef.isTBD) throw new PreprocessingError(
            `Script @[${curScriptID}] imports a TBD struct reference`
          );
          let structID = structRef.lexeme;

          // Also check that the struct has the required permissions, or that
          // its module does.
          let structPermissions = permissions?.structs["#" + structID] ?? "";
          let combinedPermissions = globalPermissions + curScriptPermissions +
            modulePermissions + structPermissions;
          let hasPermission = this.checkPermissions(
            combinedPermissions, flagStr
          );
          if (!hasPermission) throw new PreprocessingError(
            `Script @[${curScriptID}] imports Struct @[${structID}] from ` +
            `Module @[${moduleID}] with Permission flag "${requiredFlag}" ` +
            `not granted`
          );

          // We also push [structID, moduleID] to structAndModulePairs such
          // that we can quickly verify that no struct imports from a wrong
          // module once we have all the structDefs.
          structAndModulePairs.push([structID, moduleID]);

          // Then push a promise to fetch and store the struct's definition,
          // as well as its moduleIDs, to promiseArr.
          promiseArr.push(
            this.fetchAndStoreStructDef(gas, structID, structDefs)
          );
        });
      });

      // When having pushed all the promises to promiseArr, we can execute
      // them in parallel.
      await Promise.all(promiseArr);

      // At this point structDefs ought to be completed, and we can therefore
      // now also verify that no struct imports from a wrong module.
      let structModuleIDs = {};
      Object.entries(structDefs).forEach(([safeKey, structDef]) => {
        structModuleIDs[safeKey] = this.getStructModuleIDs(gas, structDef);
      });
      structAndModulePairs.forEach(([structID, moduleID]) => {
        if (!structModuleIDs["#" + structID].includes(moduleID)) {
          throw new PreprocessingError(
            `Script @[${curScriptID}] imports Struct @[${structID}] from a ` +
            `module, @[${moduleID}], that is not one of the struct's own`
          );
        }
      });
    }

    // On a successful preprocessing, parsedScripts will now have been updated
    // to include this script and all its dependencies as well, and structDefs
    // will have been updated to contain the definition strings of all the
    // imported structs. 
    return;
  }



  async fetchAndStoreStructDef(gas, structID, structDefs = {}) {
    let def = await this.fetchStructDef(gas, structID);
    structDefs["#" + structID] = def;
    return structDefs;
  }


  executeBuiltInFunction(fun, inputArr, environment) {
    payGas(environment, fun.gasCost);
    return fun.fun(environment, ...inputArr);
  }



  checkPermissions(flagStr, requiredFlagStr) {
    let flagArr = flagStr.split("");
    let requiredFlagArr = requiredFlagStr.split("");
    for (let requiredFlag of requiredFlagArr) {
      if (!flagArr.includes(requiredFlag)) {
        return false;
      }
    }
    return true;
  }






  executeScript(curScriptID, globalEnv) {
    let {parsedScripts, liveModules} = globalEnv.scriptGlobals;
    let scriptSyntaxTree = parsedScripts["#" + curScriptID];

    // Create a new environment for the script.
    let environment = new Environment(
      globalEnv, undefined, "module", curScriptID, globalEnv.scriptGlobals
    );

    // First execute all import statements.
    scriptSyntaxTree.importStmtArr.forEach((stmt) => {
      this.executeImportStatement(stmt, environment);
    });

    // Then execute all other (outer) statements of the script.
    scriptSyntaxTree.importStmtArr.forEach((stmt) => {
      this.executeOuterStatement(stmt, environment);
    });

    // Then return add the environment to liveModules.
    liveModules["#" + curScriptID] = environment;
    return;
  }




  executeImportStatement(stmtSyntaxTree, environment) {
    decrCompGas(environment);
    let {liveModules} = globalEnv.scriptGlobals;

    // Get the live environment of the module, either from liveModules if the
    // module has already been executed, or otherwise by executing it.
    let moduleID = stmtSyntaxTree.moduleRef.lexeme;
    let moduleEnv = liveModules["#" + moduleID];
    if (!moduleEnv) {
      this.executeScript(moduleID, moduleEnv);
      moduleEnv = liveModules["#" + moduleID];
    }

    // Get the combined exports, and then iterate through all the imports,
    // and add each import to the environment.
    let exports = moduleEnv.exports;
    stmtSyntaxTree.importArr.forEach(imp => {
      if (imp.namespaceIdent) {
        let nsObj = {};
        Object.entries(exports).forEach(([safeKey, val]) => {
          nsObj[safeKey] = val[0];
        });
        environment.declare(imp.namespaceIdent, nsObj, true, imp);
      }
      else if (imp.structRef) {
        let structObj = new StructObject(imp.structRef.lexeme);
        let impFlagStr = imp.flagStr;
        Object.entries(exports).forEach(
          ([safeKey, [origIdent, isStructProp, exFlagStr]]) => {
            if (isStructProp && this.checkPermissions(impFlagStr, exFlagStr)) {
              structObj[safeKey] = moduleEnv.get(origIdent);
            }
          }
        );
        environment.declare(imp.structIdent, structObj, true, imp);
      }
      else if (imp.namedImportArr) {
        imp.namedImportArr.forEach(namedImp => {
          let ident = namedImp.ident;
          let alias = namedImp.alias ?? ident;
          let val;
          if (!ident) {
            val = exports.defaultExport;
          } else {
            let origIdent = exports["#" + alias][0];
            val = moduleEnv.get(origIdent, namedImp, environment);
          }
          environment.declare(alias, val, true, namedImp);
        });
      }
      else {
        environment.declare(
          imp.defaultIdent, exports.defaultExport, true, imp
        );
      }
    });
  }



  executeOuterStatement(stmtSyntaxTree, environment) {
    let type = stmtSyntaxTree.type;
    switch (type) {
      case "statement": {
        this.executeStatement(stmtSyntaxTree, environment);
        break;
      }
      case "export-statement": {
        this.executeExportStatement(stmtSyntaxTree, environment);
        break;
      }
      default: debugger;throw (
        "ScriptInterpreter.executeOuterStatement(): Unrecognized " +
        `statement type: "${type}"`
      );
    }
  }


  executeExportStatement(stmtSyntaxTree, environment) {
    decrCompGas(environment);

    let stmt = stmtSyntaxTree.stmt;
    if (stmt) {
      if (stmt.type === "expression-statement") {
        let val = this.evaluateExpression(stmt.exp, environment);
        environment.exportDefault(val, undefined, stmtSyntaxTree);
        return;
      }
      this.executeStatement(stmtSyntaxTree.stmt, environment);
    }
    if (stmtSyntaxTree.isDefault) {
      let [[ident]] = stmtSyntaxTree.exportArr;
      let val = environment.get(ident, stmtSyntaxTree);
      environment.exportDefault(val, ident, stmtSyntaxTree);
    }
    else {
      let isStructProp = stmtSyntaxTree.isStructProp;
      let flagStr = stmtSyntaxTree.flagStr;
      stmtSyntaxTree.exportArr.forEach(([ident, alias]) => {
        environment.export(ident, alias, isStructProp, flagStr);
      });
    }
  }






  executeFunction(
    funSyntaxTree, inputValueArr, environment, thisVal = undefined
  ) {
    decrCompGas(environment);

    // Initialize a new environment for the execution of the function.
    let funEnv = new Environment(environment, thisVal, "function");

    // Add the input parameters to the new environment.
    funSyntaxTree.params.forEach((param, ind) => {
      let paramName = param.ident;
      let paramVal = inputValueArr[ind];
      let inputValType = getType(paramVal);

      // If the parameter is typed, check the type. 
      if (param.invalidTypes) {
        if (param.invalidTypes.includes(inputValType)) {
          throw new RuntimeError(
            `Input parameter of invalid type "${inputValType}"`,
            param, environment
          );
        }
      }

      // If the input value is undefined, and the parameter has a default
      // value, use that value, evaluated at the time (each time) the function
      // is called. We use newEnv each time such that a parameter can depend
      // on a previous one.
      if (param.defaultExp && inputValType === "undefined") {
        paramVal = this.evaluateExpression(param.defaultExp, funEnv);
      }

      // Then declare the parameter in the new environment.
      funEnv.declare(paramName, paramVal, false, param);
    });

    // Now execute the statements inside a try-catch statement to catch any
    // return exception, or any uncaught break or continue exceptions. On a
    // return exception, return the held value. 
    let stmtArr = funSyntaxTree.body.stmtArr;
    try {
      stmtArr.forEach(stmt => this.executeStatement(stmt, funEnv));
    } catch (err) {
      if (err instanceof ReturnException) {
        return err.val;
      }
      else {
        this.handleException(err, environment);
      }
    }

    return undefined;
  }





  executeStatement(stmtSyntaxTree, environment) {
    decrCompGas(environment);

    let type = stmtSyntaxTree.type;
    switch (type) {
      case "block-statement": {
        let newEnv = new Environment(environment);
        let stmtArr = stmtSyntaxTree.children;
        let len = stmtArr.length;
        for (let i = 0; i < len; i++) {
          this.executeStatement(stmtArr[i], newEnv);
        }
        break;
      }
      case "if-else-statement": {
        let condVal = this.evaluateExpression(stmtSyntaxTree.cond, environment);
        if (condVal) {
          this.executeStatement(stmtSyntaxTree.ifStmt, environment);
        } else if (stmtSyntaxTree.elseStmt) {
          this.executeStatement(stmtSyntaxTree.elseStmt, environment);
        }
        break;
      }
      case "loop-statement": {
        let newEnv = new Environment(environment);
        let innerStmt = stmtSyntaxTree.stmt;
        let updateExp = stmtSyntaxTree.updateExp;
        let condExp = stmtSyntaxTree.cond;
        if (stmtSyntaxTree.dec) {
          this.executeStatement(stmtSyntaxTree.dec, newEnv);
        }
        let postponeCond = stmtSyntaxTree.doFirst;
        while (postponeCond || this.evaluateExpression(condExp, newEnv)) {
          postponeCond = false;
          try {
            this.executeStatement(innerStmt, newEnv);
          } catch (err) {
            if (err instanceof BreakException) {
              return;
            } else if (!(err instanceof ContinueException)) {
              throw err;
            }
          }
          if (updateExp) {
            this.evaluateExpression(updateExp, newEnv);
          }
        }
        break;
      }
      case "return-statement": {
        let expVal = (!stmtSyntaxTree.exp) ? undefined :
          this.evaluateExpression(stmtSyntaxTree.exp, environment);
        throw new ReturnException(expVal, stmtSyntaxTree, environment);
      }
      case "throw-statement": {
        let expVal = (!stmtSyntaxTree.exp) ? undefined :
          this.evaluateExpression(stmtSyntaxTree.exp, environment);
        throw new CustomException(expVal, stmtSyntaxTree, environment);
      }
      case "try-catch-statement": {
        try {
          this.executeStatement(stmtSyntaxTree.tryStmt, environment);
        } catch (err) {
          if (err instanceof RuntimeError || err instanceof CustomException) {
            let newEnv = new Environment(environment);
            newEnv.declare(
              stmtSyntaxTree.ident, err.msg, false, stmtSyntaxTree
            );
            this.executeStatement(stmtSyntaxTree.catchStmt, newEnv);
          }
          else throw err;
        }
        break;
      }
      case "instruction-statement": {
        if (stmtSyntaxTree.lexeme === "break") {
          throw new BreakException(stmtSyntaxTree, environment);
        } else if (stmtSyntaxTree.lexeme === "continue") {
          throw new ContinueException(stmtSyntaxTree, environment);
        } else {
          throw new ExitException(stmtSyntaxTree, environment);
        }
      }
      case "empty-statement": {
        return;
      }
      case "variable-declaration": {
        let decType = stmtSyntaxTree.decType;
        if (decType === "definition-list") {
          stmtSyntaxTree.defArr.forEach(varDef => {
            let ident = varDef.ident;
            let val = (!varDef.exp) ? undefined :
              this.evaluateExpression(varDef.exp, environment);
            environment.declare(
              ident, val, stmtSyntaxTree.isConst, stmtSyntaxTree
            );
          });
        }
        else if (decType === "destructuring") {
          let val = this.evaluateExpression(stmtSyntaxTree.exp, environment);
          if (!Array.isArray(val)) throw new RuntimeError(
            "Destructuring of a non-array expression",
            stmtSyntaxTree, environment
          );
          stmtSyntaxTree.identArr.forEach((ident, ind) => {
            let nestedVal = val[ind];
            environment.declare(
              ident, nestedVal, stmtSyntaxTree.isConst, stmtSyntaxTree
            );
          });
        }
        else throw (
          "ScriptInterpreter.executeStatement(): Unrecognized " +
          `variable declaration type: "${decType}"`
        );
        break;
      }
      case "function-declaration": {
        let funVal = new DefinedFunction(stmtSyntaxTree, environment);
        environment.declare(
          stmtSyntaxTree.name, funVal, false, stmtSyntaxTree
        );
        break;
      }
      case "expression-statement": {
        this.evaluateExpression(stmtSyntaxTree.exp, environment);
        break;
      }
      default: debugger;throw (
        "ScriptInterpreter.executeStatement(): Unrecognized " +
        `statement type: "${type}"`
      );
    }

  }




  evaluateExpression(expSyntaxTree, environment, isMemberAccessChild = false) {
    decrCompGas(environment);

    let type = expSyntaxTree.type;
    switch (type) {
      case "arrow-function": 
      case "function-expression": {
        let funSyntaxTree = {
          sym: "function-declaration",
          ...expSyntaxTree,
        };
        let funVal = new DefinedFunction(funSyntaxTree, environment);
        if (type === "arrow-function") {
          let thisVal = environment.get("this");
          funVal = new ThisBoundFunction(funVal, thisVal);
        }
        return funVal;
      }
      case "assignment": {
        let val = this.evaluateExpression(expSyntaxTree.exp2, environment);
        let op = expSyntaxTree.op;
        switch (op) {
          case "=":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp1, environment, () => {
                let newVal = val;
                return [newVal, newVal]
              }
            );
          case "+=":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) + parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "-=":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) - parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "*=":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) * parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "/=":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) / parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "&&=":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp1, environment, prevVal => {
                let newVal = prevVal && val;
                return [newVal, newVal]
              }
            );
          case "||=":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp1, environment, prevVal => {
                let newVal = prevVal || val;
                return [newVal, newVal]
              }
            );
          case "??=":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp1, environment, prevVal => {
                let newVal = prevVal ?? val;
                return [newVal, newVal]
              }
            );
          default: debugger;throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
      }
      case "conditional-expression": {
        let cond = this.evaluateExpression(expSyntaxTree.cond, environment);
        if (cond) {
          return this.evaluateExpression(expSyntaxTree.exp1, environment);
        } else {
          return this.evaluateExpression(expSyntaxTree.exp2, environment);
        }
      }
      case "or-expression":
      case "and-expression":
      case "and-expression":
      case "bitwise-or-expression":
      case "bitwise-xor-expression":
      case "bitwise-and-expression":
      case "bitwise-and-expression":
      case "equality-expression":
      case "relational-expression":
      case "additive-expression":
      case "multiplicative-expression": {
        let children = expSyntaxTree.children;
        let acc = this.evaluateExpression(children[0], environment);
        let lastOpIndex = children.length - 2;
        for (let i = 0; i < lastOpIndex; i += 2) {
          let op = children[i + 1].lexeme;
          let nextChild = children[i + 2];
          let nextVal;
          if (op !== "||" && op !== "??" && op !== "&&") {
            nextVal = this.evaluateExpression(nextChild, environment);
          }
          switch (op) {
            case "||":
              acc = acc || this.evaluateExpression(nextChild, environment);
              break;
            case "??":
              acc = acc ?? this.evaluateExpression(nextChild, environment);
              break;
            case "&&":
              acc = acc && this.evaluateExpression(nextChild, environment);
              break;
            case "|":
              acc = parseInt(acc) | parseInt(nextVal);
              break;
            case "^":
              acc = parseInt(acc) ^ parseInt(nextVal);
              break;
            case "&":
              acc = parseInt(acc) & parseInt(nextVal);
              break;
            case "===":
              acc = acc === nextVal;
              break;
            case "==":
              acc = acc == nextVal;
              break;
            case "!==":
              acc = acc !== nextVal;
              break;
            case "!=":
              acc = acc != nextVal;
              break;
            case ">":
              acc = parseFloat(acc) > parseFloat(nextVal);
              break;
            case "<":
              acc = parseFloat(acc) < parseFloat(nextVal);
              break;
            case "<=":
              acc = parseFloat(acc) <= parseFloat(nextVal);
              break;
            case ">=":
              acc = parseFloat(acc) >= parseFloat(nextVal);
              break;
            case "<<":
              acc = parseFloat(acc) << parseInt(nextVal);
              break;
            case ">>":
              acc = parseFloat(acc) >> parseInt(nextVal);
              break;
            case ">>>":
              acc = parseFloat(acc) >>> parseInt(nextVal);
              break;
            case "+":
              acc = parseFloat(acc) + parseFloat(nextVal);
              break;
            case "<>": {
              let accType = getType(acc);
              let nextType = getType(nextVal);
              if (accType === "string" || accType === "int") {
                if (accType !== "string" && accType !== "int") {
                    throw new RuntimeError(
                    "Concatenation of a non-string/int to a string/int",
                    nextChild, environment
                  );
                }
                acc = acc.toString() + nextVal;
              }
              if (accType === "array") {
                if (nextType !== "array") throw new RuntimeError(
                  "Concatenation of a non-array to an array",
                  nextChild, environment
                );
                acc = [...acc, ...nextVal];
              }
              else if (accType === "object") {
                if (nextType !== "object") throw new RuntimeError(
                  "Merger of a non-object with an object",
                  nextChild, environment
                );
                acc = {...acc, ...nextVal};
              }
              else throw new RuntimeError(
                "Concatenation of a float, entity, null, or undefined value",
                children[i], environment
              );
              break;
            }
            case "-":
              acc = parseFloat(acc) - parseFloat(nextVal);
              break;
            case "*":
              acc = parseFloat(acc) * parseFloat(nextVal);
              break;
            case "/":
              acc = parseFloat(acc) / parseFloat(nextVal);
              break;
            case "%":
              acc = parseFloat(acc) % parseFloat(nextVal);
              break;
            default: debugger;throw (
              "ScriptInterpreter.evaluateExpression(): Unrecognized " +
              `operator: "${op}"`
            );
          }
        }
        return acc;
      }
      case "exponential-expression": {
        let root = this.evaluateExpression(expSyntaxTree.root, environment);
        let exp = this.evaluateExpression(expSyntaxTree.exp, environment);
        return parseFloat(root) ** parseFloat(exp);
      }
      case "prefix-expression": {
        let op = expSyntaxTree.op;
        switch (op) {
          case "++":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Increment of a non-numeric value",
                  expSyntaxTree, environment
                );
                let newVal = int + 1;
                return [newVal, newVal]
              }
            );
          case "--":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Decrement of a non-numeric value",
                  expSyntaxTree, environment
                );
                let newVal = int - 1;
                return [newVal, newVal]
              }
            );
        }
        let val = this.evaluateExpression(expSyntaxTree.exp, environment);
        switch (op) {
          case "!":
            return !val;
          case "~":
            return ~parseInt(val);
          case "+":
            return +parseFloat(val);
          case "-":
            return -parseFloat(val);
          case "typeof":
            return getType(val);
          case "void":
            return void val;
          case "delete":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp, environment, prevVal => {
                if (prevVal === undefined) {
                  return [undefined, false];
                } else {
                  return [undefined, true];
                }
              }
            );
          default: debugger;throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
      }
      case "postfix-expression": {
        let op = expSyntaxTree.op;
        switch (op) {
          case "++":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Increment of a non-numeric value",
                  expSyntaxTree, environment
                );
                let newVal = int + 1;
                return [newVal, prevVal]
              }
            );
          case "--":
            return this.assignToVariableOrMember(
              expSyntaxTree.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Decrement of a non-numeric value",
                  expSyntaxTree, environment
                );
                let newVal = int - 1;
                return [newVal, prevVal]
              }
            );
          default: debugger;throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
      }
      case "function-call": {
        let fun = this.evaluateExpression(expSyntaxTree.exp, environment);
        let inputExpArr = expSyntaxTree.postfix.children;
        let inputValArr = inputExpArr.map(exp => (
          this.evaluateExpression(exp, environment)
        ));

        // Potentially get function and thisVal from ThisBoundFunction wrapper.
        let thisVal = undefined;
        if (fun instanceof ThisBoundFunction) {
          thisVal = fun.thisVal;
          fun = fun.funVal;
        }

        // Then execute the function depending on its type.
        let ret;
        if (fun instanceof DefinedFunction) {
          ret = this.executeFunction(
            fun.syntaxTree, inputValArr, fun.environment, thisVal
          );
        }
        else if (fun instanceof BuiltInFunction) {
          ret = this.executeBuiltInFunction(fun, inputValArr, environment);
        }
        else throw new RuntimeError(
          "Function call with a non-function-valued expression",
          expSyntaxTree, environment
        );

        // If the function reached an exit statement, throw an exit exception.
        if (environment.scriptGlobals.shouldExit) {
          throw new ExitException();
        }
        return ret;
      }
      case "virtual-method": {
        let objVal = this.evaluateExpression(expSyntaxTree.obj, environment);
        let funVal = this.evaluateExpression(expSyntaxTree.fun, environment);
        if (objVal instanceof StructObject) throw new RuntimeError(
          'Virtual methods not allowed for "struct" types',
          expSyntaxTree, environment
        );
        if (
          funVal instanceof DefinedFunction ||
          funVal instanceof BuiltInFunction
        ) {
          return new ThisBoundFunction(funVal, objVal);
        }
        else if (funVal instanceof ThisBoundFunction) {
          return new ThisBoundFunction(funVal.funVal, objVal);
        }
        else throw new RuntimeError(
          "Virtual method with a non-function type",
          expSyntaxTree.fun, environment
        );
      }
      case "member-access": {
        // Call sub-procedure to get the expVal, and the safe-to-use indexVal.
        let expVal, indexVal;
        try {
          [expVal, indexVal] = this.getMemberAccessExpValAndSafeIndex(
            expSyntaxTree, environment
          );
        } catch (err) {
          // If err is an BrokenOptionalChainException either return undefined,
          // or throw the exception up to the parent if nested in another
          // member-access node.
          if (
            err instanceof BrokenOptionalChainException && isMemberAccessChild
          ) {
            return undefined;
          } else {
            throw err;
          }
        }

        // Handle graceful return in case of an optional chaining.
        if (expSyntaxTree.postfix.isOpt) {
          if (expVal === null || expVal === undefined) {
            if (isMemberAccessChild) {
              throw new BrokenOptionalChainException();
            } else {
              return undefined;
            }
          }
        }

        // Then get the value held in expVal.
        let ret = expVal[indexVal];

        // And if the value is a function, bind this to expVal for it. (Note
        // that this differs from the conventional semantics of JavaScript,
        // where 'this' is normally only bound at the time when the method is
        // being called.)
        if (ret instanceof DefinedFunction || ret instanceof BuiltInFunction) {
          ret = new ThisBoundFunction(
            ret, expVal, (exp instanceof StructObject)
          );
        }
        else if (ret instanceof ThisBoundFunction) {
          ret = new ThisBoundFunction(
            ret.funVal, expVal, (exp instanceof StructObject)
          );
        }

        return ret;
      }
      case "grouped-expression": {
        return this.evaluateExpression(expSyntaxTree.exp, environment);
      }
      case "array": {
        let expValArr = expSyntaxTree.children.map(exp => (
          this.evaluateExpression(exp, environment)
        ));
        return expValArr;
      }
      case "object": {
        let memberEntries = expSyntaxTree.children.map(exp => (
          [
            "#" + (
              exp.ident ??
              this.evaluateExpression(exp.nameExp, environment)
            ),
            this.evaluateExpression(exp.valExp, environment)
          ]
        ));
        return Object.fromEntries(memberEntries);
      }
      case "this-keyword": {
        return environment.get("this");
      }
      case "entity-reference": {
        if (expSyntaxTree.isTBD) {
          return new EntityPlaceholder(expSyntaxTree.lexeme);
        } else {
          return new EntityReference(expSyntaxTree.lexeme);
        }
      }
      case "identifier": {
        let ident = expSyntaxTree.lexeme;
        return environment.get(ident, expSyntaxTree);
      }
      case "string": {
        return JSON.parse(expSyntaxTree.lexeme);
      }
      case "number": {
        return parseFloat(expSyntaxTree.lexeme);
      }
      case "constant": {
        let lexeme = expSyntaxTree.lexeme;
        return (lexeme === "true") ? true :
               (lexeme === "false") ? false :
               (lexeme === "null") ? null :
               (lexeme === "Infinity") ? Infinity :
               (lexeme === "NaN") ? NaN :
               undefined;
      }
      default: debugger;throw (
        "ScriptInterpreter.evaluateExpression(): Unrecognized type: " +
        `"${type}"`
      );
    }
  }


  assignToVariableOrMember(expSyntaxTree, environment, assignFun) {
    if (expSyntaxTree.type === "identifier") {
      let ident = expSyntaxTree.lexeme;
      return environment.assign(ident, expSyntaxTree, assignFun);
    }
    else if (
      expSyntaxTree.type === "member-access" && !expSyntaxTree.postfix.isOpt
    ) {
      // Call sub-procedure to get the expVal, and the safe-to-use indexVal.
      let expVal, indexVal, isStruct;
      try {
        [expVal, indexVal, isStruct] = this.getMemberAccessExpValAndSafeIndex(
          expSyntaxTree, environment
        );
      } catch (err) {
        // If err is an BrokenOptionalChainException, do nothing and return
        // undefined.
        if (err instanceof BrokenOptionalChainException) {
          return undefined;
        } else {
          throw err;
        }
      }

      // Throw runtime error if trying to mute a struct.
      if (isStruct) throw new RuntimeError(
        "Assignment to a member of an immutable object",
        expSyntaxTree, environment
      );

      // Then assign the member of our expVal and return the value specified by
      // assignFun.
      let [newVal, ret] = assignFun(expVal[indexVal]);
      expVal[indexVal] = newVal;
      return ret;
    }
    else {
      throw new RuntimeError(
        "Assignment to invalid expression",
        expSyntaxTree, environment
      );
    }
  }

  getMemberAccessExpValAndSafeIndex(memAccSyntaxTree, environment) {
    // Evaluate the expression.
    let expVal = this.evaluateExpression(
      memAccSyntaxTree.exp, environment, true
    );

    // Now get the index value.
    let indexExp = memAccSyntaxTree.postfix;
    let indexVal = indexExp.ident;
    if (!indexVal) {
      indexVal = this.evaluateExpression(indexExp.exp, environment);
    }
    if (typeof indexVal !== "string" && typeof indexVal !== "number") {
      throw new RuntimeError(
        "Indexing with a non-primitive value",
        indexExp, environment
      );
    }

    // If expVal is an array, check that indexVal is a non-negative
    // integer, and if it is an object, append "#" to the indexVal.
    let valType = getType(expVal);
    let isStruct = (valType === "struct");
    if (valType === "array") {
      indexVal = parseInt(indexVal);
      if (!(indexVal >= 0 && indexVal <= MAX_ARRAY_INDEX)) {
        throw new RuntimeError(
          "Assignment to an array with a non-integer or a " +
          "negative integer key",
          indexExp, environment
        );
      }
    }
    else if (valType !== "object" && !isStruct) {
      throw new RuntimeError(
        "Accessing or assignment to a member of a non-object",
        memAccSyntaxTree, environment
      );
    }
    else {
      indexVal = "#" + indexVal;
    }

    return [expVal, indexVal, isStruct];
  }

}




export const UNDEFINED = {enum: "undefined"};


export class Environment {
  constructor(
    parent = undefined, thisVal = undefined, scopeType = "block",
    moduleID = undefined, scriptGlobals = undefined,
  ) {
    this.parent = parent;
    this.variables = {"#this": thisVal ?? UNDEFINED};
    this.scopeType = scopeType;
    this.moduleID = moduleID ?? parent?.moduleID ?? undefined;
    this.scriptGlobals = scriptGlobals ?? parent?.scriptGlobals ?? (() => {
      throw "Environment: No scriptGlobals object provided";
    })();
    if (scopeType === "module") {
      this.exports = {};
      this.defaultExport = undefined;
    }
  }

  get(ident, node, nodeEnvironment = undefined) {
    let safeIdent = "#" + ident;
    let [val] = this.variables[safeIdent] ?? [];
    if (val !== undefined) {
      return (val === UNDEFINED) ? undefined : val;
    } else if (this.parent) {
      return this.parent.get(ident, node, nodeEnvironment);
    } else {
      throw new RuntimeError(
        "Undeclared variable",
        node, nodeEnvironment ?? this
      );
    }
  }

  declare(ident, val, isConst, node) {
    val = (val === undefined) ? UNDEFINED : val;
    let safeIdent = "#" + ident;
    let [prevVal] = this.variables[safeIdent] ?? [];
    if (prevVal !== undefined) {
      throw new RuntimeError(
        "Redeclaration of variable '" + ident + "'",
        node, this
      );
    } else {
      this.variables[safeIdent] = [val, isConst];
    }
  }

  assign(ident, node, assignFun) {
    let safeIdent = "#" + ident;
    let [prevVal, isConst] = this.variables[safeIdent] ?? [];
    if (prevVal !== undefined) {
      if (isConst) {
        throw new RuntimeError(
          "Reassignment of constant variable or function '" + ident + "'",
          node, this
        );
      } else {
        let [newVal, ret] = assignFun(prevVal);
        newVal = (newVal === undefined) ? UNDEFINED : newVal;
        this.variables[safeIdent][0] = newVal;
        return ret;
      }
    } else if (this.parent) {
      return this.parent.assign(ident, node, assignFun);
    } else {
      throw new RuntimeError(
        "Assignment of undefined variable '" + ident + "'",
        node, this
      );
    }
  }


  export(ident, alias = ident, isStructProp, flagStr) {
    this.export["#" + alias] = [ident, isStructProp, flagStr];
  }

  exportDefault(val, ident = undefined, node) {
    if (this.export.defaultExport) throw new RuntimeError(
      "Only one default export allowed",
      node, this
    );
    if (val === undefined) throw new RuntimeError(
      "Exporting undefined value as the default export",
      node, this
    );
    this.export.defaultExport = val;
    if (ident) this.export["#" + ident] = [ident, false];
  }
}





export function payGas(environment, gasCost) {
  let gas = environment.scriptGlobals.gas;
  Object.keys(this.gasCost).forEach(key => {
    if (gas[key] ??= 0) {
      gas[key] -= gasCost[key];
    }
    if (gas[key] < 0) throw new OutOfGasError(
      "Ran out of " + GAS_NAMES[key] + "gas"
    );
  });
}

export function decrCompGas(environment) {
  let gas = environment.scriptGlobals.gas;
  if (0 > --gas.comp) throw new OutOfGasError(
    "Ran out of " + GAS_NAMES.comp + " gas"
  );
}

export function decrFetchGas(environment) {
  let gas = environment.scriptGlobals.gas;
  if (0 > --gas.fetch) throw new OutOfGasError(
    "Ran out of " + GAS_NAMES.fetch + " gas",
  );
}



export function getType(val) {
  let jsType = typeof val;
  if (jsType === "object") {
    if (Array.isArray(val)) {
      return "array"
    } else if (val === null) {
      return "null";
    } else if (
      val instanceof EntityReference || val instanceof EntityPlaceholder
    ) {
      return "entity";
    } else if (
      val instanceof DefinedFunction || val instanceof BuiltInFunction
    ) {
      return "function";
    } else if (val instanceof StructObject) {
      return "struct";
    } else {
      return "object";
    }
  }
  else if (jsType === "number") {
    if (parseInt(val).toString() === val.toString()) {
      return "int"
    } else {
      return "float";
    }
  }
  else return jsType;
}





export class DefinedFunction {
  constructor(syntaxTree, environment) {
    this.syntaxTree = syntaxTree;
    this.environment = environment;
  }
}

export class BuiltInFunction {
  constructor(fun, gasCost) {
    this.fun = fun;
    this.gasCost = gasCost;
  }
}

export class ThisBoundFunction {
  constructor(funVal, thisVal, isStructProp = false) {
    this.funVal = funVal;
    this.thisVal = thisVal;
    this.isStructProp = isStructProp;
  }
}

export class StructObject {
  constructor(structID) {
    this.structID = structID;
  }
}



class ReturnException {
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
}
class CustomException {
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
}
class BreakException {
  constructor(node, environment) {
    this.node = node;
    this.environment = environment;
  }
}
class ContinueException {
  constructor(node, environment) {
    this.node = node;
    this.environment = environment;
  }
}
class ExitException {
  constructor(node, environment) {
    this.node = node;
    this.environment = environment;
  }
}

class BrokenOptionalChainException {
  constructor() {}
}



export class PreprocessingError {
  constructor(msg) {
    this.msg = msg;
  }
}

export class OutOfGasError {
  constructor(msg) {
    this.msg = msg;
  }
}

export class RuntimeError {
  constructor(msg, node, environment) {
    this.msg = msg;
    this.node = node;
    this.environment = environment;
  }
}

export class CustomException {
  constructor(msg, node, environment) {
    this.msg = msg;
    this.node = node;
    this.environment = environment;
  }
}




export {ScriptInterpreter as default};
