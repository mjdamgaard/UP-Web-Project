
import {scriptParser} from "./parsing/ScriptParser.js";
// import {sassParser} from "./parsing/SASSParser.js";
import {
  LexError, SyntaxError, getExtendedErrorMsg as getExtendedErrorMsgHelper,
  getLnAndCol,
} from "./parsing/Parser.js";


export {LexError, SyntaxError};



const MAX_ARRAY_INDEX = 4294967294;
const MINIMAL_TIME_GAS = 10;

const TEXT_FILE_ROUTE_REGEX = /[^?]+\.(jsx?|txt|json|html|md|css|scss|)$/;
const SCRIPT_ROUTE_REGEX = /[^?]+\.jsx?$/;

const GAS_NAMES = {
  comp: "computation",
  import: "import",
  fetch: "fetching",
  dbRead: "DB fetching",
  dbWrite: "DB writing",
  time: "time",
  conn: "connection",
  mkdir: "directory creation",
};

export function getParsingGasCost(str) {
  return {comp: str.length / 100 + 1};
}

export function parseString(str, node, env, parser) {
  payGas(node, env, {comp: getParsingGasCost(str)});
  let [syntaxTree, lexArr, strPosArr] = parser.parse(str);
  if (syntaxTree.error) throw syntaxTree.error;
  let result = scriptSyntaxTree.res;
  return [result, lexArr, strPosArr];
}





export class ScriptInterpreter {

  constructor(
    isServerSide = false, serverQueryHandler, dbQueryHandler,
    staticDevLibs = new Map(), devLibURLs = new Map(),
  ) {
    this.isServerSide = isServerSide;
    this.serverQueryHandler = serverQueryHandler;
    this.dbQueryHandler = dbQueryHandler;
    this.jsFileCache = jsFileCache;
    this.staticDevLibs = staticDevLibs;
    this.devLibURLs = devLibURLs;
  }

