
import {scriptParser} from "../parsing/ScriptParser.js";
// import {EntityReference, EntityPlaceholder} from "../parsing/RegEntParser.js";
import {LexError, SyntaxError} from "../parsing/Parser.js";

export {LexError, SyntaxError};


const INIT_PROTECT_DOC_ID = "10";
const THIS_PROVIDER_ID = "11";
const INIT_PROTECT_MODULE_ID = "12";

// const MAX_ARRAY_INDEX = 1E+15;
const MINIMAL_TIME_GAS = 10;

const GAS_NAMES = {
  comp: "computation",
  import: "import",
  fetch: "fetching",
  cachePriority: "cache priority",
  time: "time",
};

function getParsingGasCost(str) {
  return {comp: str.length / 100 + 1};
}

async function fetchEntity(libraryPaths, funMetadata, entID, entType) {
  let io = await import(libraryPaths.get("io"));
  return await io.selectEntity(funMetadata, entID, entType);
}





export class ScriptInterpreter {

  constructor(isServerSide, getDevLibPath) {
    this.isServerSide = isServerSide;
    this.getDevLibPath = getDevLibPath;
  }


  async interpretScript(
    gas, script = "", scriptID = "0", mainInputs = [], reqUserID = undefined,
    protectModuleID = INIT_PROTECT_MODULE_ID, permissions = {}, settings = {},
    parsedEntities = new Map(), liveModules = new Map(),
  ) {
    let scriptGlobals = {
      gas: gas, log: {}, scriptID: scriptID, reqUserID: reqUserID,
      protectModuleID: protectModuleID, protect: undefined,
      providerID: THIS_PROVIDER_ID, permissions: permissions,
      settings: settings, isServerSide: this.isServerSide, isExiting: false,
      resolveScript: undefined, interpreter: this,
      getDevLibPath: this.getDevLibPath,
      parsedEntities: parsedEntities, liveModules: liveModules,
    };

    // First create global environment if not yet done, and then create an
    // initial global environment, used as a parent environment for all
    // scripts/modules.
    let globalEnv = this.createGlobalEnvironment(scriptGlobals);

    // If script is provided, rather than the scriptID, first parse it.
    let parsedScript, parsedScriptPromise;
    if (scriptID === "0") {
      payGas(globalEnv, {comp: getParsingGasCost(script)});
      let [scriptSyntaxTree] = scriptParser.parse(script);
      if (scriptSyntaxTree.error) throw scriptSyntaxTree.error;
      parsedScript = scriptSyntaxTree.res;
      parsedEntities.set(scriptID, parsedScript);
    }
    // Else fetch and parse the script first thing.
    else {
      parsedScriptPromise = this.fetchParsedScript(
        scriptID, parsedEntities, globalEnv
      );
    }

    // Then execute the input "protect module," from which we get the global
    // protect() function.
    let protectModuleNode = await this.fetchParsedScript(
      protectModuleID, parsedEntities, globalEnv
    );
    let [liveBaseModule] = await this.executeModule(
      protectModuleNode, protectModuleID, globalEnv
    );
    scriptGlobals.liveModules.set(protectModuleID, liveBaseModule);
    scriptGlobals.protect = liveBaseModule["&protect"][0];


    // Create a promise to get the output and log, and store a modified
    // resolve() callback on scriptGlobals (which is contained by globalEnv).
    // This promise is resolved when the user calls the exit() function.
    let outputAndLogPromise = new Promise(resolve => {
      scriptGlobals.resolveScript = (output, error) => {
        let {log} = scriptGlobals;
        if (!log.error) log.error = error;
        scriptGlobals.isExiting = true;
        resolve([output, log]);
      };
    });

    // Now execute the script as a module, followed by an execution of any
    // function called 'main,' or the default export if no 'main' function is
    // found, and make sure to try-catch any exceptions or errors.
    if (parsedScriptPromise) parsedScript = await parsedScriptPromise;
    try {
      let [liveScriptModule, scriptEnv] = await this.executeModule(
        parsedScript, scriptID, globalEnv
      );
      this.executeMainFunction(
        liveScriptModule, mainInputs, parsedScript, scriptEnv
      );
    }
    catch (err) {
      // If any non-internal error occurred, log it in log.error and resolve
      // the script with an undefined output.
      if (
        err instanceof LexError || err instanceof SyntaxError ||
        err instanceof LoadError || err instanceof RuntimeError ||
        err instanceof CustomException || err instanceof OutOfGasError
      ) {
        scriptGlobals.resolveScript(undefined, err);
      } else if (err instanceof ReturnException) {
        scriptGlobals.resolveScript(undefined, new RuntimeError(
          "Cannot return from outside of a function",
          err.node, err.environment
        ));
      } else if (err instanceof CustomException) {
        scriptGlobals.resolveScript(undefined, new RuntimeError(
          `Uncaught exception: "${err.val.toString()}"`,
          err.node, err.environment
        ));
      } else if (err instanceof BreakException) {
        scriptGlobals.resolveScript(undefined, new RuntimeError(
          `Invalid break statement outside of loop or switch-case statement`,
          err.node, err.environment
        ));
      } else if (err instanceof ContinueException) {
        scriptGlobals.resolveScript(undefined, new RuntimeError(
          "Invalid continue statement outside of loop",
          err.node, err.environment
        ));
      } else if (err instanceof ExitException) {
        // Do nothing, as the the script will already have been resolved,
        // before the exception was thrown.
      } else {
        throw err;
      }
    } 

    // If isExiting is true, we can return the resulting output and log.
    if (scriptGlobals.isExiting) {
      return await outputAndLogPromise;
    }

    // Else we create and wait for a promise for obtaining the output and log,
    // which might be resolved by a custom callback function within the script,
    // waiting to be called, possibly after some data has been fetched. We also
    // set a timer dependent on gas.time, which might resolve the log with an
    // error first.
    else {
      if (gas.time < MINIMAL_TIME_GAS) {
        scriptGlobals.resolveScript(undefined, new OutOfGasError(
          "Ran out of " + GAS_NAMES.time + " gas (no exit statement reached)",
          parsedScript, globalEnv,
        ));
      }
      else if (gas.time !== Infinity) {
        // Set an expiration time after which the script resolves with an
        // error. 
        setTimeout(
          () => {
            scriptGlobals.resolveScript(undefined, new OutOfGasError(
              "Ran out of " + GAS_NAMES.time +
                " gas (no exit statement reached)",
              parsedScript, globalEnv,
            ));
          },
          gas.time
        );
      }

      // Then wait for the output and log to be resolved, either by a custom
      // callback, or by the timeout callback.
      return await outputAndLogPromise;
    }
  }




