
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

  constructor(builtInFunctions, builtInConstants, options) {
    this.builtInConstants = builtInConstants;
    this.builtInFunctions = builtInFunctions;
    this.options = options;
    this.dataFetcher = options?.dataFetcher ?? (() => {
      throw "ScriptInterpreter: options.dataFetcher is undefined";
    })();
  }



  async interpretScript(
    gas, script = "", scriptID = "0", scriptParams = {},
    permissions = {}, settings = {}, reqUserID = undefined,
    parsedEntities = {},
  ) {
    let scriptGlobals = {
      gas: gas, log: {}, output: undefined, scriptParams: scriptParams,
      reqUserID: reqUserID, scriptID: scriptID, permissions: permissions,
      setting: settings, parsedEntities: parsedEntities, liveModules: {},
      shouldExit: false, resolveScript: undefined, scriptInterpreter: this,
    };

    // First create global environment if not yet done, and then create an
    // initial global environment, used as a parent environment for all
    // scripts/modules.
    let globalEnv = this.createGlobalEnvironment(scriptGlobals);

    // If script is provided, rather than the scriptID, first parse it and add
    // it to the parsedEntities buffer.
    let parsedScript;
    if (scriptID === "0") {
      payGas(globalEnv, {comp: getParsingGasCost(script)});
      let [scriptSyntaxTree] = scriptParser.parse(script);
      if (scriptSyntaxTree.error) throw scriptSyntaxTree.error;
      parsedScript = scriptSyntaxTree.res;
      parsedEntities["#0"] = parsedScript;
    }
    
    // Then extract all entity IDs from all entity references in scriptParams,
    // and extract all entity IDs from the header section of script, and add
    // the scriptID as well to this collection.
    let entIDArr = [...(new Set([
      scriptID,
      ...getEntIDsFromParams(scriptParams),
      ...(parsedScript ? getEntIDsFromScriptHeader(parsedScript) : []),
    ]))];

    // Then preprocess and execute the script.
    try {
      // We first call preprocessEntities() to fetch and parse each of the
      // extracted entities, as well as all of their dependencies. A script
      // entity's dependencies are those IDs from the header that we extract
      // through getEntIDsFromScriptHeader(), and a formal entity's
      // dependency is just the so-called 'format,' which is the first entry
      // in the comma-separated list. We thus wait here for preprocessEntities()
      // to fill up parsedEntities with all relevant parsed entities.
      await this.preprocessEntities(entIDArr, parsedEntities, globalEnv);

      // And after this we are now ready to execute the script. (We don't need
      // to pass parsedEntities here, as it is also stored inside globalEnv.)
      this.executeModule(scriptID, scriptParams, [], globalEnv);
    }
    catch (err) {
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
      undefined, undefined, "global", undefined, undefined, scriptGlobals
    );
    Object.entries(this.builtInFunctions).forEach(([funName, fun]) => {
      globalEnv.declare(funName, fun, true);
    });
    Object.entries(this.builtInConstants).forEach(([ident, val]) => {
      globalEnv.declare(ident, val, true);
    });
    return globalEnv;
  }



  getEntIDsFromParams(scriptParams) {

  }

  getEntIDsFromScriptHeader(scriptNode) {

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
      scriptGlobals.shouldExit = true;
      if (scriptGlobals.resolveScript) scriptGlobals.resolveScript();
    } else {
      throw err;
    }
  }





  async preprocessEntities(
    entIDArr, globalEnv, ancestorEntIDs = []
  ) {
    decrCompGas(globalEnv);
    let {parsedEntities} = globalEnv.scriptGlobals;

    // For each entity ID, first check that none of the entIDs are included in
    // the ancestorEntIDs array, which would mean that an entity depend on
    // itself in an infinite recursion. And then also push a promise to a
    // promise array to fetch, parse and preprocess the given entity.
    let promiseArr = [];
    entIDArr.forEach(id => {
      if (!id || id === "0" || id === 0) return;

      // If the entity have already been parsed and added to the parsedEntities
      // buffer, simply return.
      if (parsedEntities["#" + id]) return;

      // Also check for infinite recursion in the dependencies, and throw if
      // one is found.
      let indOfSelf = ancestorEntIDs.indexOf(id);
      if (indOfSelf !== -1) {
        throw new PreprocessingError(
          `Script @[${id}] imports itself recursively through ` +
          callerModuleIDs.slice(indOfSelf + 1).map(val => "@[" + val + "]")
            .join(" -> ") +
          " -> @[" + id + "]",
        );
      }

      // Else push a promise to fetch, parse and preprocess the entity to
      // promiseArr.
      promiseArr.push(
        this.fetchParseAndPreprocessEntity(
          id, parsedEntities, globalEnv, ancestorEntIDs
        )
      );
    });

    // When having pushed all the promises to promiseArr, we can execute
    // them in parallel.
    await Promise.all(promiseArr);
    return;
  }



  async fetchParseAndPreprocessEntity(entID, globalEnv, ancestorEntIDs) {
    let {gas, parsedEntities} = globalEnv.scriptGlobals;

    // Fetch and parse the entity, and add it to parsedEntities.
    let {error, entType, parsedEnt} =
      await this.dataFetcher.fetchAndParseEntity(gas, entID);
    if (error) throw new PreprocessingError(error);
    parsedEntities["#" + entID] = parsedEnt;

    // Then if it is a script, extract all the dependencies from the script
    // header.
    let entIDArr;
    if (entType === "s") {
      entIDArr = this.getEntIDsFromScriptHeader(parsedEnt);
    } else if (entType === "f") {
      entIDArr = this.getFormatID(parsedEnt);
    } else {
      entIDArr = [];
    }

    // Then call preprocessEntities() to preprocess all entities that haven't
    // yet been preprocessed, and make sure to add entID to ancestorEntIDs,
    // without muting it.
    ancestorEntIDs = [...ancestorEntIDs, entID];
    await this.preprocessEntities(entIDArr, globalEnv, ancestorEntIDs);
    return;
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






  executeModule(moduleID, /* moduleParamJSONArr, */ globalEnv) {
    let {parsedEntities, liveModules} = globalEnv.scriptGlobals;
    let moduleNode = parsedEntities["#" + moduleID];

    // Create a new environment for the module.
    let environment = new Environment(
      globalEnv, undefined, "module", moduleID, /*,*/ globalEnv.scriptGlobals
    );





    // Then see the module should have environments, and if so, create a new
    // environment with a new, unique isolation key.
    let moduleEnv;
    if (moduleNode.isolate) {
      moduleEnv = new Environment(
        environment, undefined, "module", moduleID, nextIsolationKeyRef[0]++
      );
    } else {
      moduleEnv = new Environment(environment, undefined, "module", moduleID);
    }

    // Also execute the mandatory 'parameters' statement at the top of the
    // module in order to initialize some initial parameters, which the user is
    // also allowed to use in the import statements.
    let moduleParamValues;
    try {
      moduleParamValues = JSON.parse(moduleParamJSONArr);
      if (!Array.isArray(moduleParamValues)) throw "";
    } catch (err) {
      throw new PreprocessingError(
        `Ill-formatted JSON array: '${moduleParamJSONArr}'`
      );
    }
    this.declareInputParameters(
      moduleEnv, moduleNode.moduleParams, moduleParamValues, moduleNode,
      environment
    );







    // Once the module syntax tree is gotten and the module parameters have
    // been declared in the new module environment, we look for any import
    // statements at the top of the module, then call this method recursively
    // in parallel to import dependencies.
    if (moduleNode.importStmtArr.length !== 0) {
      // Append moduleID to callerScriptIDs (without muting the input), and
      // initialize a promiseArr to process all the modules in parallel.
      callerModuleIDs = [...callerModuleIDs, moduleID];
      let promiseArr = [];
      let globalPermissions = permissions?.global ?? "";
      moduleNode.importStmtArr.forEach(impStmt => {
        // If the import statement is an "entity import statement," iterate
        // through each entity import and push a promise to..
        if (impStmt.type === "entity-import-statement") {

        }
        else {
          // Get the moduleID for the given import statement.
          let moduleExp = impStmt.moduleExp;
          let moduleParamArr = [];
          if (
            moduleExp.type === "function-call" &&
            moduleExp.exp.type === "entity-reference"
          ) {
            moduleExp =  moduleExp.exp;
            moduleParamArr = moduleExp.postfix.children;
          }
          let moduleRef = this.evaluateExpression(moduleExp, moduleEnv);
          if (!(moduleRef instanceof EntityReference)) {
            if (moduleRef instanceof EntityPlaceholder) {
              throw new PreprocessingError(
                `Script @[${moduleID}] imports from a TBD module reference`
              );
            } else {
              throw new PreprocessingError(
                `Script @[${moduleID}] imports from a value that is not an ` +
                `entity reference`
              );
            }
          }
          let moduleID = moduleRef.id;

          // Then push a promise preprocess the module to promiseArr.
          promiseArr.push(
            this.preprocessModule(moduleID, environment, callerModuleIDs)
          );
        }
      });
    }







    // First execute all import statements.
    moduleNode.importStmtArr.forEach((stmt) => {
      this.executeImportStatement(stmt, environment);
    });

    // Then execute all other (outer) statements of the module.
    moduleNode.importStmtArr.forEach((stmt) => {
      this.executeOuterStatement(stmt, environment);
    });

    // Then return add the environment to liveModules.
    liveModules["#" + moduleID] = environment;
    return;
  }




  executeImportStatement(stmtNode, environment) {
    decrCompGas(environment);
    let {liveModules} = environment.scriptGlobals;

    // Get the live environment of the module, either from liveModules if the
    // module has already been executed, or otherwise by executing it.
    let moduleID = stmtNode.moduleRef.lexeme;
    let moduleEnv = liveModules["#" + moduleID];
    if (!moduleEnv) {
      this.executeModule(moduleID, moduleEnv);
      moduleEnv = liveModules["#" + moduleID];
    }

    // Get the combined exports, and then iterate through all the imports,
    // and add each import to the environment.
    let exports = moduleEnv.exports;
    stmtNode.importArr.forEach(imp => {
      if (imp.namespaceIdent) {
        let nsObj = {};
        Object.entries(exports).forEach(([safeKey, val]) => {
          nsObj[safeKey] = val[0];
        });
        environment.declare(imp.namespaceIdent, nsObj, true, imp);
      }
      else if (imp.structRef) {
        let structObj = new ProtectedObject(imp.structRef.lexeme);
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

    let stmt = stmtNode.stmt;
    if (stmt) {
      if (stmt.type === "expression-statement") {
        let val = this.evaluateExpression(stmt.exp, environment);
        environment.exportDefault(val, undefined, stmtNode);
        return;
      }
      this.executeStatement(stmtNode.stmt, environment);
    }
    if (stmtNode.isDefault) {
      let [[ident]] = stmtNode.exportArr;
      let val = environment.get(ident, stmtNode);
      environment.exportDefault(val, ident, stmtNode);
    }
    else {
      let isStructProp = stmtNode.isStructProp;
      let flagStr = stmtNode.flagStr;
      stmtNode.exportArr.forEach(([ident, alias]) => {
        environment.export(ident, alias, isStructProp, flagStr);
      });
    }
  }






  executeFunction(fun, inputArr, callerNode, callerEnv) {
    // Potentially get function and thisVal from ThisBoundFunction wrapper.
    let thisVal = undefined;
    if (fun instanceof ThisBoundFunction) {
      thisVal = fun.thisVal;
      fun = fun.funVal;
    }

    // Then execute the function depending on its type.
    let ret;
    if (fun instanceof DefinedFunction) {
      ret = this.executeDefinedFunction(
        fun.node, fun.decEnv, inputArr, callerNode, callerEnv, thisVal
      );
    }
    else if (fun instanceof BuiltInFunction) {
      ret = this.executeBuiltInFunction(
        fun, inputArr, callerNode, callerEnv, thisVal
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




  executeBuiltInFunction(fun, inputArr, callerNode, callerEnv, thisVal) {
    payGas(callerEnv, fun.gasCost);
    return fun.fun(
      {
        callerNode: callerNode, callerEnv: callerEnv, thisVal: thisVal,
        options: this.options, gas: callerEnv.scriptGlobals.gas,
      },
      ...inputArr
    );
  }





  executeDefinedFunction(
    funNode, funDecEnv, inputValueArr, callerNode, callerEnv,
    thisVal = undefined
  ) {
    decrCompGas(callerEnv);

    // Initialize a new environment for the execution of the function.
    let newEnv = new Environment(funDecEnv, thisVal, "function");

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
      else {
        this.handleException(err, callerEnv);
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
        paramVal = this.evaluateExpression(param.defaultExp, newEnv);
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
          let thisVal = environment.get("this");
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
        let expVal, indexVal;
        try {
          [expVal, indexVal] = this.getMemberAccessExpValAndSafeIndex(
            expNode, environment
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

        // And if the value is a function, bind this to expVal for it. (Note
        // that this differs from the conventional semantics of JavaScript,
        // where 'this' is normally only bound at the time when the method is
        // being called.)
        if (ret instanceof DefinedFunction || ret instanceof BuiltInFunction) {
          ret = new ThisBoundFunction(
            ret, expVal, (expVal instanceof ProtectedObject)
          );
        }
        else if (ret instanceof ThisBoundFunction) {
          ret = new ThisBoundFunction(
            ret.funVal, expVal, (expVal instanceof ProtectedObject)
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
        return environment.get("this");
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
      let expVal, indexVal, isStruct;
      try {
        [expVal, indexVal, isStruct] = this.getMemberAccessExpValAndSafeIndex(
          expNode, environment
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
        expNode, environment
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
        memAccNode, environment
      );
    }
    else {
      indexVal = "#" + indexVal;
    }

    return [expVal, indexVal, isStruct];
  }

}




export const UNDEFINED = Symbol("undefined");


export class Environment {
  constructor(
    parent = undefined, thisVal = undefined, scopeType = "block",
    moduleID = undefined, isolationKey = undefined,
    scriptGlobals = undefined,
  ) {
    this.parent = parent;
    this.variables = {"#this": thisVal ?? UNDEFINED};
    this.scopeType = scopeType;
    this.moduleID = moduleID ?? parent?.moduleID ?? undefined;
    this.scriptGlobals = scriptGlobals ?? parent?.scriptGlobals ?? (() => {
      throw "Environment: No scriptGlobals object provided";
    })();
    if (scopeType === "module") {
      this.isolationKey = isolationKey ?? parent?.isolationKey ?? undefined;
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
  constructor(node, decEnv, exportPermissions) {
    this.node = node;
    this.decEnv = decEnv;
    if (exportPermissions) this.exportPermissions = exportPermissions;
  }
}

export class BuiltInFunction {
  constructor(fun) {
    this.fun = fun;
  }
}

export class ThisBoundFunction {
  constructor(funVal, thisVal, isStructProp = false) {
    this.funVal = funVal;
    this.thisVal = thisVal;
    this.isStructProp = isStructProp;
  }
}

export class ProtectedObject {
  constructor(moduleID, flagStrAndPropPairs) {
    this.moduleID = moduleID;
    this.flagStrAndPropPairs = flagStrAndPropPairs;
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
