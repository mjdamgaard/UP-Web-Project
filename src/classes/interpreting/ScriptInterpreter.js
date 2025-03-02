
import {scriptParser} from "../parsing/ScriptParser.js";
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

  constructor(builtInFunctions, builtInConstants, dataFetcher) {
    this.builtInConstants = builtInConstants;
    this.builtInFunctions = builtInFunctions;
    this.dataFetcher = dataFetcher;
  }



  async interpretScript(
    gas, script = "", scriptID = "0", mainInputs = [],
    reqUserID = undefined, permissions = {}, settings = {},
    parsedEntities = new Map(),
  ) {
    let scriptGlobals = {
      gas: gas, log: {}, output: undefined, mainInputs: mainInputs,
      reqUserID: reqUserID, scriptID: scriptID, permissions: permissions,
      setting: settings, shouldExit: false, resolveScript: undefined,
      scriptInterpreter: this, parsedEntities: parsedEntities, liveModules: {},
    };

    // First create global environment if not yet done, and then create an
    // initial global environment, used as a parent environment for all
    // scripts/modules.
    let globalEnv = this.createGlobalEnvironment(scriptGlobals);

    // If script is provided, rather than the scriptID, first parse it.
    let parsedScript;
    if (scriptID === "0") {
      payGas(globalEnv, {comp: getParsingGasCost(script)});
      let [scriptSyntaxTree] = scriptParser.parse(script);
      if (scriptSyntaxTree.error) throw scriptSyntaxTree.error;
      parsedScript = scriptSyntaxTree.res;
      parsedEntities.set(scriptID, parsedScript);
    }
    // Else fetch and parse the script first thing.
    else {
      parsedScript = parsedEntities.get(scriptID);
      if (!parsedScript) {
        let {error, parsedEnt} = await this.dataFetcher.fetchAndParseEntity(
          gas, scriptID, "s"
        );
        if (error) throw new PreprocessingError(error);
        parsedScript = parsedEnt;
        parsedEntities.set(scriptID, parsedScript);
      }
    }

    // Then execute the script as a module, followed by an execution of any
    // function called 'main,' or the default export if no 'main' function is
    // found, and make sure to try-catch any exceptions or errors.
    try {
      let liveScriptEnv = await this.executeModule(
        parsedScript, scriptID, globalEnv
      );
      this.executeMainFunction(liveScriptEnv, mainInputs);
    }
    catch (err) {
      // If any non-internal error occurred, log it in log.error and set
      // shouldExit to true (both contained in globalEnv).
      this.handleException(err, globalEnv);
    } 

    // If the shouldExit is true, we can return the resulting output and log.
    if (scriptGlobals.shouldExit) {
      return [scriptGlobals.output, scriptGlobals.log];
    }

    // Else we create and wait for a promise for obtaining the output and log,
    // which might be resolved by a custom callback function within the script,
    // waiting to be called, possibly after some data has been fetched. We also
    // set a timer dependent on gas.time, which might resolve the log with an
    // error first.
    else {
      if (gas.time >= 10) {
        // Create a new promise to get the log, and store a modified resolve()
        // callback on scriptGlobals (which is contained by globalEnv).
        let outputPromise = new Promise(resolve => {
          scriptGlobals.resolveScript = () => resolve(
            [scriptGlobals.output, scriptGlobals.log]
          );
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

        // Then wait for the output and log to be resolved, either by a custom
        // callback, or by the timeout callback.
        return await outputPromise;
      }
      else {
        scriptGlobals.log.error = new OutOfGasError(
          "Ran out of " + GAS_NAMES.time + " gas (no exit statement reached)"
        );
        return [undefined, scriptGlobals.log];
      }
    }
  }




  createGlobalEnvironment(scriptGlobals) {
    let globalEnv = new Environment(
      undefined, "global", undefined, undefined, scriptGlobals
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
      scriptGlobals.shouldExit = true;
    } else if (err instanceof ReturnException) {
      log.error = new RuntimeError(
        "Cannot return from outside of a function",
        err.node, err.environment
      );
    } else if (err instanceof CustomException) {
      log.error = new RuntimeError(
        `Uncaught exception: "${err.val.toString()}"`,
        err.node, err.environment
      );
    } else if (err instanceof BreakException) {
      log.error = new RuntimeError(
        `Invalid break statement outside of loop`,
        err.node, err.environment
      );
    } else if (err instanceof ContinueException) {
      log.error = new RuntimeError(
        `Invalid continue statement outside of loop or switch-case statement`,
        err.node, err.environment
      );
    } else if (err instanceof ExitException) {
      scriptGlobals.shouldExit = true;
      if (scriptGlobals.resolveScript) scriptGlobals.resolveScript();
    } else {
      throw err;
    }
  }







  async executeModule(moduleNode, moduleID, globalEnv) {
    decrCompGas(globalEnv);

    // Create a new environment for the module.
    let moduleEnv = new Environment(
      globalEnv, "module", undefined, moduleID
    );

    // Then run all the import statements in parallel and get their live
    // environments, but without making any changes to moduleEnv yet.
    let liveSubmoduleArr = await Promise.all(
      moduleNode.importStmtArr.map(impStmt => (
        this.executeSubmoduleOfImportStatement(impStmt, moduleEnv, globalEnv)
      ))
    );

    // We can then run all the import statements again, this time where each
    // import statement is paired with the environment from the already
    // executed module, and where the changes are now made to moduleEnv.
    moduleNode.importStmtArr.forEach((impStmt, ind) => {
      this.finalizeImportStatement(impStmt, liveSubmoduleArr[ind], moduleEnv);
    });

    // Then execute the body of the script, consisting of "outer statements"
    // (export statements as well as normal statements).
    moduleNode.stmtArr.forEach((stmt) => {
      this.executeOuterStatement(stmt, moduleEnv);
    });

    // And finally get the exported "live module," and return it.
    return moduleEnv.getLiveModule();
  }




  async executeSubmoduleOfImportStatement(impStmt, callerModuleEnv, globalEnv) {
    decrCompGas(globalEnv);
    let {liveModules, parsedEntities, gas} = globalEnv.scriptGlobals;

    // Evaluate the submodule entity reference expression (right after 'from').
    let submoduleRef = impStmt.moduleRef;
    if (!submoduleRef.id) throw new PreprocessingError(
      `Importing from a TBD module`,
      impStmt.moduleExp, callerModuleEnv
    );
    let submoduleID = submoduleRef.id;

    // If the module has already been executed, we can return early.
    let existingEnv = liveModules["#" + submoduleID];
    if (existingEnv) {
      return existingEnv;
    }

    // Then fetch and parse the module.
    let submoduleNode = parsedEntities.get(submoduleID);
    if (!submoduleNode) {
      let {error, parsedEnt} = await this.dataFetcher.fetchAndParseEntity(
        gas, submoduleID, "s"
      );
      if (error) throw new RuntimeError(error);
      submoduleNode = parsedEnt;
      parsedEntities.set(submoduleID, submoduleNode);
    }

    // Then execute the module, inside the global environment, and return the
    // resulting liveModule, after also adding it to liveModules.
    let liveModule = await this.executeModule(
      submoduleNode, submoduleID, globalEnv
    );
    return liveModules["#" + submoduleID] = liveModule;
  }




  finalizeImportStatement(impStmt, liveSubmodule, moduleEnv) {
    decrCompGas(moduleEnv);
    let {permissions} = moduleEnv.scriptGlobals;

    // Iterate through all the imports and add each import to the environment.
    impStmt.importArr.forEach(imp => {
      let impType = imp.importType
      if (impType === "namespace-import") {
        let namespaceObj = Object.fromEntries(
          Object.entries(liveSubmodule).map(
            ([safeIdent, [val]]) => [safeIdent, val]
          )
        );
        moduleEnv.declare(imp.ident, namespaceObj, true, imp);
      }
      else if (impType === "protected-import") {
        // For a protected namespace import, we first check if the required
        // permissions are granted to allow for the given import flags.
        let moduleID = moduleEnv.moduleID;
        let submoduleID = impStmt.moduleRef.id;
        let impFlagStr = imp.flagStr;
        if (
          !this.checkPermissions(impFlagStr, moduleID, submoduleID, permissions)
        ) {
          throw new PreprocessingError(
            `Module @[${moduleID}] imports from Module @[${submoduleID}] ` +
            `with permissions "${impFlagStr}" not granted`
          );
        }
        // Then we construct and declare a "protected object."
        let protObj = new ProtectedObject(
          submoduleID, impFlagStr,
          Object.entries(liveSubmodule).filter(([ , [ , exFlagStr]]) => (
            this.checkPermissionFlags(impFlagStr, exFlagStr)
          ))
        );
        moduleEnv.declare(imp.ident, protObj, true, imp);
      }
      else if (impType === "named-imports") {
        imp.namedImportArr.forEach(namedImp => {
          let ident = namedImp.ident ?? "default";
          let alias = namedImp.alias ?? ident;
          moduleEnv.declare(alias, liveSubmodule["#" + ident], true, namedImp);
        });
      }
      else {
        moduleEnv.declare(imp.ident, liveSubmodule["#default"], true, imp);
      }
    });
  }



  checkPermissions(flagStr, importerID, exporterID, permissions) {
    let globalFlags = permissions.global;
    let importFlags = permissions.import["#" + importerID];
    let exportFlags = permissions.export["#" + exporterID];
    let importExportFlags =
      permissions.importExport["#" + importerID]["#" + exporterID];
    let combPermissions = globalFlags + importFlags + exportFlags +
      importExportFlags;
    return this.checkPermissionFlags(combPermissions, flagStr);
  }

  checkPermissionFlags(flagStr, requiredFlagStr) {
    let flagArr = flagStr.split("");
    let requiredFlagArr = requiredFlagStr.split("");
    for (let requiredFlag of requiredFlagArr) {
      if (!flagArr.includes(requiredFlag)) {
        return false;
      }
    }
    return true;
  }




  executeOuterStatement(stmtNode, environment) {
    let type = stmtNode.type;
    switch (type) {
      case "statement": {
        this.executeStatement(stmtNode, environment);
        break;
      }
      case "export-statement": {
        this.executeExportStatement(stmtNode, environment);
        break;
      }
      default: debugger;throw (
        "ScriptInterpreter.executeOuterStatement(): Unrecognized " +
        `statement type: "${type}"`
      );
    }
  }


  executeExportStatement(stmtNode, environment) {
    decrCompGas(environment);

    if (stmtNode.subtype === "named-exports") {
      stmtNode.namedExportArr.forEach(({ident, alias}) => {
        environment.export(ident, alias, undefined, stmtNode);
      });
    }
    else if (stmtNode.exp) {
      let val = this.evaluateExpression(stmtNode.exp, environment);
      environment.declare("default", val, true, stmtNode);
      environment.export("default", undefined, stmtNode.flagStr, stmtNode);
    }
    else {
      this.executeStatement(stmtNode.stmt, environment);
      environment.export(stmtNode.ident, undefined, stmtNode.flagStr, stmtNode);
      if (stmtNode.isDefault) {
        environment.export(
          stmtNode.ident, "default", stmtNode.flagStr, stmtNode
        );
      }
    }
  }




  executeMainFunction(scriptEnv, inputArr, scriptNode) {
    let mainFun;
    try {
      mainFun = scriptEnv.get("main", scriptNode, scriptEnv);
    }
    catch (err) {
      if (!(err instanceof RuntimeError)) throw err;
      try {
        mainFun = scriptEnv.get("default", scriptNode, scriptEnv);
      }
      catch (err) {
        if (!(err instanceof RuntimeError)) throw err;
      }
    }
    if (
      mainFun instanceof DefinedFunction ||
      mainFun instanceof ThisBoundFunction
    ) {
      this.executeFunction(mainFun, inputArr, scriptNode, scriptEnv);
    }
    // If no main function was found, simply do nothing (expecting the script
    // to eventually exit itself via a callback function (or timing out)).
  }





  executeFunction(fun, inputArr, callerNode, callerEnv) {
    // Potentially get function and thisVal from ThisBoundFunction wrapper.
    let thisVal = undefined;
    let thisFlags = undefined;
    if (fun instanceof ThisBoundFunction) {
      thisVal = fun.thisVal;
      thisFlags = fun.thisFlags;
      fun = fun.funVal;
    }

    // Then execute the function depending on its type.
    let ret;
    if (fun instanceof DefinedFunction) {
      if (thisFlags === undefined) {
        ret = this.executeDefinedFunction(
          fun.node, fun.decEnv, inputArr, callerNode, callerEnv, thisVal
        );
      } else {
        ret = this.executeProtectedObjectMethod(
          fun.node, fun.decEnv, inputArr, callerNode, callerEnv, thisVal,
          thisFlags
        );
      }
    }
    else if (fun instanceof BuiltInFunction) {
      ret = this.executeBuiltInFunction(
        fun, inputArr, callerNode, callerEnv, thisVal, thisFlags
      );
    }
    else throw new RuntimeError(
      "Function call with a non-function-valued expression",
      callerNode, callerEnv
    );

    // If the function reached an exit statement, throw an exit exception.
    if (callerEnv.scriptGlobals.shouldExit) {
      throw new ExitException(); // TODO: Correct.
    }
    return ret;
  }




  executeBuiltInFunction(
    fun, inputArr, callerNode, callerEnv, thisVal, thisFlags
  ) {
    let scriptGlobals = callerEnv.scriptGlobals;
    return fun.fun(
      {
        callerNode: callerNode, callerEnv: callerEnv, thisVal: thisVal,
        thisFlags: thisFlags, gas: scriptGlobals.gas,
        scriptGlobals: scriptGlobals,
      },
      ...inputArr
    );
  }



  // This method is supposed to be overwritten in a client-side extension of
  // this class, in particular in order to always send all methods with a "w" or "W"
  // flag (for "write data (as user)") to be executed server-side.
  executeProtectedObjectMethod(
    funNode, funDecEnv, inputValueArr, callerNode, callerEnv, thisVal,
    thisFlags // unused here, but will be used in the client-side extension.
  ) {
    return this.executeDefinedFunction(
      funNode, funDecEnv, inputValueArr, callerNode, callerEnv, thisVal
    )
  }




  executeDefinedFunction(
    funNode, funDecEnv, inputValueArr, callerNode, callerEnv,
    thisVal = undefined,
  ) {
    decrCompGas(callerEnv);
    let scriptGlobals = callerEnv.scriptGlobals;

    // Initialize a new environment for the execution of the function.
    let newEnv = new Environment(funDecEnv, "function", thisVal);

    // Add the input parameters to the environment.
    this.declareInputParameters(
      newEnv, funNode.params, inputValueArr, callerNode, callerEnv
    );

    // Now execute the statements inside a try-catch statement to catch any
    // return exception, or any uncaught break or continue exceptions. On a
    // return exception, return the held value. 
    let stmtArr = funNode.body.stmtArr;
    try {
      stmtArr.forEach(stmt => this.executeStatement(stmt, newEnv));
    } catch (err) {
      if (err instanceof ReturnException) {
        return err.val;
      }
      else if (err instanceof ExitException) {
        scriptGlobals.shouldExit = true;
        if (scriptGlobals.resolveScript) scriptGlobals.resolveScript();
      }
      else if (err instanceof BreakException) {
        throw new RuntimeError(
          `Invalid break statement outside of loop`,
          err.node, err.environment
        );
      }
      else if (err instanceof ContinueException) {
        throw new RuntimeError(
          `Invalid continue statement outside of loop or switch-case statement`,
          err.node, err.environment
        );
      }
    }

    return undefined;
  }


  declareInputParameters(
    environment, params, inputArr, callerNode, callerEnv
  ) {
    params.forEach((param, ind) => {
      let paramName = param.ident;
      let paramVal = inputArr[ind];
      let inputValType = getType(paramVal);

      // If the parameter is typed, check the type. 
      if (param.invalidTypes) {
        if (param.invalidTypes.includes(inputValType)) {
          throw new RuntimeError(
            `Input parameter "${paramName}" of invalid type "${inputValType}"`,
            callerNode, callerEnv
          );
        }
      }

      // If the input value is undefined, and the parameter has a default
      // value, use that value, evaluated at the time (each time) the function
      // is called. We use the same environment each time such that a parameter
      // can depend on a previous one.
      if (param.defaultExp && inputValType === "undefined") {
        paramVal = this.evaluateExpression(param.defaultExp, environment);
      }

      // Then declare the parameter in the environment.
      environment.declare(paramName, paramVal, false, param);
    });
  }



  executeStatement(stmtNode, environment) {
    decrCompGas(environment);

    let type = stmtNode.type;
    switch (type) {
      case "block-statement": {
        let newEnv = new Environment(environment);
        let stmtArr = stmtNode.stmtArr;
        let len = stmtArr.length;
        for (let i = 0; i < len; i++) {
          this.executeStatement(stmtArr[i], newEnv);
        }
        break;
      }
      case "if-else-statement": {
        let condVal = this.evaluateExpression(stmtNode.cond, environment);
        if (condVal) {
          this.executeStatement(stmtNode.ifStmt, environment);
        } else if (stmtNode.elseStmt) {
          this.executeStatement(stmtNode.elseStmt, environment);
        }
        break;
      }
      case "loop-statement": {
        let newEnv = new Environment(environment);
        let innerStmt = stmtNode.stmt;
        let updateExp = stmtNode.updateExp;
        let condExp = stmtNode.cond;
        if (stmtNode.dec) {
          this.executeStatement(stmtNode.dec, newEnv);
        }
        let postponeCond = stmtNode.doFirst;
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
        let expVal = (!stmtNode.exp) ? undefined :
          this.evaluateExpression(stmtNode.exp, environment);
        throw new ReturnException(expVal, stmtNode, environment);
      }
      case "exit-statement": {
        let expVal = (!stmtNode.exp) ? undefined :
          this.evaluateExpression(stmtNode.exp, environment);
        environment.scriptGlobals.output = expVal;
        throw new ExitException();
      }
      case "throw-statement": {
        let expVal = (!stmtNode.exp) ? undefined :
          this.evaluateExpression(stmtNode.exp, environment);
        throw new CustomException(expVal, stmtNode, environment);
      }
      case "try-catch-statement": {
        try {
          this.executeStatement(stmtNode.tryStmt, environment);
        } catch (err) {
          if (err instanceof RuntimeError || err instanceof CustomException) {
            let newEnv = new Environment(environment);
            newEnv.declare(
              stmtNode.ident, err.msg, false, stmtNode
            );
            this.executeStatement(stmtNode.catchStmt, newEnv);
          }
          else throw err;
        }
        break;
      }
      case "instruction-statement": {
        if (stmtNode.lexeme === "break") {
          throw new BreakException(stmtNode, environment);
        } else {
          throw new ContinueException(stmtNode, environment);
        }
      }
      case "empty-statement": {
        return;
      }
      case "variable-declaration": {
        let decType = stmtNode.decType;
        if (decType === "definition-list") {
          stmtNode.defArr.forEach(varDef => {
            let ident = varDef.ident;
            let val = (!varDef.exp) ? undefined :
              this.evaluateExpression(varDef.exp, environment);
            environment.declare(
              ident, val, stmtNode.isConst, stmtNode
            );
          });
        }
        else if (decType === "destructuring") {
          let val = this.evaluateExpression(stmtNode.exp, environment);
          if (!Array.isArray(val)) throw new RuntimeError(
            "Destructuring of a non-array expression",
            stmtNode, environment
          );
          stmtNode.identArr.forEach((ident, ind) => {
            let nestedVal = val[ind];
            environment.declare(
              ident, nestedVal, stmtNode.isConst, stmtNode
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
        let funVal = new DefinedFunction(stmtNode, environment);
        environment.declare(
          stmtNode.name, funVal, false, stmtNode
        );
        break;
      }
      case "expression-statement": {
        this.evaluateExpression(stmtNode.exp, environment);
        break;
      }
      default: debugger;throw (
        "ScriptInterpreter.executeStatement(): Unrecognized " +
        `statement type: "${type}"`
      );
    }

  }




  evaluateExpression(expNode, environment, isMemberAccessChild = false) {
    decrCompGas(environment);

    let type = expNode.type;
    switch (type) {
      case "arrow-function": 
      case "function-expression": {
        let funNode = {
          type: "function-declaration",
          ...expNode,
        };
        let funVal = new DefinedFunction(funNode, environment);
        if (type === "arrow-function") {
          let thisVal = environment.getThisVal();
          funVal = new ThisBoundFunction(funVal, thisVal);
        }
        return funVal;
      }
      case "assignment": {
        let val = this.evaluateExpression(expNode.exp2, environment);
        let op = expNode.op;
        switch (op) {
          case "=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, () => {
                let newVal = val;
                return [newVal, newVal]
              }
            );
          case "+=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) + parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "-=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) - parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "*=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) * parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "/=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) / parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "&&=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = prevVal && val;
                return [newVal, newVal]
              }
            );
          case "||=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = prevVal || val;
                return [newVal, newVal]
              }
            );
          case "??=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
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
        let cond = this.evaluateExpression(expNode.cond, environment);
        if (cond) {
          return this.evaluateExpression(expNode.exp1, environment);
        } else {
          return this.evaluateExpression(expNode.exp2, environment);
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
        let children = expNode.children;
        let acc = this.evaluateExpression(children[0], environment);
        let lastOpIndex = children.length - 2;
        for (let i = 0; i < lastOpIndex; i += 2) {
          let op = children[i + 1];
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
        let root = this.evaluateExpression(expNode.root, environment);
        let exp = this.evaluateExpression(expNode.exp, environment);
        return parseFloat(root) ** parseFloat(exp);
      }
      case "prefix-expression": {
        let op = expNode.op;
        switch (op) {
          case "++":
            return this.assignToVariableOrMember(
              expNode.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Increment of a non-numeric value",
                  expNode, environment
                );
                let newVal = int + 1;
                return [newVal, newVal]
              }
            );
          case "--":
            return this.assignToVariableOrMember(
              expNode.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Decrement of a non-numeric value",
                  expNode, environment
                );
                let newVal = int - 1;
                return [newVal, newVal]
              }
            );
        }
        let val = this.evaluateExpression(expNode.exp, environment);
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
              expNode.exp, environment, prevVal => {
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
        let op = expNode.op;
        switch (op) {
          case "++":
            return this.assignToVariableOrMember(
              expNode.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Increment of a non-numeric value",
                  expNode, environment
                );
                let newVal = int + 1;
                return [newVal, prevVal]
              }
            );
          case "--":
            return this.assignToVariableOrMember(
              expNode.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Decrement of a non-numeric value",
                  expNode, environment
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
        let fun = this.evaluateExpression(expNode.exp, environment);
        let inputExpArr = expNode.postfix.children;
        let inputValArr = inputExpArr.map(exp => (
          this.evaluateExpression(exp, environment)
        ));
        return this.executeFunction(
          fun, inputValArr, expNode, environment
        );
      }
      case "virtual-method": {
        let objVal = this.evaluateExpression(expNode.obj, environment);
        let funVal = this.evaluateExpression(expNode.fun, environment);
        if (objVal instanceof ProtectedObject) throw new RuntimeError(
          'Virtual methods not allowed for protected objects',
          expNode, environment
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
          expNode.fun, environment
        );
      }
      case "member-access": {
        // Call sub-procedure to get the expVal, and the safe-to-use indexVal.
        let expVal, indexVal, isImmutable, isProtected, isThisAccess;
        try {
          [
            expVal, indexVal, isImmutable, isProtected, isThisAccess
          ] = this.getMemberAccessExpValAndSafeIndex(expNode, environment);
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
        if (expNode.postfix.isOpt) {
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
        if (isImmutable || isProtected && !isThisAccess) {
          ret = turnImmutable(ret);
        }

        // And if the value is a function, bind this to expVal for it. (Note
        // that this differs from the conventional semantics of JavaScript,
        // where 'this' is normally only bound at the time when the method is
        // being called.)
        if (ret instanceof DefinedFunction || ret instanceof BuiltInFunction) {
          ret = new ThisBoundFunction(
            ret, expVal, isProtected ? expVal.flags[indexVal] : undefined
          );
        }
        else if (ret instanceof ThisBoundFunction) {
          ret = new ThisBoundFunction(
            ret.funVal, expVal, isProtected ? expVal.flags[indexVal] : undefined
          );
        }

        return ret;
      }
      case "grouped-expression": {
        return this.evaluateExpression(expNode.exp, environment);
      }
      case "array": {
        let expValArr = expNode.children.map(exp => (
          this.evaluateExpression(exp, environment)
        ));
        return expValArr;
      }
      case "object": {
        let memberEntries = expNode.children.map(exp => (
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
        return environment.getThisVal(expNode, environment);
      }
      case "entity-reference": {
        if (expNode.id) {
          return new EntityReference(expNode.id);
        } else {
          return new EntityPlaceholder(expNode.path);
        }
      }
      case "identifier": {
        let ident = expNode.ident;
        return environment.get(ident, expNode);
      }
      case "string": {
        return expNode.str;
      }
      case "number": {
        return parseFloat(expNode.lexeme);
      }
      case "constant": {
        let lexeme = expNode.lexeme;
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


  assignToVariableOrMember(expNode, environment, assignFun) {
    if (expNode.type === "identifier") {
      let ident = expNode.ident;
      return environment.assign(ident, expNode, assignFun);
    }
    else if (
      expNode.type === "member-access" && !expNode.postfix.isOpt
    ) {
      // Call sub-procedure to get the expVal, and the safe-to-use indexVal.
      let expVal, indexVal, isImmutable, isProtected, isThisAccess;
      try {
        [expVal, indexVal, isImmutable, isProtected, isThisAccess] =
          this.getMemberAccessExpValAndSafeIndex(expNode, environment);
      } catch (err) {
        // If err is an BrokenOptionalChainException, do nothing and return
        // undefined.
        if (err instanceof BrokenOptionalChainException) {
          return undefined;
        } else {
          throw err;
        }
      }

      // Throw runtime error if trying to mute an protected object from outside
      // its own methods, or if the object is immutable.
      if (isImmutable || isProtected && !isThisAccess) throw new RuntimeError(
        "Assignment to a member of an immutable or protected object",
        expNode, environment
      );
      let prevVal = expVal[indexVal];
      if (
        isProtected && isThisAccess && isFunction(prevVal)
      ) throw new RuntimeError(
        "Cannot overwrite a method of a protected object",
        expNode, environment
      );

      // Then assign the member of our expVal and return the value specified by
      // assignFun.
      let [newVal, ret] = assignFun(prevVal);
      expVal[indexVal] = newVal;
      return ret;
    }
    else {
      throw new RuntimeError(
        "Assignment to invalid expression",
        expNode, environment
      );
    }
  }

  getMemberAccessExpValAndSafeIndex(memAccNode, environment) {
    // Evaluate the expression.
    let expVal = this.evaluateExpression(
      memAccNode.exp, environment, true
    );

    // Now get the index value.
    let indexExp = memAccNode.postfix;
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
    let isProtected = (valType === "protected");
    let isImmutable = (expVal instanceof Immutable);
    if (isImmutable) {
      expVal = expVal.val;
    }
    if (valType === "array") {
      indexVal = parseInt(indexVal);
      if (!(indexVal >= 0 && indexVal <= MAX_ARRAY_INDEX)) {
        throw new RuntimeError(
          "Trying to access member of an array with a non-integer or a " +
          "negative integer key",
          indexExp, environment
        );
      }
    }
    else if (valType !== "object" && !isProtected) {
      throw new RuntimeError(
        "Trying to access member of a non-object",
        memAccNode, environment
      );
    }
    else {
      indexVal = "#" + indexVal;
    }

    let isThisAccess = (memAccNode.exp.type === "this-keyword");
    return [expVal, indexVal, isImmutable, isProtected, isThisAccess];
  }

}







// TODO: Consider refactoring Environment.

export class Environment {
  constructor(
    parent = undefined, scopeType = "block", thisVal = UNDEFINED,
    moduleID = undefined, scriptGlobals = undefined
  ) {
    this.parent = parent;
    this.scopeType = scopeType;
    this.variables = (scopeType === "function") ? {"#this": thisVal} : {};
    this.moduleID = moduleID ?? parent?.moduleID ?? undefined;
    this.scriptGlobals = scriptGlobals ?? parent?.scriptGlobals ?? (() => {
      throw "Environment: No scriptGlobals object provided";
    })();
    if (scopeType === "module") {
      this.exports = [];
      this.liveModule = undefined;
    }
  }

  #get(ident, node, nodeEnvironment) {
    let safeIdent = "#" + ident;
    let entry = this.variables[safeIdent] ?? [];
    let val = entry[0];
    if (val !== undefined) {
      return (val === UNDEFINED) ? undefined : entry;
    } else if (this.parent) {
      let entry = this.parent.#get(ident, node, nodeEnvironment);
      if (this.scopeType === "function") {
        entry[5] = true
      };
      return entry;
    } else {
      throw new RuntimeError(
        "Undeclared variable",
        node, nodeEnvironment ?? this
      );
    }
  }


  get(ident, node, nodeEnvironment) {
    let entry = this.#get(ident, node, nodeEnvironment);
    let [val, , , , , isFromOutsideFunctionScope] = entry;
    if (isFromOutsideFunctionScope) {
      return turnImmutable(val);
    } else {
      return val;
    }
  }

  getExported(ident, node, nodeEnvironment) {
    let entry = this.#get(ident, node, nodeEnvironment);
    let [val, , isExported] = entry;
    return (isExported) ? val : undefined;
  }

  getProtected(ident, node, nodeEnvironment) {
    let entry = this.#get(ident, node, nodeEnvironment);
    let [val, , isExported, isProtected, flagStr] = entry;
    return (isExported && isProtected) ? [val, flagStr]  : undefined;
  }

  getThisVal(node, nodeEnvironment) {
    let entry = this.#get("this", node, nodeEnvironment);
    let [thisVal, , , , , isFromOutsideFunctionScope] = entry;
    return isFromOutsideFunctionScope ? undefined : thisVal;
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
      this.variables[safeIdent] = [
        val, isConst
      ];
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
    } else if (this.parent && this.scopeType !== "function") {
      return this.parent.assign(ident, node, assignFun);
    } else {
      throw new RuntimeError(
        "Assignment of undefined or non-local variable '" + ident + "'",
        node, this
      );
    }
  }


  export(ident, alias = ident, flagStr, node, nodeEnvironment = this) {
    flagStr ??= undefined;
    let prevExport = this.exports["#" + alias];
    if (prevExport !== undefined) throw new RuntimeError(
      `Duplicate export of the same name: "${alias}"`,
      node, nodeEnvironment
    );
    // We evaluate the exported variable *when* it is exported, as that seems
    // more secure.
    let val = this.get(ident, node, nodeEnvironment)
    if (val === undefined) throw new RuntimeError(
      `Exported variable or function is undefined: "${ident}"`,
      node, nodeEnvironment
    );
    this.exports.push([alias, val, flagStr]);
  }

  getLiveModule() {
    if (!this.liveModule ) {
      let liveModule = this.liveModule = {};
      this.exports.forEach(([alias, val, flagStr]) => {
        liveModule["#" + alias] = [val, flagStr];
      });
    }
    return this.liveModule;
  }

  // getExports() {
  //   let liveModule = getLiveModule();
  //   return Object.entries(liveModule).map(([safeKey, [val]]) => [safeKey, val]);
  // }

  // getProtectedExports() {
  //   let liveModule = getLiveModule();
  //   return Object.entries(liveModule).filter(
  //     ([ , [ , flagStr]]) => (flagStr !== undefined)
  //   );
  // }

}



function getSafeObj(obj) {
  if (!obj || typeof object !== "object") {
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map(val => getSafeObj(val));
  } else {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => ["#" + key, getSafeObj(val)])
    );
  }
}