  createGlobalEnvironment(scriptGlobals) {
    let globalEnv = new Environment(
      undefined, "global",
      undefined, undefined, undefined, undefined,
      undefined, undefined,
      scriptGlobals
    );
    return globalEnv;
  }



  async fetchParsedScript(scriptID, parsedEntities, callerEnv) {
    let parsedScript = parsedEntities.get(scriptID);
    if (!parsedScript) {
// TODO: Change.
      let {parsedEnt} = await fetchEntity(
        this.libraryPaths, {callerEnv: callerEnv}, scriptID, "s",
      );
      parsedScript = parsedEnt;
      parsedEntities.set(scriptID, parsedScript);
    }
    return parsedScript;
  }







  async executeModule(moduleNode, moduleID, globalEnv) {
    decrCompGas(moduleNode, globalEnv);

    // Create a new environment for the module.
    let moduleEnv = new Environment(
      globalEnv, "module",
      undefined, undefined, undefined, undefined,
      moduleID, moduleNode.protectModuleID
    );

    // Run all the import statements in parallel and get their live
    // environments, but without making any changes to moduleEnv yet.
    let liveSubmoduleArr = await Promise.all(
      moduleNode.importStmtArr.map(impStmt => (
        this.executeSubmoduleOfImportStatement(impStmt, moduleEnv, globalEnv)
      ))
    );

    // We then run all the import statements again, this time where each
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
    return [moduleEnv.getLiveModule(), moduleEnv];
  }




  async executeSubmoduleOfImportStatement(impStmt, callerModuleEnv, globalEnv) {
    decrCompGas(impStmt, globalEnv);
    decrGas(impStmt, globalEnv, "import");
    let {liveModules, parsedEntities} = globalEnv.scriptGlobals;

    // If the module is referenced by a path, and not directly by an ID, first
    // convert it to an ID via a lookup in moduleIDs.
    if (!impStmt.entID) {
      if (!impStmt.modulePath) throw new LoadError(
        `Importing from a TBD module, "${impStmt.placeholderPath}"`,
        impStmt, callerModuleEnv
      );
    }

    // If the module has already been executed, we can return early.
    let moduleRefStr = impStmt.entID + (impStmt.libPath ?? "");
    let liveModule = liveModules.get(moduleRefStr);
    if (liveModule) {
      return liveModule;
    }

    // If the module reference is a dev library reference, try to import the
    // given library.
    if (impStmt.libPath) {
      let trueLibraryPath = this.getDevLibPath(moduleRefStr);
      let devMod;
      try {
        devMod = await import(trueLibraryPath);
      } catch (err) {
        throw new LoadError(
          `Library "${impStmt.libPath}" not found`,
          impStmt, callerModuleEnv
        );
      }

      // If the dev library module was found, create a "liveModule" object from
      // it, store it in the liveModules buffer, and return it. 
      let liveModule = {};
      Object.entries(devMod).forEach(([key, val]) => {
        if (
          val instanceof DeveloperFunction || val instanceof EntityReference ||
          val instanceof FormalEntity || val instanceof ExpressionEntity ||
          val instanceof ScriptEntity || val instanceof Immutable ||
          typeof val === "number" || typeof val === "string"
        ) {
          liveModule["&" + key] = [val];
        }
      });
      liveModules.set(moduleRefStr, liveModule);
      return liveModule;
    }

    // Else if the module is a user module, first try to get it from the
    // parsedEntities buffer, then try to fetch it from the database.
    let submoduleID = impStmt.entID;
    let submoduleNode = await this.fetchParsedScript(
      submoduleID, parsedEntities, callerModuleEnv
    );

    // Then execute the module, inside the global environment, and return the
    // resulting liveModule, after also adding it to liveModules.
    [liveModule] = await this.executeModule(
      submoduleNode, submoduleID, globalEnv
    );
    liveModules.set(submoduleID, liveModule);
    return liveModule;
  }