  async interpretScript(
    gas, script = "", scriptPath = null, mainInputs = [], flags = [],
    parsedScripts = new Map(), liveModules = new Map(),
  ) {
    let scriptVars = {
      gas: gas, log: {entries: []}, scriptPath: scriptPath,
      flags: flags, globalEnv: undefined, interpreter: this,
      isExiting: false, resolveScript: undefined,
      parsedScripts: parsedScripts, liveModules: liveModules,
    };

    // First create a global environment, which is used as a parent environment
    // for all modules.
    let globalEnv = new Environment( 
      undefined, "global", {scriptVars: scriptVars},
    );
    scriptVars.globalEnv = globalEnv;

    // Add the 'server' dev library (used for fetching scripts and other data)
    // to liveModules from the beginning.
    liveModules.set(
      "query", new LiveModule(
        "query", Object.entries(this.staticDevLibs.get("query")), scriptVars
      )
    );

    // If script is provided, rather than the scriptPath, first parse it.
    let parsedScript, lexArr, strPosArr;
    if (scriptPath === null) {
      try {
        [parsedScript, lexArr, strPosArr] = parseString(
          script, null, globalEnv, scriptParser
        );
      }
      catch (err) {
        return [undefined, {error: err}];
      }
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
    // This promise is resolved when the resolve() callback of the main
    // function of the script is called.
    let outputAndLogPromise = new Promise(resolve => {
      scriptVars.resolveScript = (output, error) => {
        let {log} = scriptVars;
        if (!log.error) log.error = error;
        scriptVars.isExiting = true;
        resolve([output, log]);
      };
    });


    // Now execute the script as a module, followed by an execution of any
    // function called 'main,' and make sure to try-catch any exceptions.
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
      if (err instanceof SyntaxError || err instanceof RuntimeError) {
        scriptVars.resolveScript(undefined, err);
      }
      else if (err instanceof ReturnException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
          "Cannot return from outside of a function",
          err.node, err.environment
        ));
      }
      else if (err instanceof CustomException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
          `Uncaught exception: "${err.val.toString()}"`,
          err.node, err.environment
        ));
      }
      else if (err instanceof BreakException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
          `Invalid break statement outside of loop or switch-case statement`,
          err.node, err.environment
        ));
      }
      else if (err instanceof ContinueException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
          "Invalid continue statement outside of loop",
          err.node, err.environment
        ));
      }
      else if (err instanceof ExitException) {
        // Do nothing, as the the script will already have been resolved,
        // before the exception was thrown.
      }
      else throw err;
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
          "Ran out of " + GAS_NAMES.time + " gas",
          parsedScript, globalEnv,
        ));
      }
      else if (gas.time !== Infinity) {
        // Set an expiration time after which the script resolves with an
        // error. 
        setTimeout(
          () => {
            scriptVars.resolveScript(undefined, new OutOfGasError(
              "Ran out of " + GAS_NAMES.time + " gas",
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
    let [parsedScript, lexArr, strPosArr, script] =
      parsedScripts.get(scriptPath) ?? [];
    if (!parsedScript) {
      try {
        script = await this.fetch(
          scriptPath, callerNode, callerEnv
        );
      } catch (err) {
        throw new LoadError(err.toString(), callerNode, callerEnv);
      }
      if (typeof script !== "string") throw new LoadError(
        `No script was found at ${scriptPath}`,
        callerNode, callerEnv
      );
      [parsedScript, lexArr, strPosArr] = parseString(
        script, callerNode, callerEnv, scriptParser
      );
      parsedScripts.set(scriptPath, [parsedScript, lexArr, strPosArr, script]);
    }
    return [parsedScript, lexArr, strPosArr, script];
  }


  fetch(route, callerNode, callerEnv) {
    let fetchFun = callerEnv.scriptVars.liveModules.get("query").get("fetch");
    let resultPromise = this.executeFunction(
      fetchFun, [true, route], callerNode, callerEnv
    );
    return resultPromise;
  }





  async executeModule(
    moduleNode, lexArr, strPosArr, script, modulePath, globalEnv,
    callerEnv = globalEnv,
  ) {
    decrCompGas(moduleNode, callerEnv);

    // Create a new environment for the module.
    let moduleEnv = new Environment(
      globalEnv, "module", {
       modulePath: modulePath, lexArr: lexArr, strPosArr: strPosArr,
       script: script, callerEnv: callerEnv,
      }
    );

    // Run all the import statements in parallel and get their live
    // environments, but without making any changes to moduleEnv yet.
    let liveSubmoduleArr = await Promise.all(
      moduleNode.importStmtArr.map(impStmt => (
        this.executeSubmoduleOfImportStatement(impStmt, modulePath, moduleEnv)
      ))
    );

    // We then run all the import statements again, this time where each
    // import statement is paired with the environment from the already
    // executed module, and where the changes are now made to moduleEnv.
    moduleNode.importStmtArr.forEach((impStmt, ind) => {
      let liveSubmodule = liveSubmoduleArr[ind];
      this.finalizeImportStatement(impStmt, liveSubmodule, moduleEnv);
    });

    // Then execute the body of the script, consisting of "outer statements"
    // (export statements as well as normal statements).
    moduleNode.stmtArr.forEach((stmt) => {
      this.executeOuterStatement(stmt, moduleEnv);
    });

    // And finally get the exported "live module," and return it.
    return [moduleEnv.getLiveModule(), moduleEnv];
  }





  executeSubmoduleOfImportStatement(impStmt, curModulePath, callerModuleEnv) {
    let submodulePath = getFullPath(curModulePath, impStmt.str);
    
    return this.import(submodulePath, impStmt, callerModuleEnv);
  }


  async import(modulePath, callerNode, callerEnv) {
    decrCompGas(callerNode, callerEnv);
    decrGas(callerNode, callerEnv, "import");

    let {liveModules, textModules, parsedScripts} = callerEnv.scriptVars;
    let globalEnv = callerEnv.getGlobalEnv();

    // If the module has already been executed, we can return early.
    let liveModule = liveModules.get(modulePath);
    if (liveModule) {
      if (liveModule instanceof Promise) {
        [liveModule] = await liveModule;
        liveModules.set(modulePath, liveModule);
      }
      return liveModule;
    }

    // If the module reference is a dev library reference, which always comes
    // in the form of a bare module specifier (left over in the build step, if
    // any), try to import the given library.
    if (modulePath[0] !== "/") {
      let devMod;
      devMod = this.staticDevLibs.get(modulePath);
      if (!devMod) {
        let devLibURL = this.devLibURLs.get(modulePath);
        if (!devLibURL) throw new LoadError(
          `Developer library "${modulePath}" not found`,
          callerNode, callerEnv
        );
        try {
          let devModPromise = import(devLibURL);
          liveModules.set(modulePath, devModPromise);
          devMod = await devModPromise;
        } catch (err) {
          throw new LoadError(
            `Developer library "${modulePath}" failed to import ` +
            `from ${devLibURL}`,
            callerNode, callerEnv
          );
        }
      }

      // If the dev library module was found, create a "liveModule" object from
      // it, store it in the liveModules buffer, and return it. 
      let liveModule = new LiveModule(
        modulePath, Object.entries(devMod), globalEnv.scriptVars
      );
      return liveModule;
    }

    // Else if the module is a user module, with a '.js' or '.jsx' extension,
    // fetch/get it and create and return a LiveModule instance rom it.
    if (SCRIPT_ROUTE_REGEX.test(modulePath)) {
      // First try to get it from the parsedScripts buffer, then try to fetch
      // it from the database.
      let [
        submoduleNode, lexArr, strPosArr, script
      ] = await this.fetchParsedScript(
        modulePath, parsedScripts, callerNode, callerEnv
      );

      // Before executing the module, first check that the module haven't been
      // executed while waiting for the script to be fetched.
      liveModule = liveModules.get(modulePath);
      if (liveModule) {
        if (liveModule instanceof Promise) {
          [liveModule] = await liveModule;
          liveModules.set(modulePath, liveModule);
        }
        return liveModule;
      }

      // Then execute the module, inside the global environment, and return the
      // resulting liveModule, after also adding it to liveModules.
      let liveModulePromise = this.executeModule(
        submoduleNode, lexArr, strPosArr, script, modulePath, globalEnv,
        callerEnv
      );
      liveModules.set(modulePath, liveModulePromise);
      [liveModule] = await liveModulePromise;
      liveModules.set(modulePath, liveModule);
      return liveModule;
    }

    // Else if the module is actually a non-JS text file, fetch/get it and
    // return a string of its content instead.
    else if (TEXT_FILE_ROUTE_REGEX.test(modulePath)) {
      return await this.fetch(
        modulePath, textModules, callerNode, callerEnv
      );
    }

    // Else throw a load error.
    else throw new LoadError(
      `Invalid module path: ${modulePath}`,
      callerNode, callerEnv
    );
  }




  finalizeImportStatement(impStmt, liveSubmodule, curModuleEnv) {
    decrCompGas(impStmt, curModuleEnv);

    // Iterate through all the imports and add each import to the environment.
    impStmt.importArr.forEach(imp => {
      // If liveSubmodule is a string, accept only a "namespace import", which
      // has the effect of assigning the string to the import variable.
      if (typeof liveSubmodule === "string") {
        if (imp.importType !== "namespace-import") throw new LoadError(
          "Only imports of the form '* as <variable>' is allowed for text " +
          "file imports",
          imp, curModuleEnv
        );
        curModuleEnv.declare(imp.ident, liveSubmodule, true, imp);
      }

      // Else import the module regularly, as a JS module.
      else {
        let impType = imp.importType
        if (impType === "namespace-import") {
          let moduleNamespaceObj = turnImmutable(liveSubmodule);
          curModuleEnv.declare(imp.ident, moduleNamespaceObj, true, imp);
        }
        else if (impType === "named-imports") {
          imp.namedImportArr.forEach(namedImp => {
            let ident = namedImp.ident ?? "default";
            let alias = namedImp.alias ?? ident;
            let val = liveSubmodule.get(ident);
            curModuleEnv.declare(alias, val, true, namedImp);
          });
        }
        else if (impType === "default-import") {
          let val = liveSubmodule.get("default");
          curModuleEnv.declare(imp.ident, val, true, imp);
        }
        else throw "finalizeImportStatement(): Unrecognized import type";
      }
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
    // Create a resolve() callback for the main function that exits the script
    // the input value as the script output.
    let resolveFun = new DevFunction(
      {decEnv: scriptEnv}, ({}, [output]) => {
        scriptEnv.scriptVars.resolveScript(output);
        throw new ExitException();
      }
    );
    
    // Then call executeModuleFunction with that resolve, and with funName =
    // "main".
    this.executeModuleFunction(
      liveScriptModule, "main", inputArr, resolveFun, scriptNode, scriptEnv
    );
  }

  executeModuleFunction(
    liveModule, funName, inputArr, resolveFun, moduleNode, moduleEnv
  ) {
    let fun = liveModule.get(funName);
    if (fun === undefined) throw new RuntimeError(
      `No function called "${funName}" was exported from ` +
      `Module ${liveModule.modulePath}`,
      moduleNode, moduleEnv
    );
    inputArr = inputArr.concat([resolveFun]);
    return this.executeFunction(
      fun, inputArr,
      fun instanceof DefinedFunction ? fun.node : moduleNode, moduleEnv
    );
  }




  executeFunction(fun, inputArr, callerNode, callerEnv, thisVal) {
    decrCompGas(callerNode, callerEnv);

    // Throw if fun is not a FunctionObject.
    if (!(fun instanceof FunctionObject)) throw new RuntimeError(
      "Function call to a non-function",
      callerNode, callerEnv
    );

    // If inputArr is not an array, expect an iterable and turn it into an
    // array.
    if (!(inputArr instanceof Array)) {
      inputArr = inputArr.values();
    }

    // If the function is an arrow function, check that it isn't called outside
    // of the "environmental call stack" that has its fun.decEnv as an ancestor
    // in the stack.
    if (fun.isArrowFun) {
      let isValid = callerEnv.isCallStackDescendentOf(fun.decEnv);
      if (!isValid) throw new RuntimeError(
        "An arrow function was called outside of the " +
        "environmental call stack in which it was declared",
        callerNode, callerEnv
      );
    }

    // And if the function is not an arrow function, check that the function
    // hasn't been passed to an enclosed function.
    else if (fun.isPassedToEnclosed) throw new RuntimeError(
      "A non-arrow function was passed to and called by an enclosed function",
      callerNode, callerEnv
    );

    // And if the function is itself enclosed, turn all arguments
    // isPassedToEnclosed, as well as thisVal.
    if (fun.isEnclosed) {
      inputArr = inputArr.map(val => turnPassedToEnclosed(val));
      thisVal = turnPassedToEnclosed(thisVal);
    }

    // Initialize a new environment for the execution of the function.
    let execEnv = new Environment(
      fun.decEnv ?? callerEnv.getGlobalEnv(), "function", {
        fun: fun, callerNode: callerNode, callerEnv: callerEnv,
        thisVal: thisVal
      }
    );

    // Then execute the function depending on its type.
    if (fun instanceof DefinedFunction) {
      return this.#executeDefinedFunction(fun.node, inputArr, execEnv);
    }
    else if (fun instanceof DevFunction) {
      return this.#executeDevFunction(
        fun, inputArr, callerNode, execEnv, thisVal
      );
    }
  }



  #executeDevFunction(
    devFun, inputArr, callerNode, execEnv, thisVal
  ) {
    let {isAsync, minArgNum = 0, liveModule} = devFun;
    let execVars = {
      callerNode: callerNode, execEnv: execEnv,
      thisVal: thisVal, interpreter: this, liveModule: liveModule,
    };

    // If the dev function an async function, call it and then either return a
    // PromiseObject to the user or call a user-provided callbackFun depending
    // on the inputArr and on minArgNum.
    if (isAsync) {
      // If the argument number exceeds minArgNum and the last argument is a
      // function, then treat this last argument as the callback to call when
      // the promise is ready.
      let lastArg = inputArr.at(-1);
      if (
        minArgNum <= inputArr.length && lastArg instanceof FunctionObject
      ) {
        let callbackFun = lastArg;
        let promise = devFun.fun(execVars, inputArr.slice(0, -1));
        this.handlePromise(promise, callbackFun, callerNode, execEnv);
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


  handlePromise(promise, callbackFun, callerNode, execEnv) {
    promise.then(res => {
      this.#executeAsyncFunction(callbackFun, [res], callerNode, execEnv);
    }).catch(err => {
      this.#throwAsyncException(err, callerNode, execEnv);
    });
  }



  #executeAsyncFunction(fun, inputArr, callerNode, execEnv, thisVal) {
    if (execEnv.scriptVars.isExiting) {
      throw new ExitException();
    }
    try {
      this.executeFunction(fun, inputArr, callerNode, execEnv, thisVal);
    }
    catch (err) {
      if (err instanceof RuntimeError) {
        let wasCaught = execEnv.runNearestCatchStmtAncestor(err, callerNode);
        if (!wasCaught) {
          execEnv.scriptVars.resolveScript(undefined, err);
        }
      }
      else if (!(err instanceof ExitException)) {
        throw err;
      }
    }
  }

  #throwAsyncException(err, callerNode, execEnv) {
    let wasCaught = execEnv.runNearestCatchStmtAncestor(err, callerNode);
    if (!wasCaught) {
      execEnv.scriptVars.resolveScript(undefined, err);
    }
  }






  #executeDefinedFunction(funNode, inputValueArr, execEnv) {
    // Add the input parameters to the environment (and turn all object inputs
    // immutable, unless the passAsMutable property is true, in which case just
    // turn this property false).
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

      // If the paramVal is "passedAsMutable", we remove that wrapper,
      // and else we turn the paramVal immutable.
      if (paramVal && paramVal.passAsMutable) {
        paramVal = notPassedAsMutable(paramVal);
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
        } else if (stmtNode.lexeme === "continue") {
          throw new ContinueException(stmtNode, environment);
        } else if (stmtNode.lexeme === "debugger") {
          debugger;
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
            // Don't expect comparison of objects always to work.
            case "===":
              acc = acc === nextVal;
              break;
            case "==": {
              acc = acc == nextVal;
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
        return new ArrayWrapper(
          expNode.children.map(exp => (
            this.evaluateExpression(exp, environment)
          ))
        );
      }
      case "object": {
        let ret = ObjectWrapper(new Map());
        expNode.members.forEach(member => {
          let key = member.ident;
          if (key === undefined) {
            key = this.evaluateExpression(member.keyExp, environment);
          }
          ret.set(key, this.evaluateExpression(member.valExp, environment));
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
      // case "exit-call": {
      //   // Evaluate the argument.
      //   let expVal = (!expNode.exp) ? undefined :
      //     this.evaluateExpression(expNode.exp, environment);
      //   let {resolveScript} = environment.scriptVars;
      //   // Check the can-exit signal, before resolving the script.
      //   environment.sendSignal(WILL_EXIT_SIGNAL, expNode);
      //   resolveScript(expVal);
      //   // Throw an exit exception.
      //   throw new ExitException();
      // }
      case "pass-as-mutable-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        return passedAsMutable(expVal);
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
      case "import-call": {
        let path = this.evaluateExpression(expNode.pathExp, environment);
        let namespaceObjPromise = this.import(path, expNode, environment);
        if (expNode.callback) {
          let callback = this.evaluateExpression(expNode.callback, environment);
          this.handlePromise(
            namespaceObjPromise, callback, expNode, environment
          );
        }
        else {
          return new PromiseObject(
            namespaceObjPromise, this, expNode, environment
          );
        }
      }
      case "map-call": {
        let expVal;
        if (expNode.exp) {
          expVal = this.evaluateExpression(expNode.exp, environment);
        }
        let ret;
        if (expVal === undefined) {
          ret = new MapWrapper();
        }
        else {
          try {
            ret = new MapWrapper(expVal);
          }
          catch (err) {
            throw new TypeError(
              "Map expects a key-value entries array, but got: " +
              getVerboseString(expVal),
              expNode.exp, environment
            );
          }
        }
        return ret;
      }
      case "console-call": {
        if (expNode.subtype === "log") {
          let {isExiting, log} = environment.scriptVars;
          let expVal = this.evaluateExpression(expNode.exp, environment);
          if (!this.isServerSide && !isExiting) {
            console.log(getVerboseString(expVal));
          }
          log.entries.push(expVal);
          return undefined;
        }
        // TODO: Implement a console.trace() call as well.
        // TODO: Implement an extended trace() (called whatever seems
        // appropriate) that returns the whole environment stack in some way,
        // perhaps with a maxLevel limit argument. And on the server side,
        // maybe even reroute the debugger statement to call this and then exit.
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
    let postfix, objVal, index;
    for (let i = 0; i < len; i++) {
      postfix = postfixArr[i];

      // If postfix is a member accessor, get the member value, and assign the
      // current val to objVal.
      if (postfix.type === "member-accessor") {
        objVal = val;

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

        // Then check that the object has a get() method, and a set() method if
        // accessed for assignment.
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

        // If objVal is "confined", also check that it isn't called outside
        // of an environmental call stack in which it is declared.
        if (objVal.isConfined) {
          let isValid = environment.isCallStackDescendentOf(objVal.decEnv);
          if (!isValid) throw new RuntimeError(
            "A member of a confined object was accessed outside of the " +
            "environmental call stack in which the object was was declared",
            postfix, environment
          );
        }

        // Then use the get() method to get the value.
        val = objVal.get(index);

        // Lastly, if objVal was immutable or passedToEnclosed, turn the
        // retrieved value into that as well.
        if (!(objVal.set instanceof Function)) {
          val = turnImmutable(val);
        }
        if (objVal.isPassedToEnclosed) {
          val = turnPassedToEnclosed(val);
        }
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
          this.executeFunction(val, inputValArr, postfix, environment, objVal)
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
      fun, callerNode, callerEnv, thisVal,
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
    this.variables = new Map();
    if (scopeType === "function") {
      let {
        isArrowFun, isDevFun, modulePath,
        signals, flags, isEnclosed,
      } = fun;
      this.callerNode = callerNode;
      this.callerEnv = callerEnv;
      if (thisVal && !isArrowFun) this.thisVal = thisVal;
      if (isArrowFun) this.isArrowFun = isArrowFun;
      if (isDevFun) this.isDevFun = isDevFun;
      if (signals) {
        let parentFlagEnv = this.getFlagEnvironment();
        parentFlagEnv.sendSignals(signals, callerNode, callerEnv);
      }
      if (isEnclosed) {
        let parentFlagEnv = this.getFlagEnvironment();
        this.flagEnv = new FlagEnvironment(parentFlagEnv);
      }
      if (flags) {
        this.flagEnv.setFlags(flags, callerNode, callerEnv);
      }
    }
    else if (scopeType === "module") {
      this.modulePath = modulePath;
      this.lexArr = lexArr;
      this.strPosArr = strPosArr;
      this.script = script;
      this.callerEnv = callerEnv ?? parent;
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
      let flags = this.scriptVars.flags ?? [];
      this.flagEnv.setFlags(flags);
    }
  }

  get isNonArrowFunction() {
    return this.scopeType === "function" && !this.isArrowFun;
  }

  declare(ident, val, isConst, node, nodeEnvironment = this) {
    val = (val === undefined) ? UNDEFINED : val;
    let [prevVal] = this.variables.get(ident) ?? [];
    if (prevVal !== undefined) {
      throw new RuntimeError(
        "Redeclaration of variable '" + ident + "'",
        node, nodeEnvironment
      );
    } else {
      this.variables.set(ident, [val, isConst]);
    }
  }

  get(ident, node, nodeEnvironment = this) {
    let [val] = this.variables.get(ident) ?? [];
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
    let [prevVal, isConst] = this.variables.get(ident) ?? [];
    if (isConst) throw new RuntimeError(
      "Reassignment of constant variable or function '" + ident + "'",
      node, this
    );
    if (prevVal !== undefined) {
      let [newVal, ret] = assignFun(prevVal);
      newVal = (newVal === undefined) ? UNDEFINED : newVal;
      this.variables.get(ident)[0] = newVal;
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


  getGlobalEnv() {
    return this.scriptVars.globalEnv;
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

  getFlagEnvironment() {
    let flagEnv = this.flagEnv;
    if (flagEnv) {
      return flagEnv;
    }
    else if (this.isNonArrowFunction || this.scopeType === "module") {
      return this.callerEnv.getFlagEnvironment();
    }
    else if (this.parent) {
      return this.parent.getFlagEnvironment();
    }
    else {
      return undefined;
    }
  }

  sendSignal(signal, node, signalParams) {
    let flagEnv = this.getFlagEnvironment();
    return flagEnv.sendSignal(signal, node, this, signalParams);
  }

  getFlag(flag, maxStep) {
    let flagEnv = this.getFlagEnvironment();
    return flagEnv.getFlag(flag, maxStep);
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
    this.exports.push([alias, val]);
  }

  getLiveModule() {
    if (!this.liveModule ) {
      this.liveModule = new LiveModule(
        this.modulePath, this.exports, this.scriptVars
      );
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
    else if (this.scopeType === "function" || this.scopeType === "module") {
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
    } else if (this.isDevFun) {
      return this.callerEnv.getModuleEnv();
    } else if (this.parent) {
      return this.parent.getModuleEnv();
    } else {
      return null;
    }
  }

}

export const UNDEFINED = Symbol("undefined");

export const GLOBAL = Symbol("global");
export const MODULE = Symbol("module");





export class LiveModule {
  constructor(modulePath, exports, scriptVars) {
    this.modulePath = modulePath;
    this.interpreter = scriptVars.interpreter;
    this.members = new Map();
    exports.forEach(([alias, val]) => {
      // Filter out any Function instance, which might be exported from a dev
      // library, in which case it is meant only for other dev libraries.
      if (val instanceof Function) {
        return;
      }
  
      this.members.set(alias, turnImmutable(val));
    });
  }

  get(key) {
    return this.members.get(key);
  }

  call(funName, inputArr, callerNode, callerEnv, ignoreIfUndef = false) {
    let fun = this.get(funName);
    if (fun !== undefined) {
      let ret = this.interpreter.executeFunction(
        fun, inputArr, callerNode, callerEnv
      );
      return (ret instanceof PromiseObject) ? ret.promise : ret;
    }
    else if (!ignoreIfUndef) throw (
      "LiveModule.call(): Function not found"
    );
  }

}




// Signals are sent either to check that that a certain type of action is
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
  constructor(name, send) {
    // Names are only used for clarity and debugging purposes.
    this.name = name;

    // send() is the function/method that handles the signal when it is being
    // sent. It takes some signal parameters, first of all, and the flag
    // environment with which to interface with the flags. (It also takes node
    // and env as well, which are useful for throwing runtime errors.)
    this.send = send ?? (
      (flagEnv, node, env, signalParams = undefined) => undefined
    );
  }
}




export const CLEAR_FLAG = Symbol("clear"); 


// A flag environment sits on every "enclosed" scope, and on the global one and
// is the interface for checking and raising flags. Aside from the Environment
// class above that creates and retrieves the flag environment, the only
// other functions that should ever interact with FlagEnvironment it the send()
// functions/methods of Signal instances. Thus, as a developer, you should never
// handle flags directly unless defining a Signal.send() function.  
export class FlagEnvironment {
  constructor(parent) {
    this.parent = parent;
    this.flags = new Map();
  }

  sendSignal(signal, node, env, signalParams) {
    return signal.send(this, node, env, signalParams);
  }

  sendSignals(signals, node, env) {
    signals.forEach(([signal, signalParams]) => {
      this.sendSignal(signal, node, env, signalParams);
    });
  }


  setFlag(flag, flagParams) {
    this.flags.set(flag, flagParams ?? true);
  }

  setFlags(flags) {
    flags.forEach(([flag, flagParams]) => {
      this.setFlag(flag, flagParams);
    });
  }

  // removeFlag(flag) {
  //   this.flags.set(flag, null);
  // }

  getFirstFlag(flagArr, maxStep = Infinity, stopAtClear = true, curStep = 0) {
    // Add the "clear" flag at the end if the flagArr if stopAtClear == true.
    if (stopAtClear) {
      flagArr = [...flagArr, CLEAR_FLAG];
    }
    let ret = this.#getFirstFlagHelper(flagArr, maxStep, stopAtClear, curStep);

    // And if the first flag found was the "clear" flag, return an empty array
    // as if no flag was found.
    if (stopAtClear && ret[0] === CLEAR_FLAG) {
      ret = [];
    }
    return ret;
  }

  #getFirstFlagHelper(flagArr, maxStep, stopAtClear, curStep) {
    if (curStep > maxStep) {
      return [];
    }
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
      return [retFlag, retFlagParams, curStep];
    }
    else if (this.parent) {
      return this.parent.getFirstFlag(
        flagArr, maxStep, stopAtClear, curStep + 1
      );
    }
    else {
      return [];
    }
  }

  getFlag(flag, maxStep = Infinity, stopAtClear = true) {
    let [
      retFlag, flagParams, step
    ] = this.getFirstFlag([flag], maxStep, stopAtClear);
    let wasFound = retFlag ? true : false;
    return [wasFound, flagParams, step];
  }

  // Potentially add more useful methods here.

}




// export const NO_EXIT_FLAG = Symbol("no_exit");

// export const NO_EXIT_SIGNAL = new Signal((flagEnv) => {
//     flagEnv.setFlag(NO_EXIT_FLAG);
// });

// export const WILL_EXIT_SIGNAL = new Signal(
//   "will_exit",
//   (flagEnv, node, env) => {
//     let [wasFound] = flagEnv.getFlag(NO_EXIT_FLAG);
//     if (wasFound) throw new RuntimeError(
//       "Script is not allowed to exit here",
//       node, env
//     );
//   }
// );






// export class ValueWrapper {
//   constructor(val) {
//     this.val = val;
//   }
//   get(key) {
//     return this.val.get(key);
//   }
//   set(key, val) {
//     return this.val.set(key, val);
//   }
//   entries() {
//     return this.val.entries();
//   }
//   keys() {
//     return this.val.keys();
//   }
//   values() {
//     return this.val.values();
//   }
//   forEach(fun) {
//     return this.val.forEach(fun);
//   }
//   toString() {
//     return this.val.toString();
//   }
//   stringify() {
//     return JSON.stringify(this.val);
//   }
// }


export class ArrayWrapper {
  constructor(val) {
    super(val);
  }

  get(key, node, env) {
    if (key === "length"){
      return this.val.length;
    }
    let ind = parseInt(key);
    if (ind !== NaN && 0 <= ind && ind < MAX_ARRAY_INDEX) {
      return this.val[ind];
    }
    else throw new TypeError(
      `Invalid array index: ${key}`,
      node, env
    );
  }

  set(key, val, node, env) {
    if (key === "length") {
      let ind = parseInt(val);
      if (ind !== NaN && 0 <= ind && ind < MAX_ARRAY_INDEX + 1) {
        this.val.length = ind;
      }
      else throw new TypeError(
        `Invalid array length: ${val}`,
        node, env
      );
    }
    let ind = parseInt(key);
    if (ind !== NaN && 0 <= ind && ind < MAX_ARRAY_INDEX) {
      this.val[ind] = val;
    }
    else throw new TypeError(
      `Invalid array index: ${key}`,
      node, env
    );
  }

  values() {
    return this.val;
  }

  toString() {
    return this.val.map(val => val.toString()).join(",");
  }
  stringify() {
    return "[" +
      this.val.map(val => (
        (val instanceof ValueWrapper) ? val.stringify() : JSON.stringify(val)
      )).join(",") +
    "]";
  }

  append(value) {
    return new ArrayWrapper(this.val.concat([value]))
  }
}


export class ObjectWrapper {
  constructor(val) {
    super(val);
  }

  get(key) {
    return this.val.get(key.toString());
  }

  set(key, val) {
    return this.val.set(key.toString(), val);
  }

  toString() {
    return "[object Object]";
  }

  stringify() {
    return "{" +
      this.val.entries((key, [val]) => (
        `"${key.replaceAll('"', '\\"')}":` +
        (val instanceof ValueWrapper) ? val.stringify() : JSON.stringify(val)
      )).join(",") +
    "}";
  }
}


export class MapWrapper extends Map {
  constructor(entries) {
    super(entries);
  }

  stringify() {
    return this.toString();
  }
}


export class FunctionObject {};

export class DefinedFunction extends FunctionObject {
  constructor(node, decEnv) {
    super();
    this.node = node;
    this.decEnv = decEnv;
  }
  get isArrowFun() {
    return this.node.type === "arrow-function";
  }
  get name() {
    return this.node.name ?? "<anonymous function>";
  }
}

export class DevFunction extends FunctionObject {
  constructor(options, fun) {
    if (!fun) {
      fun = options;
      options = {};
    }
    let {
      isAsync, minArgNum, signals, flags, isEnclosed, decEnv
    } = options;
    super();
    if (isAsync) this.isAsync = isAsync;
    if (minArgNum) this.minArgNum = minArgNum;
    if (signals) this.signals = signals;
    if (flags) this.flags = flags;
    if (isEnclosed) this._isEnclosed = isEnclosed;
    if (decEnv) this.decEnv = decEnv;
    this.fun = fun;
  }
  get isArrowFun() {
    return !!this.decEnv;
  }
  get isDevFun() {
    return true;
  }
  get isEnclosed() {
    return this._isEnclosed ?? this.flags ? true : false;
  }
  get name() {
    return "<anonymous dev function>";
  }
}




export class JSXElement {
  constructor(node, decEnv, interpreter) {
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
        let userResolve = new DevFunction({decEnv: env}, ({}, [res]) => {
          resolve(res);
        });
        interpreter.executeFunction(fun, [userResolve], node, env);
      });
    }
  }

  get(key) {
    if (key === "then") {
      return new DevFunction(
        {}, ({callerNode, callerEnv, interpreter}, [callbackFun]) => {
          interpreter.handlePromise(
            this.promise, callbackFun, callerNode, callerEnv
          );
        }
      );
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




export class RuntimeError {
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
}
export class LoadError extends RuntimeError {
  constructor(val, node, environment) {
    super(val, node, environment);
  }
}
export class OutOfGasError extends RuntimeError {
  constructor(val, node, environment) {
    super(val, node, environment);
  }
}
export class CustomException extends RuntimeError {
  constructor(val, node, environment) {
    super(val, node, environment);
  }
}
export class TypeError extends RuntimeError {
  constructor(val, node, environment) {
    super(val, node, environment);
  }
}






export function turnImmutable(val) {
  if (val && val.set instanceof Function) {
    val = Object.create(val);
    val.set = false;
    return val;
  } else {
    return val;
  }
}
export function passedAsMutable(val) {
  if (val && val.set instanceof Function && !val.passAsMutable) {
    val = Object.create(val);
    val.passAsMutable = true;
    return val;
  } else {
    return val;
  }
}
export function notPassedAsMutable(val) {
  if (val && val.set instanceof Function && val.passAsMutable) {
    val = Object.create(val);
    val.passAsMutable = false;
    return val;
  } else {
    return val;
  }
}
export function turnPassedToEnclosed(val) {
  if (
    val && (val instanceof FunctionObject || val.get instanceof Function) &&
    !val.isPassedToEnclosed
  ) {
    val = Object.create(val);
    val.isPassedToEnclosed = true;
    return val;
  } else {
    return val;
  }
}




export function jsonStringify(val) {
  return val?.jsonVal ?? JSON.stringify(val);
}


export function jsonParse(val) {
  return getValueWrapper(val);
}

export function getValueWrapper(val) {
  if (val && typeof val === "object") {
    if (val instanceof Array) {
      return new ArrayWrapper(val);
    }
    else if (val instanceof Map) {
      return new MapWrapper(val.entries());
    }
    else {
      return new ObjectWrapper(val);
    }
  }
  else {
    return val;
  }
}




export function getVerboseString(val) {
  return (val.stringify instanceof Function) ? val.stringify() : val.toString();
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





export function payGas(node, environment, gasCost) {
  let {gas} = environment.scriptVars;
  Object.keys(gasCost).forEach(key => {
    if (gas[key] ??= 0) {
      gas[key] -= gasCost[key];
    }
    if (gas[key] < 0) {
      throw new OutOfGasError(
        "Ran out of " + GAS_NAMES[key] + "gas",
        node, environment,
      );
    }
  });
}

export function decrCompGas(node, environment) {
  let {gas} = environment.scriptVars;
  if (0 > --gas.comp) {
    throw new OutOfGasError(
      "Ran out of " + GAS_NAMES.comp + " gas",
      node, environment,
    );
  }
}

export function decrGas(node, environment, gasName) {
  let {gas} = environment.scriptVars;
  if (0 > --gas[gasName]) {
    throw new OutOfGasError(
      "Ran out of " + GAS_NAMES[gasName] + " gas",
      node, environment,
    );
  }
}










const SNIPPET_BEFORE_MAX_LEN = 600;
const SNIPPET_AFTER_MAX_LEN = 100;

export function getExtendedErrorMsg(err) {
  // Get the error type.
  let type;
  if (err instanceof TypeError) {
    type = "TypeError";
  }
  else if (err instanceof LoadError) {
    type = "LoadError";
  }
  else if (err instanceof OutOfGasError) {
    type = "OutOfGasError";
  }
  else if (err instanceof CustomException) {
    type = "Uncaught or re-thrown custom exception";
  }
  else if (err instanceof StyleError) {
    type = "StyleError";
  }
  else if (err instanceof SyntaxError) {
    return getExtendedErrorMsgHelper(err);
  }
  else if (err instanceof RuntimeError) {
    type = "RuntimeError";
  }
  else throw err;

  // Get the message defined by error.val.
  let msg = JSON.stringify(err?.val ?? null);

  // If error is thrown from the global environment, return an appropriate error
  // message.
  let {
    modulePath, lexArr, strPosArr, script
  } = err.environment.getModuleEnv() ?? {};
  if (!lexArr) {
    return type + ": " + msg;
  }

  // Else construct an error message containing the line and column number, as
  // well as a code snippet around where the error occurred. 
  else {
    let pos = err.node.pos;
    let nextPos = err.node.nextPos;
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
