
import {scriptParser} from "./parsing/ScriptParser.js";
import {
  LexError, SyntaxError, getExtendedErrorMsg as getExtendedErrorMsgHelper,
  getLnAndCol,
} from "./parsing/Parser.js";
import {
  exitSignal, moduleObjectSignal
} from "../dev_lib/signals/fundamental_signals.js";


// // Following module paths are substituted by "module mapping webpack plugin."
// import {
//   IS_SERVER_SIDE, getDevLibPath, stdProtect, stdSignalDocName
// } from "interpreter_config";


export {LexError, SyntaxError};


// const INIT_PROTECT_DOC_ID = "10";
// const INIT_DEV_LIB_DOC_ID = "11";

// const MAX_ARRAY_INDEX = 1E+15;
const MINIMAL_TIME_GAS = 10;

const GAS_NAMES = {
  comp: "computation",
  import: "import",
  fetch: "fetching",
  dbRead: "DB fetching",
  time: "time",
  conn: "connection",
  mkdir: "directory creation",
};

export function getParsingGasCost(str) {
  return {comp: str.length / 100 + 1};
}

// let CAN_EXIT_SIGNAL; // is defined below.




export class ScriptInterpreter {

  constructor(
    isServerSide = false, fetchScript = async () => {},
    staticDevLibs = new Map(), devLibURLs = new Map(),
  ) {
    this.isServerSide = isServerSide;
    this.fetchScript = fetchScript;
    this.staticDevLibs = staticDevLibs;
    this.devLibURLs = devLibURLs;
  }