  finalizeImportStatement(impStmt, liveSubmodule, moduleEnv) {
    decrCompGas(impStmt, moduleEnv);

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
      else if (impType === "named-imports") {
        imp.namedImportArr.forEach(namedImp => {
          let ident = namedImp.ident ?? "default";
          let alias = namedImp.alias ?? ident;
          let [val] = liveSubmodule["&" + ident];
          moduleEnv.declare(alias, val, true, namedImp);
        });
      }
      else if (impType === "default-import") {
        let [val] = liveSubmodule["&default"];
        moduleEnv.declare(imp.ident, val, true, imp);
      }
      else throw "finalizeImportStatement(): Unrecognized import type";
    });
  }



  // checkPermissions(flagStr, importerID, exporterID, permissions) {
  //   let globalFlags = permissions.global;
  //   let importFlags = permissions.import["&" + importerID];
  //   let exportFlags = permissions.export["&" + exporterID];
  //   let importExportFlags =
  //     permissions.importExport["&" + importerID]["&" + exporterID];
  //   let combPermissions = globalFlags + importFlags + exportFlags +
  //     importExportFlags;
  //   return this.checkPermissionFlags(combPermissions, flagStr);
  // }

  // checkPermissionFlags(flagStr, requiredFlagStr) {
  //   let flagArr = flagStr.split("");
  //   let requiredFlagArr = requiredFlagStr.split("");
  //   for (let requiredFlag of requiredFlagArr) {
  //     if (!flagArr.includes(requiredFlag)) {
  //       return false;
  //     }
  //   }
  //   return true;
  // }




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
      default: throw (
        "ScriptInterpreter.executeOuterStatement(): Unrecognized " +
        `statement type: "${type}"`
      );
    }
  }


  executeExportStatement(stmtNode, environment) {
    decrCompGas(stmtNode, environment);

    if (stmtNode.subtype === "protected-object-export") {
      let val = this.evaluateExpression(stmtNode.exp, environment);
      environment.declare(stmtNode.ident, val, true, stmtNode);
      environment.export(
        stmtNode.ident, undefined, stmtNode, stmtNode.signal,
        stmtNode.isPrivate
      );
    }
    else if (stmtNode.subtype === "variable-export") {
      let val = this.evaluateExpression(stmtNode.exp, environment);
      environment.declare(stmtNode.ident, val, true, stmtNode);
      environment.export(stmtNode.ident, undefined, stmtNode);
      if (stmtNode.isDefault) {
        environment.export(stmtNode.ident, "default", stmtNode);
      }
    }
    else if (stmtNode.subtype === "function-export") {
      this.executeStatement(stmtNode.stmt, environment);
      environment.export(stmtNode.ident, undefined, stmtNode);
      if (stmtNode.isDefault) {
        environment.export(stmtNode.ident, "default", stmtNode);
      }
    }
    else if (stmtNode.subtype === "anonymous-export") {
      let val = this.evaluateExpression(stmtNode.exp, environment);
      environment.declare("default", val, true, stmtNode);
      environment.export("default", undefined, stmtNode);
    }
    else if (stmtNode.subtype === "named-exports") {
      stmtNode.namedExportArr.forEach(({ident, alias}) => {
        environment.export(ident, alias, stmtNode);
      });
    }
    else throw "executeExportStatement(): Unrecognized export subtype";
  }







  executeMainFunction(liveScriptModule, inputArr, scriptNode, scriptEnv) {
    let [mainFun] = liveScriptModule["&main"];
    if (mainFun === undefined) {
      [mainFun] = liveScriptModule["&default"];
    }
    if (mainFun !== undefined) {
      this.executeFunction(
        mainFun, inputArr,
        mainFun instanceof DefinedFunction ? mainFun.node : scriptNode,
        scriptEnv
      );
    }
    // If no main function was found, simply do nothing (expecting the script
    // to eventually exit itself via a callback function (or timing out)).
  }





  executeFunction(
    fun, inputArr, callerNode, callerEnv, thisVal, signalPair
  ) {
    let {
      protect, protectModuleID, permissions, settings
    } = callerEnv.scriptGlobals;
    let protectData = callerEnv.getProtectData();

    // If the function is a method of a protected object, call protect() in
    // order to check the signalPair (will throw on failure), and also to
    // get the new protectData to give to the new function environment.
    if (thisVal instanceof ProtectedObject) {
      protectData = protect(
        signalPair, protectModuleID, permissions, protectData, thisVal.moduleRef
      );
    }

    // Execute the function depending on its type.
    if (fun instanceof DeveloperFunction) {
      // If the called developer function has a signalPair, then call protect()
      // (again, if called already), and also reassign protectData the return
      // value.
      if (fun.signalPair !== undefined) {
        protectData = protect(
          fun.signalPair, protectModuleID, permissions, protectData
        );
      }

      // Then execute the dev function, with a first argument in the form of an
      // object with some standard members, followed by all the other inputs
      // in the inputArr.
      return fun.fun(
        {
          callerNode: callerNode, callerEnv: callerEnv, thisVal: thisVal,
          protectData: protectData, interpreter: this, settings: settings,
        },
        ...inputArr
      );
    }
    else if (fun instanceof DefinedFunction) {
      return this.executeDefinedFunction(
        fun.node, fun.decEnv, inputArr, callerNode, callerEnv,
        thisVal, protectData
      );
    }
    else throw new RuntimeError(
      "Function call with a non-function-valued expression",
      callerNode, callerEnv
    );
  }



  executeAsyncCallback(fun, inputArr, callerNode, callerEnv) {
    try {
      this.executeFunction(fun, inputArr, callerNode, callerEnv)
    }
    catch (err) {
      if (
        err instanceof ReturnException || err instanceof CustomException ||
        err instanceof OutOfGasError
      ) {
        let wasCaught = callerEnv.runNearestCatchStmtAncestor(err, callerNode);
        if (!wasCaught) {
          callerEnv.scriptGlobals.resolveScript(undefined, err);
        }
      } else {
        throw err;
      }
    }
  }





  executeDefinedFunction(
    funNode, funDecEnv, inputValueArr, callerNode, callerEnv,
    thisVal = undefined, protectData = undefined,
  ) {
    decrCompGas(callerNode, callerEnv);
    let scriptGlobals = callerEnv.scriptGlobals;

    // Initialize a new environment for the execution of the function. If the
    // function is an arrow function, check that it isn't called outside of the
    // "caller environment stack" that has its funDecEnv as an ancestor in the
    // stack.
    let newEnv;
    if (funNode.type = "arrow-function") {
      let isValid = callerEnv.isCallStackDescendentOf(funDecEnv);
      if (!isValid) throw new RuntimeError(
        "An arrow function was called outside of the call stack " +
        "in which it was declared. (Do not return arrow functions created " +
        "within a function, or use them as methods, or export them.)",
        callerNode, callerEnv
      );
      newEnv = new Environment(
        funDecEnv, "arrow-function", callerNode, callerEnv
      );
    }
    else {
      newEnv = new Environment(
        funDecEnv, "function", callerNode, callerEnv, thisVal, protectData
      );
    }

    // Add the input parameters to the environment (and turn all object inputs
    // immutable, unless wrapped in PassAsMutable()).
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
      else if (err instanceof BreakException) {
        throw new RuntimeError(
          `Invalid break statement outside of loop or switch-case statement`,
          err.node, err.environment
        );
      }
      else if (err instanceof ContinueException) {
        throw new RuntimeError(
          `Invalid continue statement outside of loop`,
          err.node, err.environment
        );
      }
      else throw err;
    }

    return undefined;
  }


  declareInputParameters(environment, params, inputArr) {
    params.forEach((param, ind) => {
      let paramName = param.ident;
      let paramVal = inputArr[ind];

      // If the input value is undefined, and the parameter has a default
      // value, use that value, evaluated at the time (each time) the function
      // is called. We use the same environment each time such that a parameter
      // can depend on a previous one.
      if (param.defaultExp && paramVal === undefined) {
        paramVal = this.evaluateExpression(param.defaultExp, environment);
      }

      // If the paramVal is wrapped in PassAsMutable(), we remove that wrapper,
      // and else we turn the paramVal immutable.
      if (paramVal instanceof PassAsMutable) {
        paramVal = paramVal.val;
      } else {
        paramVal = turnImmutable(paramVal);
      }

      // Then declare the parameter in the environment.
      environment.declare(paramName, paramVal, false, param);
    });
  }



  executeStatement(stmtNode, environment) {
    decrCompGas(stmtNode, environment);

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
      case "throw-statement": {
        let expVal = (!stmtNode.exp) ? undefined :
          this.evaluateExpression(stmtNode.exp, environment);
        throw new CustomException(expVal, stmtNode, environment);
      }
      case "try-catch-statement": {
        let tryCatchEnv = new Environment(
          environment, "try-catch",
          undefined, undefined, undefined, undefined,
          undefined, undefined,
          undefined,
          stmtNode.catchStmtArr, stmtNode.errIdent, stmtNode.numIdent,
        );
        try {
          stmtNode.tryStmtArr.forEach(stmt => {
            this.executeStatement(stmt, tryCatchEnv);
          });
        } catch (err) {
          if (err instanceof RuntimeError || err instanceof CustomException) {
            let catchEnv = new Environment(environment);
            catchEnv.declare(stmtNode.errIdent, err.val, false, stmtNode);
            if (stmtNode.numIdent) {
              catchEnv.declare(stmtNode.numIdent, 0, false, stmtNode);
            }
            try {
              stmtNode.catchStmt.forEach(stmt => {
                this.executeStatement(stmt, catchEnv);
              });
            } catch (err2) {
              if (err2 instanceof CustomException && err2.val === err.val) {
                throw err;
              } else {
                throw err2
              }
            }
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
      default: throw (
        "ScriptInterpreter.executeStatement(): Unrecognized " +
        `statement type: "${type}"`
      );
    }

  }




  evaluateExpression(expNode, environment) {
    decrCompGas(expNode, environment);

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
                return [newVal, newVal];
              }
            );
          case "+=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) + parseFloat(val);
                return [newVal, newVal];
              }
            );
          case "-=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) - parseFloat(val);
                return [newVal, newVal];
              }
            );
          case "*=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) * parseFloat(val);
                return [newVal, newVal];
              }
            );
          case "/=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) / parseFloat(val);
                return [newVal, newVal];
              }
            );
          case "&&=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = prevVal && val;
                return [newVal, newVal];
              }
            );
          case "||=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = prevVal || val;
                return [newVal, newVal];
              }
            );
          case "??=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = prevVal ?? val;
                return [newVal, newVal];
              }
            );
          default: throw (
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
              acc = parseInt(acc) << parseInt(nextVal);
              break;
            case ">>":
              acc = parseInt(acc) >> parseInt(nextVal);
              break;
            case ">>>":
              acc = parseInt(acc) >>> parseInt(nextVal);
              break;
            case "+":
              acc = (typeof acc === "string") ? acc + nextVal :
                parseFloat(acc) + parseFloat(nextVal);
              break;
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
            default: throw (
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
        return root ** exp;
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
                return [newVal, newVal];
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
            return typeof val;
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
          case "new":
            throw new RuntimeError(
              "'new' operator not implemented yet",
              expNode, environment
            );
          default: throw (
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
                return [newVal, prevVal];
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
                return [newVal, prevVal];
              }
            );
          default: throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
      }
      case "chained-expression": {
        let val;
        try {
          [val] = this.evaluateChainedExpression(
            expNode.rootExp, expNode.postfixArr, environment
          );
        }
        catch (err) {
          if (err instanceof BrokenOptionalChainException) {
            return undefined;
          } else {
            throw err;
          }
        }
        return val;
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
        let ret = Object.create(null);
        expNode.children.forEach(exp => {
          let safeIndex = this.getSafeIndex(
            postfix.ident, postfix.nameExp, environment
          );
          ret[safeIndex] = this.evaluateExpression(exp.valExp, environment);
        });
        return ret;
      }
      case "this-keyword": {
        return environment.getThisVal();
      }
      case "entity-reference": {
        return new EntityReference(expNode.id, expNode.placeholderPath);
      }
      case "exit-call": {
        // Send an "exit" signal to protect.
        let {protect, protectModuleID, permissions} = environment.scriptGlobals;
        let protectData = environment.getProtectData();
        protect(
          [INIT_PROTECT_DOC_ID, "exit"], protectModuleID, permissions,
          protectData
        );
        // Then evaluate the argument, record the resulting output, and throw
        // an exit exception.
        let expVal = (!expNode.exp) ? undefined :
          this.evaluateExpression(expNode.exp, environment);
        environment.scriptGlobals.resolveScript(expVal);
        throw new ExitException();
      }
      case "pass-as-mutable-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        if (Object.getPrototypeOf(expVal) === null || expVal instanceof Array) {
          return new PassAsMutable(expVal);
        } else {
          throw new RuntimeError(
            "PassAsMutable() called on with non-mutable argument"
          );
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
      default: throw (
        "ScriptInterpreter.evaluateExpression(): Unrecognized type: " +
        `"${type}"`
      );
    }
  }


  assignToVariableOrMember(expNode, environment, assignFun) {
    if(expNode.type !== "chained-expression") throw new RuntimeError(
      "Invalid assignment", expNode, environment
    );
    let postfixArrLen = expNode.postfixArr.length;
    if (postfixArrLen === 0) {
      if(expNode.rootExp.type !== "identifier") throw new RuntimeError(
        "Invalid assignment", expNode, environment
      );
      return environment.assign(
        expNode.rootExp.ident, expNode.rootExp, assignFun
      );
    }
    else {
      let lastPostfix = expNode.postfixArr.at(-1);
      if (lastPostfix.type !== "member-accessor") throw new RuntimeError(
        "Invalid assignment", expNode, environment
      );
      if (lastPostfix.isOpt) throw new RuntimeError(
        "Invalid use of optional chaining for the last member accessor in " +
        "an assignment",
        expNode, environment
      );
      let prevVal, objVal, safeIndex;
      try {
        [prevVal, objVal, safeIndex] = this.evaluateChainedExpression(
          expNode.rootExp, expNode.postfixArr, environment, true
        );
      }
      catch (err) {
        // Unlike what JS currently does, we do not throw when assigning to
        // a broken optional chaining. Instead we simply do nothing, and return
        // undefined from the assignment expression.
        if (err instanceof BrokenOptionalChainException) {
          return undefined;
        } else {
          throw err;
        }
      }

      // Then assign newVal to the member of objVal and return ret, where
      // newVal and ret are both specified by the assignFun.
      let [newVal, ret] = assignFun(prevVal);
      objVal[safeIndex] = newVal;
      return ret;
    }
  }


  // evaluateChainedExpression() => [val, objVal, safeIndex], or throws
  // a BrokenOptionalChainException. Here, val is the value of the whole
  // expression, and objVal, is the value of the object before the last member
  // accessor (if the last postfix is a member accessor and not a tuple).
  evaluateChainedExpression(rootExp, postfixArr, environment, forAssignment) {
    let val = this.evaluateExpression(rootExp, environment);
    let len = postfixArr.length;
    if (len === 0) {
      return [val];
    }
    decrCompGas(rootExp, environment);

    // Evaluate the chained expression accumulatively, one postfix at a time. 
    let postfix, objVal, thisVal, safeIndex, signal;
    let protectData = environment.getProtectData();
    for (let i = 0; i < len; i++) {
      postfix = postfixArr[i];

      // If postfix is a member accessor, get the member value, and assign the
      // current val to objVal.
      if (postfix.type === "member-accessor") {
        objVal = thisVal = val;
        signal = undefined;

        // Throw a BrokenOptionalChainException if an optional chaining is
        // broken.
        if (postfix.isOpt && (val === undefined || val === null)) {
          throw new BrokenOptionalChainException();
        }

        // Else, first get the safe index (safe from object injection) and
        // throw if it is not a string or a number.
        safeIndex = this.getSafeIndex(postfix.ident, postfix.exp, environment);

        // If objVal is regular object or array, just get the member.
        if (Object.getPrototypeOf(objVal) === null || objVal instanceof Array) {
          val = objVal[safeIndex];
        }

        // Else if it is an instance of Immutable, also get the member, but
        // turn it Immutable of it is not so already. And throw if forAssignment
        // = true.
        else if (objVal instanceof Immutable) {
          val = turnImmutable(objVal.val[safeIndex]);
          if (forAssignment) throw new RuntimeError(
            "Assignment to a member of an immutable object",
            postfix, environment
          );
        }

        // Else if the object is wrapped in PassAsMutable(), simply get the
        // member.
        else if (objVal instanceof PassAsMutable) {
          val = objVal.val[safeIndex];
        }

        // Else if objVal is a protected object, get the public method/property,
        // or the protected or private property with some additional checks.
        else if (objVal instanceof ProtectedObject) {
          // We first of all want to check that the object isn't being used
          // outside of its own declaration environment call stack.
          let isValid = environment.isCallStackDescendentOf(objVal.decEnv);
          if (!isValid) throw new RuntimeError(
            "A protected object was used outside of the " +
            "environment call stack in which it was defined",
            postfix, environment
          );

          // Then first look in the private members, and if one is found, check
          // that rootExp is a 'this' keyword, and that i === 1.
          [val, docID, signal] = objVal.privateMembers[safeIndex];
          if (val !== undefined) {
            if (i !== 1 || rootExp.type !== "this-keyword") {
              throw new RuntimeError(
                "Trying to access a private member from outside a protected " +
                "object",
                postfix, environment
              );
            }

            // Also, if the accessed member is a method, check that the user
            // isn't trying to assign to it.
            if (
              val instanceof DeveloperFunction || val instanceof DefinedFunction
            ) {
              if (forAssignment) throw new RuntimeError(
                "Assignment to a read-only private method",
                postfix, environment
              );
            }

            // And if it is a private attribute, either emit a "get" or a
            // "set" signal, depending on whether it is accessed forAssignment
            // or not. 
            else {
              let {protect, protectModuleID, permissions} =
                environment.scriptGlobals;
              protectData = protect(
                [INIT_PROTECT_DOC_ID, forAssignment ? "set" : "get"],
                protectModuleID, permissions, protectData, objVal.moduleRef
              );
            }
          }

          // Else look in the protected members.
          else {
            [val, docID, signal] = objVal.protectedMembers[safeIndex];

            // And throw if the user tries to assign to a non-private member,
            if (val !== undefined && forAssignment) throw new RuntimeError(
              "Assignment to a read-only non-private member of a " +
              "protected object",
              postfix, environment
            );
          }

          // Then if val is defined and is a method (function-valued), check
          // that it is also called immediately, as the methods of protected
          // objects cannot be accessed without being called immediately.
          if (
            val instanceof DeveloperFunction || val instanceof DefinedFunction
          ) {
            if (postfixArr[i + 1]?.type !== "expression-tuple") {
              throw new RuntimeError(
                "Cannot access a method of a protected object without " +
                "calling it",
                postfix, environment
              );
            }
          }

          // Then finally, if a value was found, and with a truthy signal, emit
          // that signal to protect(), together with the protectModuleID of the
          // protected object, which defines the meaning of the signal.
          if (val !== undefined && signal !== "") {
            let {protect, permissions} = environment.scriptGlobals;
            protectData = protect(
              [docID, signal], protectModuleID, permissions, protectData,
              objVal.moduleRef
            );
          }
        }

        // Else throw if objVal is not an (accessible) object at all.
        else throw new RuntimeError(
          "Trying to access a member of a non-object",
          postfix, environment
        );
      }

      // Else if postfix is an expression tuple, execute the current val as a
      // function, and reassign it to the return value.
      else if (postfix.type === "expression-tuple") {
        // Throw if assigning to a chained expression including a function call,
        // as functions will always return something immutable anyway.
        if (forAssignment) throw new RuntimeError(
          "Assignment to a member of an immutable object",
          postfix, environment
        );

        // Throw if val is not a function.
        if (
          !(val instanceof DefinedFunction || val instanceof DeveloperFunction)
        ) {
          throw new RuntimeError(
            "Call to a non-function", postfix, environment
          );
        }

        // Evaluate the expressions inside the tuple.
        let inputExpArr = postfix.children;
        let inputValArr = inputExpArr.map(exp => (
          this.evaluateExpression(exp, environment)
        ));

        // Then execute the function and assign its return value, turned
        // immutable, to val.
        val = turnImmutable(
          this.executeFunction(
            val, inputValArr, postfix, environment, thisVal, signal
          )
        );
      }
      else throw "evaluateChainedExpression(); Unrecognized postfix type";
    }

    // Finally return val and objVal, which should now respectively hold the
    // value of the full expression and the value of the object before the
    // last member access, or undefined if the last postfix was an expression
    // tuple. Also return the safeIndex.
    return [val, objVal, safeIndex];
  }


  getSafeIndex(ident = undefined, exp = undefined, environment) {
    let index = ident;
    if (exp) index = this.evaluateExpression(exp, environment);
    if (typeof index !== "string" && typeof index !== "number") {
      throw new RuntimeError(
        "Indexing with a value that is not a string or a number",
        postfix, environment
      );
    }
    return (parseInt(index) == index) ? index : "&" + index;
  }

}