function turnImmutable(val) {
  let valType = getType(val);
  if (valType === "array" || valType === "object") {
    return new Immutable(val);
  } else {
    return val;
  }
}




export function payGas(environment, gasCost) {
  let gas = environment?.scriptGlobals.gas ?? environment;
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
  let gas = environment?.scriptGlobals.gas ?? environment;
  if (0 > --gas.comp) throw new OutOfGasError(
    "Ran out of " + GAS_NAMES.comp + " gas"
  );
}

export function decrFetchGas(environment) {
  let gas = environment?.scriptGlobals.gas ?? environment;
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
    } else if (val instanceof ProtectedObject) {
      return "protected";
    } else if (val instanceof Immutable) {
      return getType(val.val);
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

export function isFunction(val) {
  return (
    val instanceof DefinedFunction || val instanceof BuiltInFunction ||
    val instanceof ThisBoundFunction
  );
}



export const UNDEFINED = Symbol("undefined");



export class DefinedFunction {
  constructor(node, decEnv) {
    this.node = node;
    this.decEnv = decEnv;
  }
}

export class BuiltInFunction {
  constructor(fun) {
    this.fun = fun;
  }
}

export class ThisBoundFunction {
  constructor(funVal, thisVal, thisFlags) {
    this.funVal = funVal;
    this.thisVal = thisVal;
    this.thisFlags = thisFlags;
  }
}

export class ProtectedObject {
  constructor(moduleID, filteredLiveModuleEntries) {
    this.moduleID = moduleID;
    let flags = this.flags = {};
    filteredLiveModuleEntries.forEach(([safeIdent, [val, flagStr]]) => {
      this[safeIdent] = val;
      flags[safeIdent] = flagStr;
    });
  }
}

export class Immutable {
  constructor(val) {
    this.val = val;
  }
}



class ReturnException {
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
}
class ExitException {
  constructor() {}
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
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
}



export {ScriptInterpreter as default};