  async interpretScript(
    gas, script = "", scriptPath = null, mainInputs = [], reqUserID = null,
    enclosedFunctions = new Map(), initSignals = new Map(),
    signalModifications = new Map(),
    parsedScripts = new Map(), liveModules = new Map(),
  ) {
    let scriptVars = {
      gas: gas, log: {}, scriptPath: scriptPath, reqUserID: reqUserID,
      enclosedFunctions: enclosedFunctions, initSignals: initSignals,
      signalModifications: signalModifications,
      isExiting: false, resolveScript: undefined, interpreter: this,
      parsedScripts: parsedScripts, liveModules: liveModules,
    };

    // First create a global environment, which is used as a parent environment
    // for all modules.
    let globalEnv = new Environment( 
      undefined, "global", {scriptVars: scriptVars},
    );

    // If script is provided, rather than the scriptPath, first parse it.
    let parsedScript, lexArr, strPosArr;
    if (scriptPath === null) {
      payGas(null, globalEnv, false, {comp: getParsingGasCost(script)});
      let scriptSyntaxTree;
      [scriptSyntaxTree, lexArr, strPosArr] = scriptParser.parse(script);
      if (scriptSyntaxTree.error) {
        return [
          undefined, {error: scriptSyntaxTree.error},
        ];
      }
      parsedScript = scriptSyntaxTree.res;
      parsedScripts.set(scriptPath, [parsedScript, lexArr, strPosArr, script]);
    }
    // Else fetch and parse the script first thing.
    else {
      [parsedScript, lexArr, strPosArr, script] = await this.fetchParsedScript(
        scriptPath, parsedScripts, undefined, globalEnv
      );
    }

    // Create a promise to get the output and log, and store a modified
    // resolve() callback on scriptVars (which is contained by globalEnv).
    // This promise is resolved when the user calls the exit() function.
    let outputAndLogPromise = new Promise(resolve => {
      scriptVars.resolveScript = (output, error) => {
        let {log} = scriptVars;
        if (!log.error) log.error = error;
        scriptVars.isExiting = true;
        resolve([output, log]);
      };
    });


    // Now execute the script as a module, followed by an execution of any
    // function called 'main,' or the default export if no 'main' function is
    // found, and make sure to try-catch any exceptions or errors.
    try {
      let [liveScriptModule, scriptEnv] = await this.executeModule(
        parsedScript, lexArr, strPosArr, script, scriptPath, globalEnv
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
        scriptVars.resolveScript(undefined, err);
      } else if (err instanceof ReturnException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
          "Cannot return from outside of a function",
          err.node, err.environment
        ));
      } else if (err instanceof CustomException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
          `Uncaught exception: "${err.val.toString()}"`,
          err.node, err.environment
        ));
      } else if (err instanceof BreakException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
          `Invalid break statement outside of loop or switch-case statement`,
          err.node, err.environment
        ));
      } else if (err instanceof ContinueException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
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
    if (scriptVars.isExiting) {
      return await outputAndLogPromise;
    }

    // Else we create and wait for a promise for obtaining the output and log,
    // which might be resolved by a custom callback function within the script,
    // waiting to be called, possibly after some data has been fetched. We also
    // set a timer dependent on gas.time, which might resolve the log with an
    // error first.
    else {
      if (gas.time < MINIMAL_TIME_GAS) {
        scriptVars.resolveScript(undefined, new OutOfGasError(
          "Ran out of " + GAS_NAMES.time + " gas (no exit statement reached)",
          parsedScript, globalEnv,
        ));
      }
      else if (gas.time !== Infinity) {
        // Set an expiration time after which the script resolves with an
        // error. 
        setTimeout(
          () => {
            scriptVars.resolveScript(undefined, new OutOfGasError(
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





  async fetchParsedScript(
    scriptPath, parsedScripts, callerNode, callerEnv
  ) {
    let parsedScript, lexArr, strPosArr, script;
    [parsedScript, lexArr, strPosArr, script] = parsedScripts.get(scriptPath);
    if (!parsedScript) {
      let {reqUserID} = callerEnv.scriptVars;
      try {
       script = await this.fetchScript(scriptPath, reqUserID);
      } catch (err) {
        throw new LoadError(err, callerNode, callerEnv);
      }
      if (typeof script !== "string") throw new LoadError(
        `No script was found at ${scriptPath}`,
        callerNode, callerEnv
      );
      payGas(callerNode, callerEnv, false, {comp: getParsingGasCost(script)});
      let scriptSyntaxTree;
      [scriptSyntaxTree, lexArr, strPosArr] = scriptParser.parse(script);
      parsedScript = scriptSyntaxTree.res;
      if (scriptSyntaxTree.error) throw scriptSyntaxTree.error;
      parsedScripts.set(scriptPath, [parsedScript, lexArr, strPosArr, script]);
    }
    return [parsedScript, lexArr, strPosArr, script];
  }







  async executeModule(
    moduleNode, lexArr, strPosArr, script, modulePath, globalEnv
  ) {
    decrCompGas(moduleNode, globalEnv);

    // Create a new environment for the module.
    let moduleEnv = new Environment(
      globalEnv, "module", {
       modulePath: modulePath, lexArr: lexArr, strPosArr: strPosArr,
       script: script,
      }
    );

    // Run all the import statements in parallel and get their live
    // environments, but without making any changes to moduleEnv yet.
    let liveSubmoduleAndPathArr = await Promise.all(
      moduleNode.importStmtArr.map(impStmt => (
        this.executeSubmoduleOfImportStatement(
          impStmt, modulePath, moduleEnv, globalEnv
        )
      ))
    );

    // We then run all the import statements again, this time where each
    // import statement is paired with the environment from the already
    // executed module, and where the changes are now made to moduleEnv.
    moduleNode.importStmtArr.forEach((impStmt, ind) => {
      let [liveSubmodule, submodulePath] = liveSubmoduleAndPathArr[ind];
      this.finalizeImportStatement(
        impStmt, liveSubmodule, submodulePath, isProtected, moduleEnv
      );
    });

    // Then execute the body of the script, consisting of "outer statements"
    // (export statements as well as normal statements).
    moduleNode.stmtArr.forEach((stmt) => {
      this.executeOuterStatement(stmt, moduleEnv);
    });

    // And finally get the exported "live module," and return it.
    return [moduleEnv.getLiveModule(), moduleEnv];
  }




  async executeSubmoduleOfImportStatement(
    impStmt, curModulePath, callerModuleEnv, globalEnv
  ) {
    decrCompGas(impStmt, globalEnv);
    decrGas(impStmt, globalEnv, "import");
    let {liveModules, parsedScripts} = globalEnv.scriptVars;

    // If the module has already been executed, we can return early.
    let submodulePath = getFullPath(curModulePath, impStmt.str);
    let isProtectedPath = submodulePath.slice(-10) === "?protected";
    let [liveModule, isProtectedDevMod] = liveModules.get(submodulePath);
    if (liveModule) {
      let isProtected = isProtectedDevMod || isProtectedPath;
      return [liveModule, submodulePath, isProtected];
    }

    // If the module reference is a dev library reference, which always comes
    // in the form of a bare module specifier (left over in the build step, if
    // any), try to import the given library.
    if (submodulePath[0] !== "/") {
      let devMod, devLibURL;
      [devMod, isProtectedDevMod] = this.staticDevLibs.get(submodulePath);
      if (!devMod) {
        [devMod, isProtectedDevMod] = this.devLibURLs.get(submodulePath);
        if (!devLibURL) throw new LoadError(
          `Developer library "${submodulePath}" not found`,
          impStmt, callerModuleEnv
        );
        try {
          devMod = await import(devLibURL);
        } catch (err) {
          throw new LoadError(
            `Developer library "${submodulePath}" not found`,
            impStmt, callerModuleEnv
          );
        }
      }

      // If the dev library module was found, create a "liveModule" object from
      // it, store it in the liveModules buffer, and return it. 
      let liveModule = new Map();
      Object.entries(devMod).forEach(([key, val]) => {
        // If a dev library exports a function, it is meant only for other dev
        // libraries, so we filter all those out here. 
        if (!(val instanceof Function)) {
          liveModule.set(key, val);
        }

        // And if the imported object is an extension of the JSXInstance class,
        // we also give it the componentPath property equal to submodulePath +
        // "." + key.
        if (val.isJSXComponent) {
          val.componentPath = submodulePath + "." + `${key}`;
        }
      });
      liveModules.set(submodulePath, [liveModule, isProtectedDevMod]);
      let isProtected = isProtectedDevMod || isProtectedPath;
      return [liveModule, submodulePath, isProtected];
    }

    // Else if the module is a user module, first try to get it from the
    // parsedScripts buffer, then try to fetch it from the database.
    let [
      submoduleNode, lexArr, strPosArr, script
    ] = await this.fetchParsedScript(
      submodulePath, parsedScripts, impStmt, callerModuleEnv
    );

    // Then execute the module, inside the global environment, and return the
    // resulting liveModule, after also adding it to liveModules.
    [liveModule] = await this.executeModule(
      submoduleNode, lexArr, strPosArr, script, submodulePath, globalEnv
    );
    isProtected = submodulePath.slice(-10) === "?protected";
    liveModules.set(submodulePath, [liveModule]);
    return [liveModule, submodulePath, isProtected];
  }




  finalizeImportStatement(
    impStmt, liveSubmodule, submodulePath, isProtected, curModuleEnv
  ) {
    decrCompGas(impStmt, curModuleEnv);

    // Iterate through all the imports and add each import to the environment.
    impStmt.importArr.forEach(imp => {
      let impType = imp.importType
      let moduleObject = new LiveModule(
        submodulePath, curModuleEnv.scriptVars.enclosedModules, liveSubmodule
      );
      if (impType === "namespace-import") {
        curModuleEnv.declare(imp.ident, moduleObject, true, imp);
      }
      else if (impType === "named-imports") {
        imp.namedImportArr.forEach(namedImp => {
          let ident = namedImp.ident ?? "default";
          let alias = namedImp.alias ?? ident;
          let val = moduleObject.members.get(ident);
          curModuleEnv.declare(alias, val, true, namedImp);
        });
      }
      else if (impType === "default-import") {
        let val = liveSubmodule.get("default");
        if (isProtected && val instanceof FunctionObject) {
          val = new PrivilegedFunction(val, moduleObject);
        }
        curModuleEnv.declare(imp.ident, val, true, imp);
      }
      else throw "finalizeImportStatement(): Unrecognized import type";
    });
  }





  executeOuterStatement(stmtNode, environment) {
    let type = stmtNode.type;
    if (type === "export-statement") {
      this.executeExportStatement(stmtNode, environment);
    } else {
      this.executeStatement(stmtNode, environment);
    }
  }


  executeExportStatement(stmtNode, environment) {
    decrCompGas(stmtNode, environment);

    if (stmtNode.subtype === "variable-export") {
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







  executeMainFunction(
    liveScriptModule, inputArr, scriptNode, scriptEnv
  ) {
    let mainFun = liveScriptModule.get("main") ?? [];
    if (mainFun === undefined) {
      mainFun = liveScriptModule.get("default") ?? [];
    }
    if (mainFun !== undefined) {
      return this.executeFunction(
        mainFun, inputArr,
        mainFun instanceof DefinedFunction ? mainFun.node : scriptNode,
        scriptEnv
      );
    }
    // If no main function was found, simply do nothing (expecting the script
    // to eventually exit itself via a callback function (or timing out)).
    return;
  }





  executeFunction(fun, inputArr, callerNode, callerEnv, thisVal) {
    decrCompGas(callerNode, callerEnv);

    // If the function is an arrow function, check that it isn't called outside
    // of the "environmental call stack" that has its fun.decEnv as an ancestor
    // in the stack.
    if (fun.isArrowFun) {
      let isValid = callerEnv.isCallStackDescendentOf(fun.decEnv);
      if (!isValid) throw new RuntimeError(
        "An arrow function was called outside of the " +
        "environmental call stack in which it was declared.",
        callerNode, callerEnv
      );
    }

    // Initialize a new environment for the execution of the function.
    let execEnv = new Environment(
      fun.decEnv, "function", {
        fun: fun, callerNode: callerNode, callerEnv: callerEnv, thisVal: thisVal
      }
    );

    // Then execute the function depending on its type.
    if (fun instanceof DevFunction) {
      return this.executeDevFunction(
        devFun, inputArr, callerNode, execEnv, thisVal
      );
    }
    else if (fun instanceof DefinedFunction) {
      return this.executeDefinedFunction(
        fun.node, inputArr, execEnv
      );
    }
    else throw new RuntimeError(
      "Function call to a non-function",
      callerNode, callerEnv
    );
  }



  executeDevFunction(devFun, inputArr, callerNode, execEnv, thisVal) {
    let execVars = {
      callerNode: callerNode, callerEnv: execEnv, thisVal: thisVal,
      interpreter: this,
    };
    let {isAsync, minArgNum} = devFun;

    // If the dev function an async function, call it and then either return a
    // PromiseObject to the user or call a user-provided callbackFun depending
    // on the inputArr and on minArgNum.
    if (isAsync) {
      // If the argument number exceeds minArgNum and the last argument is a
      // function, then treat this last argument as the callback to call when
      // the promise is ready.
      let lastArg = inputArr.at(-1);
      if (
        (minArgNum ?? 0) <= inputArr.length &&
        lastArg instanceof FunctionObject
      ) {
        let callbackFun = lastArg;
        let promise = devFun.fun(execVars, inputArr.slice(0, -1));
        this.handlePromise(promise, callbackFun, callerNode, callerEnv);
      }

      // And if not, simply return the promise wrapped in PromiseObject().
      else {
        let promise = devFun.fun(execVars, inputArr);
        return new PromiseObject(promise);
      }
    }

    // Else call the dev function synchronously and return what it returns.
    else {
      return devFun.fun(execVars, inputArr);
    }
  }


  handlePromise(promise, callbackFun, callerNode, callerEnv) {
    promise.then(res => {
      this.executeAsyncCallback(callbackFun, [res], callerNode, callerEnv);
    }).catch(err => {
      this.throwAsyncException(err, callerNode, callerEnv);
    });
  }



  executeAsyncCallback(fun, inputArr, callerNode, callerEnv) {
    if (callerEnv.scriptVars.isExiting) {
      throw new ExitException();
    }
    try {
      this.executeFunction(fun, inputArr, callerNode, callerEnv);
    }
    catch (err) {
      if (
        err instanceof ReturnException || err instanceof CustomException ||
        err instanceof OutOfGasError
      ) {
        let wasCaught = callerEnv.runNearestCatchStmtAncestor(err, callerNode);
        if (!wasCaught) {
          callerEnv.scriptVars.resolveScript(undefined, err);
        }
      } else {
        throw err;
      }
    }
  }

  throwAsyncException(err, callerNode, callerEnv) {
    let wasCaught = callerEnv.runNearestCatchStmtAncestor(err, callerNode);
    if (!wasCaught) {
      callerEnv.scriptVars.resolveScript(undefined, err);
    }
  }






  executeDefinedFunction(funNode, inputValueArr, execEnv) {
    // Add the input parameters to the environment (and turn all object inputs
    // immutable, unless wrapped in PassAsMutable()).
    this.declareInputParameters(execEnv, funNode.params, inputValueArr);

    // Now execute the statements inside a try-catch statement to catch any
    // return exception, or any uncaught break or continue exceptions. On a
    // return exception, return the held value. 
    let stmtArr = funNode.body.stmtArr;
    try {
      stmtArr.forEach(stmt => this.executeStatement(stmt, execEnv));
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
        let {catchStmtArr, errIdent, numIdent} = stmtNode;
        let tryCatchEnv = new Environment(
          environment, "try-catch", {
            catchStmtArr: catchStmtArr, errIdent: errIdent, numIdent: numIdent,
          }
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
        return new DefinedFunction(funNode, environment);
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
          // TODO: Reimplement these to be short-circuiting.
          // case "&&=":
          //   return this.assignToVariableOrMember(
          //     expNode.exp1, environment, prevVal => {
          //       let newVal = prevVal && val;
          //       return [newVal, newVal];
          //     }
          //   );
          // case "||=":
          //   return this.assignToVariableOrMember(
          //     expNode.exp1, environment, prevVal => {
          //       let newVal = prevVal || val;
          //       return [newVal, newVal];
          //     }
          //   );
          // case "??=":
          //   return this.assignToVariableOrMember(
          //     expNode.exp1, environment, prevVal => {
          //       let newVal = prevVal ?? val;
          //       return [newVal, newVal];
          //     }
          //   );
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
            case "==": {
              let a = acc, n = nextVal;
              if (a instanceof ValueWrapper) {
                a = acc.val;
              }
              if (n instanceof ValueWrapper) {
                n = nextVal.val;
              }
              acc = (op === "==") ? (a == n) : (a === n);
              break;
            }
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
        let ret = new Map();
        expNode.children.forEach((exp, ind) => {
          ret.set(ind, this.evaluateExpression(exp, environment));
        });
        return ret;
      }
      case "object": {
        let ret = new Map();
        expNode.members.forEach(member => {
          let index = member.ident;
          if (index === undefined) {
            index = this.evaluateExpression(member.keyExp, environment);
          }
          ret.set(index, this.evaluateExpression(member.valExp, environment));
        });
        return ret;
      }
      case "jsx-element": {
        return new JSXElement(expNode, environment, this);
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
      case "this-keyword": {
        return environment.getThisVal();
      }
      case "exit-call": {
        // Evaluate the argument.
        let expVal = (!expNode.exp) ? undefined :
          this.evaluateExpression(expNode.exp, environment);
        let {resolveScript} = environment.scriptVars;
        // Check the can-exit signal, before resolving the script.
        environment.emitSignal(WILL_EXIT_SIGNAL, node);
        resolveScript(expVal);
        // Throw an exit exception.
        throw new ExitException();
      }
      case "pass-as-mutable-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        if (expVal.set instanceof Function) {
          return new PassAsMutable(expVal);
        } else {
          throw new RuntimeError(
            "passAsMutable() called with a non-mutable argument"
          );
        }
      }
      case "promise-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        return new PromiseObject(expVal, this, expNode.exp, environment);
      }
      case "promise-all-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        if (!(expVal.values instanceof Function)) throw new RuntimeError(
          "Expression is not iterable",
          expNode.exp, environment
        );
        return new PromiseObject(Promise.all(
          expVal.values().map((promiseObject, key) => {
            if (promiseObject instanceof PromiseObject) {
              return promiseObject.promise;
            }
            else throw new RuntimeError(
              "Promise.all() received a non-promise-valued element, at " +
              `index/key = ${key}`,
              expNode, environment
            );
          })
        ));
      }
      default: throw (
        "ScriptInterpreter.evaluateExpression(): Unrecognized type: " +
        `"${type}"`
      );
    }
  }


  assignToVariableOrMember(expNode, environment, assignFun) {
    if(expNode.type === "identifier") {
      return environment.assign(expNode.ident, assignFun, expNode);
    }
    else {
      if(expNode.type !== "chained-expression") throw new RuntimeError(
        "Invalid assignment", expNode, environment
      );
      let lastPostfix = expNode.postfixArr.at(-1);
      if (lastPostfix.type !== "member-accessor") throw new RuntimeError(
        "Invalid assignment", expNode, environment
      );
      if (lastPostfix.isOpt) throw new RuntimeError(
        "Invalid use of optional chaining for the last member accessor in " +
        "an assignment",
        expNode, environment
      );
      let prevVal, objVal, index;
      try {
        [prevVal, objVal, index] = this.evaluateChainedExpression(
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
      objVal.set(index, newVal);
      return ret;
    }
  }


  // evaluateChainedExpression() => [val, objVal, index], or throws
  // a BrokenOptionalChainException. Here, val is the value of the whole
  // expression, and objVal, is the value of the object before the last member
  // accessor (if the last postfix is a member accessor and not a tuple).
  evaluateChainedExpression(
    rootExp, postfixArr, environment, forAssignment
  ) {
    let val = this.evaluateExpression(rootExp, environment);
    let len = postfixArr.length;
    if (len === 0) {
      return [val];
    }
    decrCompGas(rootExp, environment);

    // Evaluate the chained expression accumulatively, one postfix at a time. 
    let postfix, objVal, index, isThisKeyword;
    for (let i = 0; i < len; i++) {
      postfix = postfixArr[i];

      // If postfix is a member accessor, get the member value, and assign the
      // current val to objVal.
      if (postfix.type === "member-accessor") {
        objVal = val;
        isThisKeyword = (i === 1 && rootExp.type === "this-keyword");

        // Throw a BrokenOptionalChainException if an optional chaining is
        // broken.
        if (postfix.isOpt && (val === undefined || val === null)) {
          throw new BrokenOptionalChainException();
        }

        // Else, first get the index.
        index = postfix.ident;
        if (index === undefined) {
          index = this.evaluateExpression(postfix.exp, environment);
        }

        // // If objVal is a protected object, make some checks and get the member.
        // if (objVal instanceof ModuleObject) {
        //   // Check that the user isn't trying to assign to the member.
        //   if (forAssignment) throw new RuntimeError(
        //     "Assignment to a read-only member of a protected object",
        //     postfix, environment
        //   );

        //   // Then get the member.
        //   val = objVal.members.get(index);
        // }

        // Else Check that the object has a get() method, and a set() method if
        // accessed for assignment, and then use the get() method to get the
        // value.
        if (!(objVal.get instanceof Function)) throw new RuntimeError(
          "Trying to access a member of a non-object",
          postfix, environment
        );
        if (forAssignment && !(objVal.set instanceof Function)) {
          throw new RuntimeError(
            "Trying to assign to a member of a non-object, or an object " +
            "that is immutable in the current context",
            postfix, environment
          );
        }
        val = objVal.get(index);
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

        // Evaluate the expressions inside the tuple.
        let inputExpArr = postfix.children;
        let inputValArr = inputExpArr.map(exp => (
          this.evaluateExpression(exp, environment)
        ));

        // Then execute the function and assign its return value, turned
        // immutable, to val.
        val = turnImmutable(
          this.executeFunction(
            val, inputValArr, postfix, environment, objVal, isThisKeyword
          )
        );
      }
      else throw "evaluateChainedExpression(); Unrecognized postfix type";
    }

    // Finally return val and objVal, which should now respectively hold the
    // value of the full expression and the value of the object before the
    // last member access, or undefined if the last postfix was an expression
    // tuple. Also return the index.
    return [val, objVal, index];
  }

}









export class Environment {
  constructor(
    parent, scopeType = "block", {
      fun: {isArrowFun, isEnclosed, modulePath, funName, initSignals},
      callerNode, callerEnv, thisVal,
      modulePath, lexArr, strPosArr, script,
      scriptVars,
      catchStmtArr, errIdent, numIdent,
    },
  ) {
    this.scriptVars = scriptVars ?? parent?.scriptVars ?? (() => {
      throw "Environment: No scriptVars object provided";
    })();
    this.parent = parent;
    this.scopeType = scopeType;
    this.variables = {};
    if (scopeType === "function") {
      this.callerNode = callerNode;
      this.callerEnv = callerEnv;
      if (thisVal) this.thisVal = thisVal;
      if (isArrowFun) this.isArrowFun = isArrowFun;
      if (isEnclosed) {
        this.flagEnv = new FlagEnvironment(
          this.#getFlagEnvironment(), modulePath, funName
        );
      }
      if (initSignals) {
        initSignals.forEach(([signal, signalParams]) => {
          this.flagEnv.emitSignal(signal, callerNode, this, signalParams);
        });
      }
    }
    else if (scopeType === "module") {
      this.modulePath = modulePath;
      this.lexArr = lexArr;
      this.strPosArr = strPosArr;
      this.script = script;
      this.exports = [];
      this.liveModule = undefined;
    }
    else if (scopeType === "try-catch") {
      this.catchStmtArr = catchStmtArr;
      this.errIdent = errIdent;
      this.numIdent = numIdent;
      this.numOfAsyncExceptions = 0;
    }
    else if (scopeType === "global") {
      this.flagEnv = new FlagEnvironment(null, "/");
      let initSignals = this.scriptVars.initSignals.get(GLOBAL) ?? [];
      initSignals.forEach(([signal, signalParams]) => {
        this.flagEnv.emitSignal(signal, null, this, signalParams);
      });
    }
  }

  get isNonArrowFunction() {
    return this.scopeType === "function" && !this.isArrowFun;
  }

  declare(ident, val, isConst, node, nodeEnvironment = this) {
    val = (val === undefined) ? UNDEFINED : val;
    let safeIdent = "$" + ident;
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
    let safeIdent = "$" + ident;
    let [val] = this.variables[safeIdent] ?? [];
    if (val !== undefined) {
      return (val === UNDEFINED) ? undefined : val;
    }
    else if (this.parent) {
      let val = this.parent.get(ident, node, nodeEnvironment);
      if (this.isNonArrowFunction) {
        return turnImmutable(val);
      } else {
        return val;
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
    let safeIdent = "$" + ident;
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
      if (this.isNonArrowFunction) {
        // Throw an `Undeclared variable "${ident}"` error if the variable is
        // undefined (get() does this).
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
      return (thisVal === UNDEFINED) ? undefined : thisVal;
    }
    else if (this.isNonArrowFunction) {
      return undefined;
    }
    else if (this.parent) {
      return this.parent.getThisVal();
    }
    else {
      return undefined;
    }
  }

  #getFlagEnvironment() {
    let flagEnv = this.flagEnv;
    if (flagEnv) {
      return flagEnv;
    }
    else if (this.isNonArrowFunction) {
      return this.callerEnv.getFlagEnvironment();
    }
    else if (this.parent) {
      return this.parent.getFlagEnvironment();
    }
    else {
      return undefined;
    }
  }

  emitSignal(signal, node, env = this, signalParams) {
    let flagEnv = this.#getFlagEnvironment();
    flagEnv.emitSignal(signal, node, env, signalParams);
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


  export(ident, alias = ident, node, nodeEnvironment = this) {
    let prevExport = this.exports["$" + alias];
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
    this.exports.push([alias, turnImmutable(val)]);
  }

  getLiveModule() {
    if (!this.liveModule ) {
      let liveModule = this.liveModule = new Map();
      this.exports.forEach(([alias, val]) => {
        liveModule.set(alias, val);
      });
    }
    return this.liveModule;
  }


  runNearestCatchStmtAncestor(err, node, nodeEnvironment = this) {
    if (this.scopeType === "try-catch") {
      let {interpreter} = this.scriptVars;
      let catchEnv = new Environment(this.parent);
      catchEnv.declare(this.errIdent, err.val, false);
      if (this.numIdent) {
        catchEnv.declare(this.numIdent, ++this.numOfAsyncExceptions, false);
      }
      try {
        this.catchStmtArr.forEach(stmt => {
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


  getModuleEnv() {
    if (this.scopeType === "module") {
      return this;
    } else if (this.parent) {
      return this.parent.getModuleEnv();
    } else {
      return this;
    }
  }

}

export const UNDEFINED = Symbol("undefined");

export const GLOBAL = Symbol("global");
export const MODULE = Symbol("module");





export class LiveModule {
  constructor(modulePath, moduleEnv) {
    this.modulePath = modulePath;
    this.moduleEnv = moduleEnv;
    this.initSignals = moduleEnv.ScriptVars.enclosedModules.get(modulePath);
    let isPrivileged = this.initSignals !== undefined;
    this.members = new Map();
    memberEntries.forEach(([key, val]) => {
      // Filter out any Function instance, which might be exported from a dev
      // library, in which case it is meant only for other dev libraries.
      // TODO: Potentially filter out more object types if they are deemed
      // unsafe to be given to the user (i.e. if they hold an unsafe get() or
      // set() method, or unsafe forEach() or values(), etc.). 
      if (val instanceof Function) {
        return;
      }

      // If the module is enclosed and the exported value is a FunctionObject,
      // wrap it in a PrivilegedMethod class, before setting the module member.
      if (isPrivileged && val instanceof FunctionObject) {
        val = new PrivilegedFunction(val, this)
      }
      this.members.set(key, val);
    });
  }
  // get isPrivileged() {
  //   return this.initSignals ? true : false;
  // }
}



// Signals are emitted either to check that that a certain type of action is
// permitted in the current environment, or to permit or restrict subsequent
// actions in the environment, or a combination of these things, The latter is
// generally done by raising or replacing "flags" in the current "flag
// environment." A flag environment works similar to the regular variable
// environments, except the only scopes for flags are the global scope, as well
// as all function execution scopes of "enclosed functions." A function is
// "enclosed" either if exported as such by a dev library, or if the
// 'enclosedFunctions' Map contained in scriptVars points to it. An enclosed
// scope will still see all the flags raised by any ancestor, but when raising
// or replacing a flag, the change will not affect the ancestors outside of the
// enclosure.
export class Signal {
  constructor(emit) {
    // emit() is the function/method that handles the signal when it is being
    // emitted. It takes some signal parameters, first of all, and the flag
    // environment with which to interface with the flags, as well as getting
    // the modulePath and funName of the enclosed function of the current
    // enclosed scope where the flag environment sits. (It also takes node and
    // env as well, which are useful for throwing runtime errors.)
    this.emit = emit ?? (
      (flagEnv, node, env, signalParams = undefined) => undefined
    );
  }
}



// A flag environment sits on every "enclosed" scope, and on the global one and
// is the interface for checking and raising flags. Aside from the Environment
// class above that creates and retrieves the flag environment, the only
// other functions that should ever interact with FlagEnvironment it the emit()
// functions/methods of Signal instances. Thus, as a developer, you should never
// handle flags directly unless defining a Signal.emit() function.  
export class FlagEnvironment {
  constructor(parent, modulePath, funName) {
    this.parent = parent;
    this.modulePath = modulePath;
    this.funName = funName;
    this.flags = new Map();
  }

  emitSignal(signal, node, env, signalParams) {
    let modifiedEmit = env.scriptVars.modifiedSignals.get(signal);
    if (modifiedEmit) {
      modifiedEmit(this, node, env, signalParams);
    } else {
      signal.emit(this, node, env, signalParams);
    }
  }

  setFlag(flag, flagParams) {
    this.flags.set(flag, flagParams ?? null);
  }

  removeFlag(flag) {
    this.flags.delete(flag);
  }

  getFirstFlag(flagArr) {
    let retFlag, retFlagParams;
    flagArr.some(flag => {
      let flagParams = this.flags.get(flag);
      if (flagParams !== undefined) {
        retFlag = flag;
        retFlagParams = flagParams;
        return true; // breaks the some iteration.
      }
    });
    if (retFlag) {
      return [retFlag, retFlagParams, this.modulePath, this.funName];
    }
    else if (this.parent) {
      return this.parent.getFirstSignal(flagArr);
    }
    else {
      return [];
    }
  }

  getFlag(flag) {
    let [retFlag, flagParams, modulePath, funName] = this.getFirstFlag([flag]);
    let wasFound = retFlag ? true : false;
    return [wasFound, flagParams, modulePath, funName];
  }

  // TODO: Potentially add more useful methods here.

}




export const NO_EXIT_FLAG = Symbol("no_exit");

export const WILL_EXIT_SIGNAL = new Signal((flagEnv, node, env) => {
  let [wasFound] = flagEnv.getFlag(NO_EXIT_FLAG);
  if (wasFound) throw new RuntimeError(
    "Script is not allowed to exit here",
    node, env
  );
});









export class FunctionObject {};

export class DefinedFunction extends FunctionObject{
  constructor(node, decEnv, {isEnclosed, modulePath, funName, initSignals}) {
    this.node = node;
    this.decEnv = decEnv;
    if (isEnclosed) this.isEnclosed = isEnclosed;
    if (modulePath) this.modulePath = modulePath;
    if (funName) this.funName = funName;
    if (initSignals) this.initSignals = initSignals;
  }
  get isArrowFun() {
    return this.node.type === "arrow-function";
  }
}

export class DevFunction extends FunctionObject {
  constructor(
  {isAsync, minArgNum, isEnclosed, modulePath, funName, initSignals, decEnv},
  fun
  ) {
    if (isAsync) this.isAsync = isAsync;
    if (minArgNum) this.minArgNum = minArgNum;
    if (isEnclosed) this.isEnclosed = isEnclosed;
    if (modulePath) this.modulePath = modulePath;
    if (funName) this.funName = funName;
    if (initSignals) this.initSignals = initSignals;
    if (decEnv) this.decEnv = decEnv;
    this.fun = fun;
  }
  get isArrowFun() {
    return this.decEnv ? true : false;
  }
}

export class ValueWrapper {
  constructor(val) {
    this.val = val;
  }
  get(key) {
    return this.val.get(key);
  }
  set(key, val) {
    return this.val.set(key, val);
  }
  entries(key) {
    return this.val.entries(key);
  }
  keys(key) {
    return this.val.keys(key);
  }
  values(key) {
    return this.val.values(key);
  }
  forEach(val, key, map) {
    return this.val.forEach(val, key, map);
  }
}

export class Immutable extends ValueWrapper {
  constructor(val) {
    super(val);
  }
  set = null;
}

export class PassAsMutable extends ValueWrapper {
  constructor(val) {
    super(val);
  }
}

export class JSXElement {
  constructor(
    node, decEnv, interpreter
  ) {
    this.node = node;
    this.decEnv = decEnv;
    let {tagName, isComponent, isFragment, propArr, children} = node;
    this.tagName = tagName;
    if (isComponent) this.componentModule = decEnv.get(tagName, node);
    this.isFragment = isFragment;
    this.props = new Map();
    if (propArr) propArr.forEach(propNode => {
      let expVal = propNode.exp ?
        interpreter.evaluateExpression(propNode.exp, decEnv) :
        true;
      if (propNode.isSpread) {
        if (!(expVal.forEach instanceof Function)) throw new RuntimeError(
          "Trying to iterate over a non-iterable",
          propNode.exp, decEnv
        );
        expVal.forEach((val, key) => {
          this.props.set(key, val);
        });
      } else {
        this.props.set(propNode.ident, expVal);
      }
    });
    if (children) {
      let childrenProp = new Map();
      children.forEach((contentNode, ind) => {
        let val = interpreter.evaluateExpression(contentNode, decEnv);
        childrenProp.set(ind, val);
      });
      this.props.set("children", childrenProp);
    }
    if (isComponent) {
      this.key = this.props.get("key");
      if (this.key === undefined) throw new RuntimeError(
        'JSX component element defined without a "key" prop',
        node, decEnv
      );
    }
  }
}


export class PromiseObject {
  constructor(promiseOrFun, interpreter, node, env) {
    if (promiseOrFun instanceof Promise) {
      this.promise = promiseOrFun;
    }
    else {
      let fun = promiseOrFun;
      this.promise = new Promise((resolve) => {
        let userResolve = new DevFunction(env, ({}, [res]) => {
          resolve(res);
        });
        interpreter.executeFunction(fun, [userResolve], node, env);
      });
    }
  }

  get(key) {
    if (key === "then") {
      return new DevFunction((
        {callerNode, callerEnv, interpreter}, [callbackFun]
      ) => {
        interpreter.handlePromise(
          this.promise, callbackFun, callerNode, callerEnv
        );
      });
    }
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
  constructor(val, node, environment, callerEnv = undefined) {
    this.val = val;
    this.node = node;
    this.environment = environment;
    this.callerEnv = callerEnv;
  }
}

export class CustomException {
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
}






export function turnImmutable(val) {
  if (val && val.set instanceof Function) {
    return new Immutable(val);
  } else {
    return val;
  }
}





export function getFullPath(curPath, path, callerNode, callerEnv) {
  if (!curPath) curPath = "/";

  if (!path || !/^([^/]+)?(\/[^/]+)*$/.test(path)) throw new LoadError(
    `Ill-formed path: "${path}"`, callerNode, callerEnv
  );

  if (path[0] === "/" || path[0] !== ".") {
    return path;
  }

  // Remove the last file name from the current path, if any.
  let moddedCurPath;
  let [filenamePart] = curPath.match(/\/[^./]+\.[^/]+$/) ?? [""];
  if (filenamePart) {
    moddedCurPath = curPath.slice(0, -filenamePart.length);
  }

  // Then concatenate the two paths.
  let fullPath;
  if (curPath.at(-1) === "/") {
    fullPath = moddedCurPath + path;
  } else {
    fullPath = moddedCurPath + "/" + path;
  }

  // Then replace any occurrences of "/./" and "<dirName>/../" with "/".
  fullPath = fullPath.replaceAll(/(\/\.\/|[^/]+\/\.\.\/)/g, "/");

  if (fullPath.substring(0, 4) === "/../") throw new LoadError(
    `Ill-formed path: "${path}"`, callerNode, callerEnv
  );
  
  return fullPath;
}





export function payGas(node, environment, isAsync, gasCost) {
  let {gas} = environment.scriptVars;
  Object.keys(gasCost).forEach(key => {
    if (gas[key] ??= 0) {
      gas[key] -= gasCost[key];
    }
    if (gas[key] < 0) {
      let err = new OutOfGasError(
        "Ran out of " + GAS_NAMES[key] + "gas",
        node, environment,
      );
      throwException(err, node, environment, isAsync);
    }
  });
}

export function payGasWithNoContext(gas, gasCost) {
  Object.keys(gasCost).forEach(key => {
    if (gas[key] ??= 0) {
      gas[key] -= gasCost[key];
    }
    if (gas[key] < 0) {
      throw new OutOfGasError(
        "Ran out of " + GAS_NAMES[key] + "gas",
        null, null,
      );
    }
  });
}

export function decrCompGas(node, environment, isAsync) {
  let {gas} = environment.scriptVars;
  if (0 > --gas.comp) {
    let err = new OutOfGasError(
      "Ran out of " + GAS_NAMES.comp + " gas",
      node, environment,
    );
    throwException(err, node, environment, isAsync);
  }
}
export function decrGas(node, environment, gasName, isAsync) {
  let {gas} = environment.scriptVars;
  if (0 > --gas[gasName]) {
    let err = new OutOfGasError(
      "Ran out of " + GAS_NAMES[gasName] + " gas",
      node, environment,
    );
    throwException(err, node, environment, isAsync);
  }
}

export function throwException(err, node, environment, isAsync) {
  if (isAsync) {
    let {interpreter} = environment.scriptVars;
    interpreter.throwAsyncException(err, node, environment);
  }
  else {
    throw err;
  }
}






const SNIPPET_BEFORE_MAX_LEN = 600;
const SNIPPET_AFTER_MAX_LEN = 100;

export function getExtendedErrorMsg(error) {
  // Get the error type.
  let type;
  if (error instanceof RuntimeError) {
    type = "RuntimeError";
  }
  else if (error instanceof LoadError) {
    type = "LoadError";
  }
  else if (error instanceof OutOfGasError) {
    type = "OutOfGasError";
  }
  else if (error instanceof CustomException) {
    type = "Uncaught (or re-thrown) custom exception";
  }
  else {
    return getExtendedErrorMsgHelper(error);
  }

  // Get the message defined by error.val.
  let msg = JSON.stringify(error?.val ?? null);

  // If error is thrown from the global environment, return an appropriate error
  // message.
  let {
    modulePath, lexArr, strPosArr, script
  } = error.environment.getModuleEnv();
  if (!lexArr) {
    return type + ": " + msg;
  }

  // Else construct an error message containing the line and column number, as
  // well as a code snippet around where the error occurred. 
  else {
    let pos = error.node.pos;
    let nextPos = error.node.nextPos;
    let strPos = strPosArr[pos];
    let finStrPos = strPosArr[nextPos - 1] + lexArr[nextPos - 1].length;
    let [ln, col] = getLnAndCol(script.substring(0, strPos));
    let codeSnippet =
      script.substring(strPos - SNIPPET_BEFORE_MAX_LEN, strPos) +
      "⏵⏵⏵" + script.substring(strPos, finStrPos) + "⏴⏴⏴" +
      script.substring(finStrPos, SNIPPET_AFTER_MAX_LEN);
    return (
      type + ` in ${modulePath ?? "root script"} at Ln ${ln}, Col ${col}: ` +
      `${msg}. Error occurred at \`\n${codeSnippet}\n\`.`
    );
  }
}



export {ScriptInterpreter as default};