export class Environment {
  constructor(
    parent = undefined, scopeType = "block",
    callerNode = undefined, callerEnv = undefined, thisVal = undefined,
    protectData = undefined,
    moduleID = undefined, protectModuleID = undefined,
    scriptGlobals = undefined,
    catchStmtArr = undefined, errIdent, numIdent,
  ) {
    this.parent = parent;
    this.scopeType = scopeType;
    this.variables = {};
    if (scopeType === "function") {
      this.callerNode = callerNode;
      this.callerEnv = callerEnv;
      if (thisVal) this.thisVal = thisVal;
      if (protectData) this.protectData = protectData;
    }
    else if (scopeType === "module") {
      this.moduleID = moduleID;
      this.protectModuleID = protectModuleID;
      this.protectData = {moduleID: moduleID};
      this.exports = [];
      this.liveModule = undefined;
    }
    else if (scopeType === "try-catch") {
      this.catchStmtArr = catchStmtArr;
      this.errIdent = errIdent;
      this.numIdent = numIdent;
      this.numOfAsyncExceptions = 0;
    }
    this.scriptGlobals = scriptGlobals ?? parent?.scriptGlobals ?? (() => {
      throw "Environment: No scriptGlobals object provided";
    })();
  }

  declare(ident, val, isConst, node, nodeEnvironment = this) {
    val = (val === undefined) ? UNDEFINED : val;
    let safeIdent = "&" + ident;
    let [prevVal] = this.variables[safeIdent] ?? [];
    if (prevVal !== undefined) {
      throw new RuntimeError(
        "Redeclaration of variable '" + ident + "'",
        node, nodeEnvironment
      );
    } else {
      this.variables[safeIdent] = [val, isConst];
    }
  }

  get(ident, node, nodeEnvironment = this) {
    let safeIdent = "&" + ident;
    let [val] = this.variables[safeIdent] ?? [];
    if (val !== undefined) {
      return (val === UNDEFINED) ? undefined : val;
    }
    else if (this.parent) {
      let val = parent.get(ident, node, nodeEnvironment);
      if (this.scopeType === "function") {
        return turnImmutable(val);
      }
    }
    else {
      throw new RuntimeError(
        `Undeclared variable "${ident}"`,
        node, nodeEnvironment
      );
    }
  }

  assign(ident, assignFun, node, nodeEnvironment = this) {
    let safeIdent = "&" + ident;
    let [prevVal, isConst] = this.variables[safeIdent] ?? [];
    if (isConst) throw new RuntimeError(
      "Reassignment of constant variable or function '" + ident + "'",
      node, this
    );
    if (prevVal !== undefined) {
      let [newVal, ret] = assignFun(prevVal);
      newVal = (newVal === undefined) ? UNDEFINED : newVal;
      this.variables[safeIdent][0] = newVal;
      return ret;
    }
    else if (this.parent) {
      if (this.scopeType === "function") {
        // Throw `Undeclared variable "${ident}"` error if the variable is
        // undefined.
        this.get(ident, node, nodeEnvironment);

        // And else throw an error stating that you cannot assign to a non-
        // local variable. 
        throw new RuntimeError(
          `Assignment to a variable, "${ident}", from outside the local ` +
          "function scope",
          node, nodeEnvironment
        );
      }
      else {
        return this.parent.assign(ident, assignFun, node, nodeEnvironment);
      }
    }
    else {
      throw new RuntimeError(
        `Undeclared variable "${ident}"`,
        node, nodeEnvironment
      );
    }
  }


  getThisVal() {
    let thisVal = this.thisVal;
    if (thisVal !== undefined) {
      return (val === UNDEFINED) ? undefined : val;
    }
    else if (this.scopeType !== "function" && this.parent) {
      return this.parent.getThisVal();
    }
    else {
      return undefined;
    }
  }

  getProtectData() {
    let protectData = this.protectData;
    if (protectData !== undefined) {
      return protectData;
    }
    else if (this.scopeType !== "function" && this.parent) {
      return this.parent.getProtectData();
    }
    else {
      return this.callerEnv.getProtectData();
    }
  }

  isCallStackDescendentOf(decEnv) {
    let curCallerEnv = this;
    let isDescendent = (curCallerEnv === decEnv);
    while (!isDescendent) {
      curCallerEnv = curCallerEnv.callerEnv ?? curCallerEnv.parent;
      if (!curCallerEnv) break;
      isDescendent = (curCallerEnv === decEnv);
    }
    return isDescendent;
  }


  export(
    ident, alias = ident, node, signal = undefined, isPrivate = undefined,
    nodeEnvironment = this
  ) {
    let prevExport = this.exports["&" + alias];
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
    this.exports.push([alias, turnImmutable(val), signal, isPrivate]);
  }

  getLiveModule() {
    if (!this.liveModule ) {
      let liveModule = this.liveModule = {
        protectModuleID: this.protectModuleID
      };
      this.exports.forEach(([alias, val, signal, isPrivate]) => {
        liveModule["&" + alias] = [val, signal, isPrivate];
      });
    }
    return this.liveModule;
  }


  runNearestCatchStmtAncestor(err, node, nodeEnvironment = this) {
    if (this.scopeType === "try-catch") {
      let {interpreter} = this.scriptGlobals;
      let catchEnv = new Environment(this.parent);
      catchEnv.declare(this.errIdent, err.val, false);
      if (stmtNode.numIdent) {
        catchEnv.declare(this.numIdent, ++this.numOfAsyncExceptions, false);
      }
      try {
        stmtNode.catchStmt.forEach(stmt => {
          interpreter.executeStatement(stmt, catchEnv);
        });
      } catch (err2) {
        if (err2 instanceof CustomException && err2.val === err.val) {
          throw err;
        } else {
          throw err2
        }
      }
      return true;
    }
    else if (this.scopeType === "function") {
      return this.callerEnv.runNearestCatchStmtAncestor(
        err, node, nodeEnvironment
      );
    }
    else if (this.parent) {
      return this.parent.runNearestCatchStmtAncestor(
        err, node, nodeEnvironment
      );
    }
    else return false;
  }

}



function getSafeObj(obj) {
  if (!obj || typeof object !== "object") {
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map(val => getSafeObj(val));
  } else {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => ["&" + key, getSafeObj(val)])
    );
  }
}


function turnImmutable(val) {
  if (Object.getPrototypeOf(val) === null || val instanceof Array) {
    return new Immutable(val);
  } else {
    return val;
  }
}




export function payGas(node, environment, gasCost) {
  let gas = environment?.scriptGlobals.gas ?? environment;
  Object.keys(this.gasCost).forEach(key => {
    if (gas[key] ??= 0) {
      gas[key] -= gasCost[key];
    }
    if (gas[key] < 0) throw new OutOfGasError(
      "Ran out of " + GAS_NAMES[key] + "gas",
      node, environment,
    );
  });
}

export function decrCompGas(node, environment) {
  let gas = environment?.scriptGlobals.gas ?? environment;
  if (0 > --gas.comp) throw new OutOfGasError(
    "Ran out of " + GAS_NAMES.comp + " gas",
    node, environment,
  );
}
export function decrGas(node, environment, gasName) {
  let gas = environment?.scriptGlobals.gas ?? environment;
  if (0 > --gas[gasName]) throw new OutOfGasError(
    "Ran out of " + GAS_NAMES[gasName] + " gas",
    node, environment,
  );
}


// TODO: Correct.
export function getType(val) {
  let jsType = typeof val;
  if (jsType === "object") {
    if (Array.isArray(val)) {
      return "array"
    } else if (val === null) {
      return "null";
    } else if (
      val instanceof EntityReference // || val instanceof EntityPlaceholder
    ) {
      return "entity";
    } else if (
      val instanceof DefinedFunction || val instanceof DeveloperFunction
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
    val instanceof DefinedFunction || val instanceof DeveloperFunction ||
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

export class DeveloperFunction {
  constructor(signalPair = undefined, fun) {
    if (!fun) {
      fun = signalPair;
      signalPair = undefined;
    }
    this.fun = fun;
    if (signalPair) this.signalPair = signalPair;
  }
}

export class EntityReference {
  constructor(id, placeholderPath) {
    if (id) this.id = id;
    if (placeholderPath) this.placeholderPath = placeholderPath;
  }
}

export class ProtectedObject {
  constructor(
    moduleID, protectModuleID, decEnv, privateMembers, protectedMembers,
  ) {
    this.moduleRef = new EntityReference(moduleID);
    this.protectModuleID = protectModuleID;
    this.decEnv = decEnv;
    // prt./prv. member := [propVal : any, docID: ID, signal : string].
    this.privateMembers = privateMembers;
    this.protectedMembers = protectedMembers;
  }
}

export class Immutable {
  constructor(val) {
    this.val = val;
  }
}

export class PassAsMutable {
  constructor(val) {
    this.val = val;
  }
}


export class ScriptEntity {
  constructor(scriptNode, id, creatorID, isEditable, whitelistID = "0") {
    this.scriptNode = scriptNode;
    this.id = id;
    this.creatorID = creatorID;
    this.isEditable = isEditable;
    this.whitelistID = whitelistID;
  }
}
export class ExpressionEntity {
  constructor(expNode, id, creatorID, isEditable, whitelistID = "0") {
    this.expNode = expNode;
    this.id = id;
    this.creatorID = creatorID;
    this.isEditable = isEditable;
    this.whitelistID = whitelistID;
  }
}
export class FormalEntity {
  constructor(
    funEntID, inputArr, id, creatorID, isEditable, whitelistID = "0"
  ) {
    this.funEntID = funEntID;
    this.inputArr = inputArr;
    this.id = id;
    this.creatorID = creatorID;
    this.isEditable = isEditable;
    this.whitelistID = whitelistID;
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




export class LoadError {
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
}

export class OutOfGasError {
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
}

export class RuntimeError {
  constructor(val, node, environment) {
    this.val = val;
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
