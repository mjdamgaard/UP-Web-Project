
import {scriptParser} from "./parsing/ScriptParser.js";
import {
  getExtendedErrorMsg as getExtendedSyntaxErrorMsg, getLnAndCol,
} from "./parsing/Parser.js";
import {
  REQUESTING_SMF_ROUTE_FLAG, NO_TRACE_FLAG
} from "../dev_lib/query/src/flags.js";




export const OBJECT_PROTOTYPE = Object.getPrototypeOf({});
export const ARRAY_PROTOTYPE = Object.getPrototypeOf([]);
export const MAP_PROTOTYPE = Object.getPrototypeOf(new Map());

const MAX_ARRAY_INDEX = Number.MAX_SAFE_INTEGER;
const MINIMAL_TIME_GAS = 10;
const TRACE_LENGTH_CS = 15;
const TRACE_LENGTH_SS = 40;

export const TEXT_FILE_ROUTE_REGEX =
  /.+\.(jsx?|txt|json|html|xml|svg|md|css)$/;
export const SCRIPT_ROUTE_REGEX = /.+\.jsx?$/;

export const GAS_NAMES = {
  comp: "computation",
  import: "import",
  fetch: "fetching",
  post: "posting",
  dbRead: "DB reading",
  dbWrite: "DB writing",
  time: "time",
  conn: "connection",
  mkdir: "directory creation",
  mkTable: "DB table creation",
};

export function getParsingGasCost(str) {
  return {comp: str.length / 100 + 1};
}

export function parseString(str, node, env, parser, startSym = undefined) {
  payGas(node, env, getParsingGasCost(str));
  let [syntaxTree, lexArr, strPosArr] = parser.parse(str, startSym);
  if (syntaxTree.error) throw new ParserError(
    getExtendedSyntaxErrorMsg(syntaxTree.error), node, env
  );
  let result = syntaxTree.res;
  return [result, lexArr, strPosArr];
}





export class ScriptInterpreter {

  constructor(
    isServerSide = false, queryServer, queryDB,
    staticDevLibs = new Map(), devLibURLs = new Map(),
  ) {
    this.isServerSide = isServerSide;
    this.queryServer = queryServer;
    this.queryDB = queryDB;
    this.staticDevLibs = staticDevLibs;
    this.devLibURLs = devLibURLs;
  }

  async interpretScript(
    gas, script = "", scriptPath = null, mainInputs = [], flags = [],
    contexts = {}, parsedScripts = new Map(), liveModules = new Map(),
  ) {
    let scriptVars = {
      gas: gas, log: {entries: []}, scriptPath: scriptPath,
      flags: flags, contexts: contexts, globalEnv: undefined, interpreter: this,
      isExiting: false, resolveScript: undefined, exitPromise: undefined,
      parsedScripts: parsedScripts, liveModules: liveModules,
      appSettings: undefined,
    };

    // First create a global environment, which is used as a parent environment
    // for all modules.
    let globalEnv = this.createGlobalEnvironment(scriptVars);

    // Add the 'server' dev library (used for fetching scripts and other data)
    // to liveModules from the beginning.
    liveModules.set(
      "query", new LiveJSModule(
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
        if (!log.error && error !== undefined) {
          log.error = error;
        }
        scriptVars.isExiting = true;
        resolve([output, log]);
      };
    }).catch(err => console.error(err));
    scriptVars.exitPromise = outputAndLogPromise;


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
      if (err instanceof Exception) {
        scriptVars.resolveScript(undefined, err);
      }
      else if (err instanceof ReturnException) {
        scriptVars.resolveScript(undefined, new RuntimeError(
          "Cannot return from outside of a function",
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


  createGlobalEnvironment(scriptVars) {
    let globalEnv = new Environment(
      undefined, "global", {scriptVars: scriptVars},
    );
    scriptVars.globalEnv = globalEnv;

    globalEnv.declare("IS_SERVER_SIDE", this.isServerSide, true, null);

    globalEnv.declare("MutableArray", mutableArrayClass, true, null);
    globalEnv.declare("MutableObject", mutableObjectClass, true, null);
    globalEnv.declare("MutableMap", mutableMapClass, true, null);

    let clearPermissions = new DevFunction(
      "clearPermissions", {typeArr: ["function"]},
      ({callerNode, execEnv, interpreter}, [callback]) => {
        interpreter.executeFunction(
          callback, [], callerNode, execEnv, undefined, [CLEAR_FLAG]
        );
      },
    );
    globalEnv.declare("clearPermissions", clearPermissions, true, null);

    // TODO: Add more, in particular a Promise object, once we reimplement that.

    return globalEnv;
  }



// TODO: Maybe remove the parseScripts buffer; it should be redundant when we
// also have the liveModules buffer, and already make sure that we never
// execute a module more than once. *(But only remove it if we still keep a way
// for the server not having the parse the "main script" for each request.)

  async fetchParsedScript(
    scriptPath, parsedScripts, callerNode, callerEnv
  ) {
    let [parsedScript, lexArr, strPosArr, script] =
      parsedScripts.get(scriptPath) ?? [];
    if (!parsedScript) {
      script = await this.fetch(
        scriptPath, callerNode, callerEnv
      );
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


  async fetch(route, callerNode, callerEnv, ancestorModules) {
    let fetchFun = callerEnv.scriptVars.liveModules.get("query").get("fetch");
    return await this.executeFunction(
      fetchFun, [route, undefined, ancestorModules], callerNode, callerEnv
    ).promise;
  }





  async executeModule(
    moduleNode, lexArr, strPosArr, script, modulePath, globalEnv,
    ancestorModules = [],
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
    let liveSubmoduleArr = await Promise.all(
      moduleNode.importStmtArr.map(impStmt => (
        this.executeSubmoduleOfImportStatement(
          impStmt, modulePath, moduleEnv, [...ancestorModules, modulePath])
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
    return [moduleEnv.getLiveJSModule(), moduleEnv];
  }





  async executeSubmoduleOfImportStatement(
    impStmt, curModulePath, callerModuleEnv, ancestorModules
  ) {
    let submodulePath = getAbsolutePath(curModulePath, impStmt.str);
    let ret = await this.import(
      submodulePath, impStmt, callerModuleEnv, false, true, false,
      ancestorModules
    );
    return ret;
  }


  async import(
    route, callerNode, callerEnv, assertJSModule = false, assertModule = false,
    prepareJSXImmediately = false, ancestorModules = [],
  ) {
    decrCompGas(callerNode, callerEnv);
    decrGas(callerNode, callerEnv, "import");

    // If modulePath is a relative path, get the current modulePath and
    // compute the full path.
    if (/^\.\.?\//.test(route)) {
      let curPath = callerEnv.getModuleEnv().modulePath;
      route = getAbsolutePath(curPath, route, callerNode, callerEnv);
    }

    // Then simple redirect to this.fetch(), and if assertJSModule is true,
    // assert that the returned value is a LiveJSModule instance.
    let ret = await this.fetch(route, callerNode, callerEnv, ancestorModules);
    if (assertJSModule && !(ret instanceof LiveJSModule)) throw new LoadError(
      `No script was found at ${route}`,
      callerNode, callerEnv
    );
    else if (
      assertModule && !(ret instanceof LiveJSModule || ret instanceof CSSModule)
    ) throw new LoadError(
      `No script or style sheet was found at ${route}`,
      callerNode, callerEnv
    );

    // If the scriptVars.appSettings has been set (meaning that createJSXApp()
    // has been called), also prepare the component's style in case of a 
    // LiveJSModule where the route ends in ".jsx".
    let {appSettings} = callerEnv.scriptVars;
    if (
      appSettings && prepareJSXImmediately &&
      ret instanceof LiveJSModule && route.slice(-4) === ".jsx"
    ) {
      await appSettings.prepareComponent(ret, callerNode, callerEnv);
    }

    return ret;
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
          let moduleNamespaceObj = liveSubmodule;
          curModuleEnv.declare(imp.ident, moduleNamespaceObj, true, imp);
        }
        else if (impType === "named-imports") {
          imp.namedImportArr.forEach(namedImp => {
            let ident = namedImp.ident ?? "default";
            let alias = namedImp.alias ?? ident;
            let val = liveSubmodule.get(ident);
            if (val === undefined) throw new LoadError(
              "No export found of the name '" + ident + "' in module " +
              liveSubmodule.modulePath,
              namedImp, curModuleEnv
            );
            curModuleEnv.declare(alias, val, true, namedImp);
          });
        }
        else if (impType === "default-import") {
          let val = liveSubmodule.get("default");
          if (val === undefined) throw new LoadError(
            "No default export in module " + liveSubmodule.modulePath,
            imp, curModuleEnv
          );
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
    }
    else if (stmtNode.subtype === "function-or-class-export") {
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
      "resolve", {decEnv: scriptEnv}, ({}, [output]) => {
        scriptEnv.scriptVars.resolveScript(output);
        throw new ExitException();
      }
    );

    // Then call executeModuleFunction with that resolve, and with funName =
    // "main".
    let {flags} = scriptEnv.scriptVars;
    this.executeModuleFunction(
      liveScriptModule, "main", inputArr, resolveFun, scriptNode, scriptEnv,
      flags,
    );
  }

  executeModuleFunction(
    liveModule, funName, inputArr, resolveFun, moduleNode, moduleEnv, flags
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
      fun instanceof DefinedFunction ? fun.node : moduleNode, moduleEnv,
      undefined, flags,
    );
  }




  executeFunction(fun, inputArr, callerNode, callerEnv, thisVal, flags) {
    decrCompGas(callerNode, callerEnv);

    // Throw if fun is not a FunctionObject.
    if (!(fun instanceof FunctionObject)) throw new RuntimeError(
      "Function call to a non-function",
      callerNode, callerEnv
    );

    // Initialize a new environment for the execution of the function.
    let execEnv = new Environment(
      fun.decEnv ?? callerEnv.getGlobalEnv(), "function", {
        fun: fun, inputArr: inputArr, callerNode: callerNode,
        callerEnv: callerEnv, thisVal: thisVal, flags: flags,
      }
    );

    // Then execute the function depending on its type.
    if (fun instanceof DefinedFunction) {
      return this.#executeDefinedFunction(fun.node, inputArr, execEnv);
    }
    else if (fun instanceof DevFunction) {
      return this.#executeDevFunction(
        fun, inputArr, callerNode, execEnv,
        thisVal
      );
    }
  }



  #executeDevFunction(devFun, inputArr, callerNode, execEnv, thisVal) {
    let {isAsync, typeArr} = devFun;
    if (typeArr) {
      verifyTypes(inputArr, typeArr, callerNode, execEnv);
    }
    let execVars = {
      callerNode: callerNode, execEnv: execEnv, interpreter: this,
      thisVal: thisVal,
    };
    // If the dev function is asynchronous, call it and return a PromiseObject.
    if (isAsync) {
      let ret;
      let promise = devFun.fun(execVars, inputArr).then(
        x => x, err => new ErrorWrapper(err)
      );
      ret = new PromiseObject(promise, this, callerNode, execEnv);
      return ret;
    }

    // Else call the dev function synchronously and return what it returns.
    else {
      return devFun.fun(execVars, inputArr);
    }
  }



  executeFunctionOffSync(
    fun, inputArr, callerNode, execEnv, thisVal, flags, errRef = [],
  ) {
    if (execEnv.scriptVars.isExiting) {
      return;
    }
    try {
      return this.executeFunction(
        fun, inputArr, callerNode, execEnv, thisVal, flags
      );
    } catch (err) {
      errRef[0] = err;
      this.handleUncaughtException(err, execEnv);
    }
  }


  handleUncaughtException(err, env) {
    if (err instanceof Exception) {
      if (this.isServerSide) {
        env.scriptVars.resolveScript(undefined, err);
      } else {
        logExtendedErrorAndTrace(err);
      }
    }
    else if (err instanceof Error) {
      console.error(err);
    }
    else if (!(err instanceof ExitException)) {
      logExtendedErrorAndTrace(err);
    }
  }





  #executeDefinedFunction(funNode, inputArr, execEnv) {
    // Add the input parameters to the environment.
    funNode.params.forEach((paramExp, ind) => {
      this.assignToParameter(paramExp, inputArr[ind], execEnv, true, false);
    });

    if (funNode.isAsync) {
      let retPromise = this.#executeDefinedFunctionAsyncHelper(
        funNode, execEnv
      ).then(
        x => x, err => new ErrorWrapper(err)
      );
      return new PromiseObject(
        retPromise, this, funNode, execEnv
      );
    }
    else {
      return this.#executeDefinedFunctionHelper(funNode, execEnv);
    }
  }

  async #executeDefinedFunctionAsyncHelper(funNode, execEnv) {
    let state = {i: 0};
    while (true) {
      try {
        return this.#executeDefinedFunctionHelper(funNode, execEnv, state);
      }
      catch (err) {
        if (err instanceof AwaitException) {
          err = await err.whenReady;
          if (err) throw err;
        }
        else throw err;
      }
    }
  }

  #executeDefinedFunctionHelper(funNode, execEnv, state = undefined) {
    // Execute the statements inside a try-catch statement to catch any
    // return exception, or any uncaught break or continue exceptions. On a
    // return exception, return the held value.
    let stmtArr = funNode.body.stmtArr;
    let len = stmtArr.length;
    if (state) {
      state.i ??= 0;
      state.children ??= stmtArr.map(() => []);
    }
    let i = state?.i ?? 0;
    try {
      while (i < len) {
        let childState = state ? state.children[i] : undefined;
        this.executeStatement(stmtArr[i], execEnv, childState);
        i++;
        if (state) state.i++;
      }
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


  
  executeStatement(stmtNode, environment, state = undefined) {
    if (state?.done) return;
    let type = stmtNode.type;
    switch (type) {
      case "block-statement": {
        let newEnv = state?.env ?? new Environment(environment);
        let stmtArr = stmtNode.stmtArr;
        if (state) {
          state.env ??= newEnv;
          state.i ??= 0;
          state.children ??= stmtArr.map(() => ({}));
        }
        let i = state?.i ?? 0;
        let len = stmtArr.length;
        while (i < len) {
          let childState = state ? state.children[i] : undefined;
          this.executeStatement(stmtArr[i], newEnv, childState);
          i++;
          if (state) state.i++;
        }
        break;
      }
      case "if-else-statement": {
        let condState = state ? state.condState ??= {} : undefined;
        let stmtState = state ? state.stmtState ??= {} : undefined;
        let condVal = this.evaluateExpression(
          stmtNode.cond, environment, condState
        );
        if (condVal) {
          this.executeStatement(stmtNode.ifStmt, environment, stmtState);
        } else if (stmtNode.elseStmt) {
          this.executeStatement(stmtNode.elseStmt, environment, stmtState);
        }
        break;
      }
      case "loop-statement": {
        let newEnv = state?.env ?? new Environment(environment);
        if (state) {
          state.env ??= newEnv;
          state.decStmtState ??= {};
          state.condState ??= {};
          state.updateState ??= {};
          state.loopState ??= {};
          state.isFirstIteration ??= true;
        }
        let innerStmt = stmtNode.stmt;
        let updateExp = stmtNode.updateExp;
        let condExp = stmtNode.cond;
        if (stmtNode.dec) {
          this.executeStatement(stmtNode.dec, newEnv, state?.decStmtState);
        }
        let isFirstIteration = state?.isFirstIteration ?? true;
        while (true) {
          if (
            !(stmtNode.doFirst && isFirstIteration) &&
            !this.evaluateExpression(condExp, newEnv, state?.condState)
          ) {
            break;
          }
          try {
            this.executeStatement(innerStmt, newEnv, state?.loopState);
          }
          catch (err) {
            if (err instanceof BreakException) {
              if (state) state.done = true;
              return;
            } else if (!(err instanceof ContinueException)) {
              throw err;
            }
          }
          if (updateExp) {
            this.evaluateExpression(updateExp, newEnv, state?.updateState);
          }
          isFirstIteration = false;
          if (state) {
            state.isFirstIteration = false;
            state.condState = {};
            state.updateState = {};
            state.loopState = {};
          }
        }
        break;
      }
      case "switch-statement": {
        if (state) {
          state.switchExpState ??= {};
        }
        let switchExpVal = this.evaluateExpression(
          stmtNode.exp, environment, state?.switchExpState
        );
        let startInd = state?.startInd;
        if (startInd === undefined) {
          startInd = stmtNode.defaultCase;
          stmtNode.caseArr.some(([caseExp, ind]) => {
            if (
              switchExpVal === this.evaluateExpression(caseExp, environment)
            ) {
              startInd = ind;
              return true; // breaks the some() iteration.
            }
          });
        }
        if (state) state.startInd = startInd;
        if (startInd !== undefined) {
          let newEnv = state?.env ?? new Environment(environment);
          let stmtArr = stmtNode.stmtArr;
          if (state) {
            state.env ??= newEnv;
            state.i ??= 0;
            state.children ??= stmtArr.map(() => ({}));
          }
          let i = state?.i ?? 0;
          let len = stmtArr.length;
          try {
            while(i < len) {
              let childState = state ? state.children[i] : undefined;
              this.executeStatement(stmtArr[i], newEnv, childState);
              i++;
              if (state) state.i++;
            }
          }
          catch (err) {
            if (err instanceof BreakException) {
              break;
            } else {
              throw err;
            }
          }
        }
        break;
      }
      case "expression-statement":
      case "return-statement":
      case "throw-statement": {
        let expState = state ? state.expState ??= {} : undefined;
        let expVal;
        if (stmtNode.exp) {
          expVal = this.evaluateExpression(stmtNode.exp, environment, expState);
        }
        if (type === "expression-statement") {
          break;
        } else if (type === "return-statement") {
          throw new ReturnException(expVal, stmtNode, environment);
        } else {
          throw new Exception(expVal, stmtNode, environment);
        }
      }
      case "try-catch-statement": {
        try {
          if (state?.err) throw state.err;
          let tryEnv = state?.tryEnv ?? new Environment(environment);
          let stmtArr = stmtNode.tryStmtArr;
          if (state) {
            state.tryEnv ??= tryEnv;
            state.i ??= 0;
            state.tryChildren ??= stmtArr.map(() => ({}));
          }
          let i = state?.i ?? 0;
          let len = stmtArr.length;
          while (i < len) {
            let childState = state ? state.tryChildren[i] : undefined;
            this.executeStatement(stmtArr[i], tryEnv, childState);
            i++;
            if (state) state.i++;
          }
        }
        catch (err) {
          let initErr = err;
          if (state) state.err = err;
          if (err instanceof Exception) {
            try {
              let catchEnv = state?.catchEnv;
              if (!catchEnv) {
                catchEnv = new Environment(environment);
                catchEnv.declare(stmtNode.ident, err.val, false, stmtNode);
                if (state) state.catchEnv = catchEnv;
              }
              let stmtArr = stmtNode.catchStmtArr;
              if (state) {
                state.j ??= 0;
                state.catchChildren ??= stmtArr.map(() => ({}));
              }
              let j = state?.j ?? 0;
              let len = stmtArr.length;
              while (j < len) {
                let childState = state ? state.catchChildren[j] : undefined;
                this.executeStatement(stmtArr[j], catchEnv, childState);
                j++;
                if (state) state.j++;
              }
            }
            catch (err) {
              throw (err instanceof Exception && err.val === initErr.val) ?
                initErr : err;
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
        break;
      }
      case "empty-statement": {
        break;
      }
      case "variable-declaration": {
        let isConst = stmtNode.isConst;
        let paramExpArr = stmtNode.children;
        if (state) {
          state.i ??= 0;
          state.children ??= paramExpArr.map(() => ({}));
        }
        let i = state?.i ?? 0;
        let len = paramExpArr.length;
        while (i < len) {
          let paramExp = paramExpArr[i];
          let childState = state ? state.children[i] : undefined;
          this.assignToParameter(
            paramExp, undefined, environment, true, isConst, childState
          );
          i++;
          if (state) state.i++;
        }
        break;
      }
      case "function-declaration": {
        let funVal = new DefinedFunction(stmtNode, environment);
        environment.declare(stmtNode.name, funVal, false, stmtNode);
        break;
      }
      case "class-declaration": {
        // Get the superclass, if any.
        let superclass;
        let superclassIdent = stmtNode.superclass;
        if (superclassIdent !== undefined) {
          superclass = environment.get(superclassIdent, stmtNode);
          if (!(superclass instanceof ClassObject)) throw new RuntimeError(
            "Superclass needs to be a class declared with the 'class' keyword"
          );
        }
        // Construct the shared prototype for the class.
        let prototype = {};
        stmtNode.members.forEach(member => {
          let key = member.ident;
          if (!key) throw new RuntimeError(
            "Invalid, falsy object key",
            member, environment
          );
          let property = this.evaluateExpression(member.valExp, environment);

          // If the property is a method, and the class has a superclass, bind
          // the superclass object to the function before adding it to the
          // prototype.
          if (superclass && property instanceof FunctionObject) {
            property = Object.create(property);
            property.superVal = superclass;
          }

          prototype[key] = property;
        });

        let classObj = new ClassObject(
          stmtNode.name, prototype.constructor, prototype, superclass
        );
        environment.declare(stmtNode.name, classObj, false, stmtNode);
        break;
      }
      default: throw (
        "ScriptInterpreter.executeStatement(): Unrecognized " +
        `statement type: "${type}"`
      );
    }

    // Set state.done = true such that the statement won't be executed again
    // in case of an async function.
    if (state) state.done = true;
  }



  evaluateExpression(expNode, environment, state = undefined) {
    let ret = state?.ret;
    if (ret !== undefined) {
      return (ret === UNDEFINED) ? undefined : ret;
    }
    decrCompGas(expNode, environment);
    let type = expNode.type;
    switch (type) {
      case "arrow-function":
      case "function-expression": {
        let funNode = {
          type: "function-declaration",
          ...expNode,
        };
        ret = new DefinedFunction(funNode, environment);
        break;
      }
      case "array-destructuring-assignment" :
      case "object-destructuring-assignment" : {
        let val = this.evaluateExpression(expNode.valExp, environment);
        ret = this.executeDestructuring(expNode.destExp, val, environment);
        break;
      }
      case "assignment": {
        let exp2State = state ? state.exp2State ??= {} : undefined;
        let op = expNode.op;
        switch (op) {
          case "=":
            ret = this.assignToVariableOrMember(
              expNode.exp1, environment, () => {
                let newVal = this.evaluateExpression(
                  expNode.exp2, environment, exp2State
                );
                return [newVal, newVal];
              }
            );
            break;
          case "+=":
            ret = this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let val = this.evaluateExpression(
                  expNode.exp2, environment, exp2State
                );
                let newVal;
                if (typeof prevVal === "string" || typeof val === "string") {
                  newVal = getString(prevVal, environment) +
                    getString(val, environment);
                }
                else if (
                  typeof prevVal === "number" && typeof val === "number"
                ) {
                  newVal = prevVal + val;
                }
                else throw new ArgTypeError(
                  "Addition of two non-string, non-numerical values",
                  expNode, environment
                );
                return [newVal, newVal];
              }
            );
            break;
          case "-=":
            ret = this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let val = this.evaluateExpression(
                  expNode.exp2, environment, exp2State
                );
                let newVal = parseFloat(prevVal) - parseFloat(val);
                return [newVal, newVal];
              }
            );
            break;
          case "*=":
            ret = this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let val = this.evaluateExpression(
                  expNode.exp2, environment, exp2State
                );
                let newVal = parseFloat(prevVal) * parseFloat(val);
                return [newVal, newVal];
              }
            );
            break;
          case "/=":
            ret = this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let val = this.evaluateExpression(
                  expNode.exp2, environment, exp2State
                );
                let newVal = parseFloat(prevVal) / parseFloat(val);
                return [newVal, newVal];
              }
            );
            break;
          case "&&=":
          case "||=":
          case "??=":
            ret = this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                if (
                  op === "&&=" && !prevVal ||
                  op === "||=" &&  prevVal ||
                  op === "??=" &&  prevVal !== undefined && prevVal !== null
                ) {
                  return [prevVal, prevVal];
                }
                else {
                  let newVal = this.evaluateExpression(
                    expNode.exp2, environment, exp2State
                  );
                  return [newVal, newVal];
                }
              }
            );
            break;
          default: throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
        break;
      }
      case "conditional-expression": {
        let condState = state ? state.condState ??= {} : undefined;
        let expState = state ? state.expState ??= {} : undefined;
        let cond = expNode.cond;
        let condVal = this.evaluateExpression(cond, environment, condState);
        let exp = condVal ? expNode.exp1 : expNode.exp2;
        ret = this.evaluateExpression(exp, environment, expState);
        break;
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
        if (state) {
          state.i ??= 0;
          state.firstExpState ??= {};
          state.nextExpState ??= {};
        }
        let i = state?.i ?? 0;
        let acc = this.evaluateExpression(
          children[0], environment, state?.firstExpState
        );
        if (state) state.acc = acc = state.acc ?? acc;
        let lastOpIndex = children.length - 2;
        let nextVal;
        for ( ; i < lastOpIndex; i += 2) {
          if (state) state.i = i;
          let op = children[i + 1];
          let nextChild = children[i + 2];

          // If the operator has short-circuiting, only evaluate the expression
          // if needed.
          if (op === "||" || op === "??" || op === "&&") {
            if (
              op === "||" && acc ||
              op === "??" && acc !== undefined && acc !== null ||
              op === "&&" && !acc
            ) {
              continue;
            }
            else {
              acc = this.evaluateExpression(
                nextChild, environment, state?.nextExpState
              );
              if (state) {
                state.nextExpState = {};
                state.acc = acc;
              }
              continue;
            }
          }

          // Else evaluate the next expression and compute the new acc.
          nextVal = this.evaluateExpression(
            nextChild, environment, state?.nextExpState
          );
          switch (op) {
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
            case "instanceof":
              acc = (
                acc instanceof ObjectObject && (
                  nextVal instanceof ClassObject ||
                  nextVal instanceof FunctionObject
                )
              ) ? acc = nextVal.isInstanceOfThis(acc) : false;
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
              acc = (typeof acc === "string" || typeof nextVal === "string") ?
                getString(acc, environment) +
                  getString(nextVal, environment) :
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
          if (state) {
            state.nextExpState = {};
            state.acc = acc;
          }
        }
        ret = acc;
        break;
      }
      case "exponential-expression": {
        let rootState = state ? state.rootState ??= {} : undefined;
        let expState = state ? state.expState ??= {} : undefined;
        let rootExp = expNode.root, expExp = expNode.exp;
        let root = this.evaluateExpression(rootExp, environment, rootState);
        let exp = this.evaluateExpression(expExp, environment, expState);
        ret = root ** exp;
        break;
      }
      case "prefix-expression": {
        let op = expNode.op;
        if (op === "++") {
          ret = this.assignToVariableOrMember(
            expNode.exp, environment, prevVal => {
              let int = parseFloat(prevVal);
              if (!int && int !== 0) throw new RuntimeError(
                "Increment of a non-numeric value",
                expNode, environment
              );
              let newVal = int + 1;
              return [newVal, newVal];
            }
          );
          break;
        }
        else if (op === "--") {
          ret = this.assignToVariableOrMember(
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
          break;
        }
        let expState = state ? state.expState ??= {} : undefined;
        let val = this.evaluateExpression(expNode.exp, environment, expState);
        switch (op) {
          case "!":
            ret = !val;
            break;
          case "~":
            ret = ~parseInt(val);
            break;
          case "+":
            ret = +parseFloat(val);
            break;
          case "-":
            ret = -parseFloat(val);
            break;
          case "typeof":
            ret = typeof val;
            break;
          case "void":
            ret = undefined;
            break;
          case "await":
            if (!state) throw new RuntimeError(
              "Cannot use 'await' in this context",
              expNode, environment
            );
            let result = state.result;
            if (result !== undefined) {
              if (result instanceof ErrorWrapper) {
                throw result.val;
              }
              else {
                ret = (result === UNDEFINED) ? undefined : result;
                break;
              }
            }
            else if (val instanceof PromiseObject) {
              let whenReady = val.promise.then(result => {
                state.result = (result === undefined) ? UNDEFINED : result;
                return (result instanceof ErrorWrapper) ?
                  result.val : undefined;
              });
              throw new AwaitException(whenReady, expNode, environment);
            }
            else throw new RuntimeError(
              "Awaiting a non-promise value: " + getString(val, environment),
              expNode, environment
            );
          case "delete":
            ret = this.assignToVariableOrMember(
              expNode.exp, environment, prevVal => {
                if (prevVal === undefined) {
                  return [undefined, false];
                } else {
                  return [undefined, true];
                }
              }
            );
            break;
          default: throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
        break;
      }
      case "postfix-expression": {
        let op = expNode.op;
        switch (op) {
          case "++":
            ret = this.assignToVariableOrMember(
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
            break;
          case "--":
            ret = this.assignToVariableOrMember(
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
            break;
          default: throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
        break;
      }
      // TODO: Continue impl. async handling for the following expression
      // types (and until then, 'await' will just fail in the following
      // expressions).
      case "chained-expression": {
        let val;
        try {
          [val] = this.evaluateChainedExpression(expNode, environment);
        }
        catch (err) {
          if (err instanceof BrokenOptionalChainException) {
            ret = undefined;
            break;
          } else {
            throw err;
          }
        }
        ret = val;
        break;
      }
      case "grouped-expression": {
        let expState = state ? state.expState ??= {} : undefined;
        ret = this.evaluateExpression(expNode.exp, environment, expState);
        break;
      }
      case "array": {
        ret = [];
        expNode.children.forEach(exp => {
          if (exp.type === "spread") {
            let spreadExpVal = this.evaluateExpression(exp.exp, environment);
            if (!(spreadExpVal instanceof Array)) throw new RuntimeError(
              "Invalid spread of a non-array inside an array literal",
              exp, environment
            );
            ret = ret.concat(spreadExpVal);
          }
          else {
            ret.push(this.evaluateExpression(exp, environment));
          }
        });
        break;
      }
      case "object": {
        ret = {};
        expNode.members.forEach(member => {
          if (member.type === "spread") {
            let spreadExpVal = this.evaluateExpression(member.exp, environment);
            forEachValue(spreadExpVal, member, environment, (val, key) => {
              ret[key] = val;
            });
          }
          else {
            let key = member.ident;
            if (key === undefined) {
              key = getStringOrSymbol(
                this.evaluateExpression(member.keyExp, environment),
                expNode, environment
              );
            }
            if (!key) throw new RuntimeError(
              "Invalid, falsy object key",
              expNode, environment
            );
            ret[key] = this.evaluateExpression(member.valExp, environment);
          }
        });
        break;
      }
      case "jsx-element": {
        ret = new JSXElement(expNode, environment, this);
        break;
      }
      case "identifier": {
        let ident = expNode.ident;
        ret = environment.get(ident, expNode);
        break;
      }
      case "string": {
        ret = expNode.str;
        break;
      }
      case "number": {
        ret = parseFloat(expNode.lexeme);
        break;
      }
      case "constant": {
        let lexeme = expNode.lexeme;
        ret = (lexeme === "true") ? true :
               (lexeme === "false") ? false :
               (lexeme === "null") ? null :
               (lexeme === "Infinity") ? Infinity :
               (lexeme === "NaN") ? NaN :
               undefined;
        break;
      }
      case "this-keyword": {
        ret = environment.getThisVal();
        break;
      }
      case "promise-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        ret = new PromiseObject(expVal, this, expNode.exp, environment);
        break;
      }
      case "promise-all-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        if (expVal instanceof ObjectObject) expVal = expVal.members;
        if (!(expVal instanceof Array)) throw new RuntimeError(
          "Value is not iterable",
          expNode.exp, environment
        );
        let parallelPromise = Promise.all(
          expVal.map((promiseObject, key) => {
            if (promiseObject instanceof PromiseObject) {
              return promiseObject.promise;
            }
            else throw new RuntimeError(
              "Promise.all() received a non-promise-valued element, at " +
              `index ${key}`,
              expNode, environment
            );
          })
        ).then(resultArr => {
          let wrappedError = resultArr.reduce(
            (acc, val) => 
              acc ?? (val instanceof ErrorWrapper ? val : undefined),
            undefined
          );
          return wrappedError ?? resultArr;
        });
        ret = new PromiseObject(parallelPromise, this, expNode, environment);
        break;
      }
      case "symbol-call": {
        let expVal = (expNode.exp === undefined) ? undefined : getString(
          this.evaluateExpression(expNode.exp, environment), environment
        );
        ret = Symbol(expVal);
        break;
      }
      case "import-call": {
        let path = this.evaluateExpression(expNode.pathExp, environment);
        let liveModulePromise = this.import(
          path, expNode, environment, false, false, true
        ).then(
          x => x, err => new ErrorWrapper(err)
        );
        ret = new PromiseObject(
          liveModulePromise, this, expNode, environment
        );
        break;
      }
      case "console-call": {
        let {isExiting, log} = environment.scriptVars;
        let expValArr = expNode.expArr.map(
          exp => this.evaluateExpression(exp, environment)
        );
        if (expNode.subtype === "log") {
          if (!this.isServerSide && !isExiting) {
            console.log(...expValArr);
          }
          log.entries.push(
            expValArr.map(val => getString(val, environment))
          );
        }
        // We experiment here with another API for console.trace(), which is:
        // console.trace(maxNum = 15, stringify = true), which returns a list
        // of at most maxNum function calls, but not just with the function
        // names; we also include their input tuple and the module in which
        // they are defined.
        else if (expNode.subtype === "trace") {
          let maxNum = Math.abs(parseInt(expValArr[0]));
          maxNum = Number.isNaN(maxNum) ?
            this.isServerSide ? TRACE_LENGTH_SS : TRACE_LENGTH_CS :
            maxNum;
          let stringify = expValArr[0];
          let trace = environment.getCallTrace(maxNum, stringify);
          let varReadout = environment.getVariableReadout();
          if (!this.isServerSide && !isExiting) {
            console.log("Trace:");
            trace.forEach(str => console.log(str));
            console.log(" ");
            console.log("Declared variables:");
            varReadout.split("\n").forEach(str => console.log(str));
          }
          log.entries.push(
            ["Trace:"],
            ...trace.map(str => [str]),
            [" "],
            ["Declared variables:"],
            ...varReadout.split("\n").map(str => [str]),
          );
        }
        else if (expNode.subtype === "error") {
          if (!this.isServerSide && !isExiting) {
            console.error(...expValArr);
          }
          log.error = expValArr[0];
        }
        ret = undefined;
        break;
      }
      case "super-call": {
        let superclass = environment.getSuperclass(expNode, environment);
        let thisVal = environment.getThisVal();
        let inputArr = expNode.params.map(
          param => this.evaluateExpression(param, environment)
        );
        this.executeFunction(
          superclass.instanceConstructor, inputArr, expNode, environment,
          thisVal,
        );
        ret = undefined;
        break;
      }
      case "super-access": {
        let superclass = environment.getSuperclass(expNode, environment);
        let superPropVal = superclass.getPrototypeProperty(
          this, expNode.accessor, environment
        );
        if (superPropVal instanceof FunctionObject) {
          superPropVal = Object.create(superPropVal);
          superPropVal.thisVal = environment.getThisVal();
        }
        ret = superPropVal;
        break;
      }
      case "abs-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        let expType = typeof expVal;
        if (expType === "string") {
          let curPath = environment.getModuleEnv().modulePath;
          ret = getAbsolutePath(curPath, expVal, expNode.exp, environment);
        }
        else if (expType === "number") {
          ret = Math.abs(expVal);
        }
        else {
          ret = NaN;
        };
        break;
      }
      default: throw (
        "ScriptInterpreter.evaluateExpression(): Unrecognized type: " +
        `"${type}"`
      );
    }

    // If state is defined, in case of an async function, store ret on the
    // state before returning it such that the expression will not need to be
    // evaluated again. 
    if (state) {
      state.ret = (ret === undefined) ? UNDEFINED : ret;
    }
    return ret;
  }


  executeDestructuring(expNode, val, environment, isDeclaration, isConst) {
    let type = expNode.type;
    if (type === "array-destructuring") {
      verifyType(val, "array", false, expNode, environment);
      if (val instanceof ObjectObject) val = val.members;
      expNode.children.forEach((paramExp, ind) => {
        if (paramExp !== ",") {
          this.assignToParameter(
            paramExp, val[ind], environment, isDeclaration, isConst
          );
        }
      });
      if (expNode.restParam) {
        this.assignToParameter(
          expNode.restParam, val.slice(expNode.children.length),
          environment, isDeclaration, isConst
        );
      }
      return val;
    }
    else if (type === "object-destructuring") {
      let valProto = getPrototypeOf(val);
      if (valProto !== OBJECT_PROTOTYPE && !(val instanceof ObjectObject)) {
        throw new RuntimeError(
          "Destructuring an object with a non-object value: " +
          getString(val, environment),
          expNode, environment
        );
      }
      expNode.children.forEach(paramMemExp => {
        let ident = paramMemExp.ident;
        let propVal = getPropertyFromObject(val, ident);
        this.assignToParameter(
          paramMemExp, propVal, environment, isDeclaration, isConst
        );
      });
      return val;
    }
    else throw new RuntimeError(
      "Cannot assign to this type of expression",
      expNode, environment
    );
  }


  assignToParameter(
    paramExp, val, environment, isDeclaration, isConst, state = undefined
  ) {
    let targetExp = paramExp.targetExp;
    if (val === undefined && paramExp.defaultExp) {
      val = this.evaluateExpression(paramExp.defaultExp, environment, state);
    }
    let type = targetExp.type
    if (type === "identifier") {
      if (isDeclaration) {
        environment.declare(targetExp.ident, val, isConst, targetExp);
        return val;
      } else {
        return environment.assign(targetExp.ident, () => [val, val], targetExp);
      }
    }
    else if (type === "chained-expression") {
      if (isDeclaration) {
        throw new RuntimeError(
          "Only variables or destructuring expressions can be used in " +
          "declarations",
          targetExp, environment
        );
      } else {
        return this.assignToVariableOrMember(
          targetExp, environment, () => [val, val]
        );
      }
    }
    else {
      return this.executeDestructuring(
        targetExp, val, environment, isDeclaration, isConst
      );
    }
  }



  assignToVariableOrMember(expNode, environment, assignFun) {
    if (expNode.type === "identifier") {
      return environment.assign(expNode.ident, assignFun, expNode);
    }
    else {
      if (expNode.type !== "chained-expression") throw new RuntimeError(
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
      let prevVal, objVal, key;
      try {
        [prevVal, objVal, key] = this.evaluateChainedExpression(
          expNode, environment
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

      // If the object is an ObjectObject, redirect to its assign() method.
      if (objVal instanceof ObjectObject) {
        return objVal.assign(key, assignFun, expNode, environment);
      }

      // Else throw, since only ObjectObject instances can be mutable.
      else throw new RuntimeError(
        "Assignment to a property of an immutable object",
        expNode, environment
      );
    }
  }


  // evaluateChainedExpression() => [val, objVal, key], or throws
  // a BrokenOptionalChainException. Here, val is the value of the whole
  // expression, and objVal, is the value of the object before the last member
  // accessor (if the last postfix is a member accessor and not a tuple).
  evaluateChainedExpression(expNode, environment) {
    let {rootExp, postfixArr, isNew} = expNode;
    let postfix, objVal, key;
    let val = this.evaluateExpression(rootExp, environment);
    let len = postfixArr.length;
    if (len === 0) {
      return [val];
    }
    decrCompGas(rootExp, environment);

    // In case of a 'new' expression, we handle the initial first part of the
    // chain in a special way, and then continue to the subsequent for loop,
    // but with i starting at 1 instead of 0.

    if (isNew) {
      // (Note that the parser has failed if not the postfixArr[0] is an
      // expression tuple.)
      let expTuple = postfixArr[0];
      let inputArr = expTuple.children.map(
        param => this.evaluateExpression(param, environment)
      );
      if (val instanceof ClassObject) {
        val = val.getNewInstance(inputArr, expTuple, environment);
      }
      else if (val instanceof FunctionObject) {
        let newInst = new ObjectObject(
          "Object", undefined, {}, undefined, val
        );
        this.executeFunction(
          val, inputArr, expTuple, environment, newInst
        );
        val = newInst;
      }
      else throw new RuntimeError(
        "Invalid 'new' expression with a non-class, non-function argument",
        rootExp, environment
      );
    }

    // Evaluate the chained expression accumulatively, one postfix at a time.
    for (let i = isNew ? 1 : 0; i < len; i++) {
      postfix = postfixArr[i];

      // If postfix is a member accessor, get the member value, and assign the
      // current val to objVal.
      if (postfix.type === "member-accessor") {
        objVal = val;
        [val, key] = this.getProperty(objVal, postfix, environment);
      }

      // Else if postfix is an expression tuple, execute the current val as a
      // function, and reassign it to the return value.
      else if (postfix.type === "expression-tuple") {
        // Evaluate the expressions inside the tuple.
        let inputExpArr = postfix.children;
        let inputValArr = inputExpArr.map(exp => (
          this.evaluateExpression(exp, environment)
        ));

        // Then execute the function and assign its return value to val.
        val = this.executeFunction(
          val, inputValArr, expNode, environment, objVal
        );
        objVal = undefined;
      }
      else throw "evaluateChainedExpression(); Unrecognized postfix type";
    }

    // Finally return val and objVal, which should now respectively hold the
    // value of the full expression and the value of the object before the
    // last member access, or undefined if the last postfix was an expression
    // tuple. Also return the key.
    return [val, objVal, key];
  }


  getProperty(objVal, accessor, environment) {
    let val, key;
    // Throw a BrokenOptionalChainException if an optional chaining is
    // broken.
    if (accessor.isOpt && (objVal === undefined || objVal === null)) {
      throw new BrokenOptionalChainException();
    }

    // Else, first get the key.
    key = accessor.ident;
    if (key === undefined) {
      key = getStringOrSymbol(
        this.evaluateExpression(accessor.exp, environment),
        accessor, environment
      );
    }

    // If the object is an AbstractUHObject, instead of getting from the
    // object's properties directly, get from the objects 'members'
    // property. Also check against accessing members of a non-object.
    let objProto = getPrototypeOf(objVal);
    if (objProto === OBJECT_PROTOTYPE) {
      val = Object.hasOwn(objVal, key) ? objVal[key] : undefined;
    }
    else {
      if (objProto === ARRAY_PROTOTYPE) {
        if (key === "length"){
          val = objVal.length;
        } else {
          val = Object.hasOwn(objVal, key) ? objVal[key] : undefined;
        }
      }
      else if (objVal instanceof ObjectObject) {
        val = objVal.get(key);
      }
      else if (typeof objVal === "string") {
        if (key === "length") {
          val = objVal.length;
        }
        else {
          let intKey = parseInt(key);
          if (!Number.isNaN(intKey) && intKey == key) {
            val = objVal[intKey];
          }
          else {
            val = undefined;
          }
        }
      }
      else throw new RuntimeError(
        "Trying to access a member of a non-object: " +
        getString(objVal, environment),
        accessor, environment
      );
    }

    return [val, key];
  }

}









export class Environment {
  constructor(
    parent, scopeType = "block", {
      fun, inputArr, callerNode, callerEnv, thisVal, flags,
      modulePath, lexArr, strPosArr, script,
      scriptVars,
    } = {},
  ) {
    this.scriptVars = scriptVars ?? parent?.scriptVars ?? (() => {
      throw "Environment: No scriptVars object provided";
    })();
    this.parent = parent;
    this.scopeType = scopeType;
    this.variables = new Map();
    this.flags = new Map();
    if (scopeType === "function") {
      let {
        isArrowFun, isDevFun, flags: funFlags, thisVal: boundThisVal, superVal,
        name,
      } = fun;
      this.inputArr = inputArr;
      this.callerNode = callerNode;
      this.callerEnv = callerEnv;
      if (!isArrowFun) {
        this.thisVal = boundThisVal ?? thisVal;
        this.superVal = superVal;
      }
      if (isArrowFun) this.isArrowFun = isArrowFun;
      if (isDevFun) {
        this.isDevFun = isDevFun;
        this.name = name;
      }
      if (funFlags) this.setFlags(funFlags);
    }
    else if (scopeType === "module") {
      this.modulePath = modulePath;
      this.lexArr = lexArr;
      this.strPosArr = strPosArr;
      this.script = script;
      this.exports = [];
      this.liveModule = undefined;
    }
    if (flags) this.setFlags(flags);
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
      return this.parent.get(ident, node, nodeEnvironment);
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
      let [newVal, ret] = assignFun(
        prevVal === UNDEFINED ? undefined : prevVal
      );
      newVal = (newVal === undefined) ? UNDEFINED : newVal;
      this.variables.get(ident)[0] = newVal;
      return ret;
    }
    else if (this.parent) {
      return this.parent.assign(ident, assignFun, node, nodeEnvironment);
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
    if (this.thisVal !== undefined) {
      return this.thisVal;
    }
    else if (this.isNonArrowFunction) {
      return undefined;
    }
    else if (this.parent) {
      return this.parent.getThisVal();
    }
  }

  assignThisVal(thisVal) {
    if (this.isNonArrowFunction) {
      this.thisVal = thisVal;
    }
    else if (this.parent) {
      this.parent.assignThisVal(thisVal);
    }
  }

  getSuperclass(node, env) {
    if (this.superVal !== undefined) {
      return this.superVal;
    }
    else if (this.isNonArrowFunction) {
      throw new RuntimeError(
        "'super' is not defined in this context",
        node, env
      );
    }
    else if (this.parent) {
      return this.parent.getSuperclass(node, env);
    }
  }

  getFlag(flag, stopAtClear = true) {
    let flagParams = this.flags.get(flag);
    if (flagParams !== undefined) {
      if (flagParams === UNDEFINED) {
        return undefined;
      }
      return flagParams;
    }
    else if (stopAtClear && this.flags.get(CLEAR_FLAG)) {
      return undefined;
    }
    else if (this.scopeType === "function") {
      return this.callerEnv.getFlag(flag, stopAtClear);
    }
    else if (this.parent) {
      return this.parent.getFlag(flag, stopAtClear);
    }
  }

  setFlag(flag, flagParams = UNDEFINED) {
    this.flags.set(flag, flagParams);
  }

  setFlags(flags) {
    flags.forEach((flag) => {
      let flagParams = true;
      if (flag instanceof Array) {
        [flag, flagParams] = flag;
      }
      this.setFlag(flag, flagParams);
    });
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

  getLiveJSModule() {
    if (!this.liveModule ) {
      this.liveModule = new LiveJSModule(
        this.modulePath, this.exports, this.scriptVars, this.script
      );
    }
    return this.liveModule;
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


  getCallTrace(maxLen = TRACE_LENGTH_CS, stringify = false) {
    return this.getCallTraceHelper(maxLen, stringify).reverse();
  }

  getCallTraceHelper(maxLen, stringify) {
    if (maxLen <= 0 || this.scopeType === "module") return [];
    else if (this.scopeType === "function") {
      let {callerNode, callerEnv} = this;
      let callStr = (callerEnv.isDevFun) ?
        "<call inside of " + callerEnv.name + ">" :
        getCallString(callerNode, callerEnv, this, stringify);
      let ret = callerEnv.getCallTraceHelper(maxLen - 1, stringify);
      ret.push(callStr);
      return ret;
    }

    // If the function is an SMF called by another SMF, check if the "no-trace"
    // flag is raised by the calling SMF, and if so, stop the trace here.
    else if (
      this.flags.get(REQUESTING_SMF_ROUTE_FLAG) &&
      this.getFlag(NO_TRACE_FLAG)
    ) {
      return [];
      // TODO: Test that the trace is cut off at the correct point.
    }

    else {
      return this.parent.getCallTraceHelper(maxLen, stringify);
    }
  }

  getVariableReadout() {
    if (this.getFlag(NO_TRACE_FLAG)) return "";
    let scopeReadout = "<" + this.scopeType + " scope>:\n" +
      [...this.variables.entries()].map(([ident, [val]]) => {
        val = (val === UNDEFINED) ? "undefined" :
          typeof val === "string" ? JSON.stringify(val) :
            getString(val, this)
        return ident + " = " + val;
    }).join("\n");
    return scopeReadout + (
      this.parent ? "\n" + this.parent.getVariableReadout() : ""
    );
  }

}

export const UNDEFINED = Symbol("undefined");

export const CLEAR_FLAG = Symbol("clear");



function getCallString(callNode, callEnv, execEnv, stringify) {
  let nodeStr = getNodeString(callNode, callEnv, true);
  let {inputArr} = execEnv;
  return nodeStr + ", \narguments: (" +
    inputArr.map(val => (
      (val === undefined) ? "undefined" :
        (typeof val === "string") ? JSON.stringify(val) :
          stringify ? jsonStringify(val) : getString(val, callEnv)
    )).join(", ") +
  ")";
}






const emptyObj = {};


export class ObjectObject {
  constructor(
    className, classObj = undefined, members = {}, prototype = emptyObj,
    constructor = undefined, isComparable = undefined, isMutable = undefined,
    isArray = undefined, isMap = undefined,
  ) {
    this.className = className;
    this.class = classObj;
    this.members = members;
    this.proto = prototype;
    this.classConstructor = constructor;
    this.isComparable = isComparable;
    this.isMutable = isMutable;
    if (isArray) this.isArray = isArray;
    if (isMap) this.isMap = isMap;
  }

  get(key, node, env) {
    key = this.validateKey(key, node, env);
    return this.#get(key)
  }

  assign(key, assignFun, node, env) {
    if (!this.isMutable) throw new RuntimeError(
      "Assignment to a member of an immutable object",
      node, env
    );
    key = this.validateKey(key, node, env);
    let prevVal = this.#get(key, node, env);

    let [newVal, ret] = assignFun(prevVal);
    this.#set(key, newVal, node, env)
    return ret;
  }

  set(key, val, node, env) {
    if (!this.isMutable) throw new RuntimeError(
      "Assignment to a member of an immutable object",
      node, env
    );
    key = this.validateKey(key, node, env);
    return this.#set(key, val, node, env);
  }

  #get(key) {
    let ret = this.isMap ? this.members.get(key) :
      Object.hasOwn(this.members, key) ? this.members[key] : undefined;
    if (ret === undefined) {
      ret = getPropertyFromObject(this.proto, key)
    }
    if (ret === undefined) {
      let classObj = this.class;
      while (classObj !== undefined) {
        ret = getPropertyFromObject(classObj.instanceProto, key);
        if (ret !== undefined) break;
        classObj = classObj.superclass;
      }
    }
    return ret;
  }
  #set(key, val) {
    if (this.isMap) this.members.set(key, val);
    else this.members[key] = val;
  }

  validateKey(key, node, env) {
    if (this.isArray) {
      if (key !== "length") {
        key = parseInt(key);
        if (
          key != parseInt(key) ||
          Number.isNaN(key) || key < 0 || key > MAX_ARRAY_INDEX
        ) {
          throw new RuntimeError(
            "Invalid key for array entry assignment",
            node, env
          );
        }
      }
    }
    else if (this.isMap) {
      if (key === undefined) throw new RuntimeError(
        "Invalid key for map entry assignment",
        node, env
      );
    }
    else {
      key = getStringOrSymbol(key, env);
      if (!key) throw new RuntimeError(
        "Invalid key for object property assignment",
        node, env
      );
    }
    return key;
  }

  stringify() {
    return (this.isMap) ? `"Map()"` : jsonStringify(this.members);
  }
  toString(env) {
    let {interpreter} = env.scriptVars;
    let toStringMethod = this.#get("toString");
    if (toStringMethod instanceof FunctionObject) {
      let ret, isInvalid; 
      try {
        // If this.class is an instance of the ExceptionClassObject, get the
        // message directly in order to avoid spending further computation gas.
        if (
          this instanceof ObjectObject &&
          this.class instanceof ExceptionClassObject
        ) {
          ret = this.#get("message");
        }
        else {
          ret = interpreter.executeFunction(
            toStringMethod, [], null, env, this, [CLEAR_FLAG]
          );
        }
      } catch (_) {
        isInvalid = true;
      }
      if (!isInvalid && typeof ret === "object" && ret !== null) {
        isInvalid = true
      }
      if (isInvalid) {
        ret = "[" + this.className + ".toString() error]";
      }
      return ret.toString();
    }
    else {
      return `[object ${this.className}]`;
    }
  }
}



export class ClassObject extends ObjectObject {
  constructor(
    className, constructor = undefined, prototype = {}, superclass = undefined,
    instancesAreComparable = superclass?.instancesAreComparable,
    instancesAreMutable = superclass?.instancesAreMutable,
    instancesAreArrays = superclass?.instancesAreArrays,
    instancesAreMaps = superclass?.instancesAreMaps,
  ) {
    super("Class");
    this.className = className;
    this.instanceConstructor = constructor ?? (
      (superclass === undefined) ?
        new DevFunction(className, {superVal: superclass}, () => {}) :
        new DevFunction(
          className, {superVal: superclass},
          ({callerNode, execEnv, thisVal, interpreter}, inputArr) => {
            interpreter.executeFunction(
              superclass.instanceConstructor, inputArr, callerNode, execEnv,
              thisVal,
            );
          }
        )
    );
    this.instanceProto = prototype;
    this.superclass = superclass;
    this.instancesAreComparable = instancesAreComparable;
    this.instancesAreMutable = instancesAreMutable;
    this.instancesAreArrays = instancesAreArrays;
    this.instancesAreMaps = instancesAreMaps;
  }

  isInstanceOfThis(val) {
    if (val.classConstructor === this.instanceConstructor) {
      return true;
    }
    else if (val.proto instanceof ObjectObject) {
      return this.isInstanceOfThis(val.proto);
    }
    else {
      return false;
    }
  }

  getNewInstance(inputArr, callerNode, callerEnv) {
    let {interpreter} = callerEnv.scriptVars;
    let members = this.instancesAreArrays ? [] :
      this.instancesAreMaps ? new Map() : {};
    let newInst = new ObjectObject(
      this.className, this, members, this.instanceProto,
      this.instanceConstructor, this.instancesAreComparable, true,
      this.instancesAreArrays, this.instancesAreMaps,
    );
    interpreter.executeFunction(
      this.instanceConstructor, inputArr, callerNode, callerEnv, newInst
    );
    newInst.isMutable = this.instancesAreMutable;
    return newInst;
  }

  getPrototypeProperty(interpreter, accessor, env) {
    let [val] = interpreter.getProperty(
      this.instanceProto, accessor, env
    );
    if (val === undefined && this.superclass) {
      return this.superclass.getPrototypeProperty(interpreter, accessor, env);
    }
    else {
      return val;
    }
  }

  toString() {
    return "[object Class]";
  }
}








export function getPropertyFromObject(obj, key) {
  if (obj instanceof ObjectObject) {
    return obj.get(key);
  }
  else if (obj instanceof Object) {
    return getPropertyFromPlainObject(obj, key);
  }
  else return undefined;
}

export function getPropertyFromPlainObject(obj, key) {
  let objProto = Object.getPrototypeOf(obj);
  if (objProto === OBJECT_PROTOTYPE) {
    return Object.hasOwn(obj, key) ? obj[key] : undefined;
  }
  else if (objProto === ARRAY_PROTOTYPE) {
    return key === "length" || Object.hasOwn(obj, key) ? obj[key] : undefined;
  }
}


export function setPropertyOfObject(obj, key, val, node, env) {
  if (obj instanceof ObjectObject) {
    return obj.set(key, val, node, env);
  }
  else throw new RuntimeError(
    "Assignment to a property of an Immutable object or non-object",
    node, env
  );
}




export function getString(val, env, getSourceCode = false) {
  if (val === undefined) {
    return "undefined";
  }
  else if (val === null) {
    return "null";
  }
  else if (val instanceof ObjectObject) {
    return val.toString(env, getSourceCode);
  }
  else if (val instanceof Array) {
    return "[" +
      val.map(entry => (
        typeof entry === "string" ?
          JSON.stringify(entry) :
          getString(entry, env)
      )).join(", ") +
    "]";
  }
  else if (getPrototypeOf(val) === OBJECT_PROTOTYPE) {
    return "{" +
      Object.entries(val).map(
        ([key, prop]) => key + ": " + (
          typeof prop === "string" ?
            JSON.stringify(prop) :
            getString(prop, env)
        )
      ).join(", ") +
    "}";
  }
  else if (val.toString instanceof Function) {
    return val.toString();
  }
  else throw (
    "toString(): Invalid argument"
  );
}

export function getStringOrSymbol(val, env) {
  return (typeof val === "symbol") ? val : getString(val, env);
}


export function jsonStringify(val) {
  if (val instanceof ObjectObject) {
    return val.stringify();
  }
  else if (typeof val === "symbol") {
    return JSON.stringify(val.toString());
  }
  let valProto = getPrototypeOf(val);
  if (valProto === ARRAY_PROTOTYPE) {
    return "[" + val.map(val => (jsonStringify(val))).join(",") + "]";
  }
  else if (valProto === OBJECT_PROTOTYPE) {
    return "{" +
      Object.entries(val).map(([key, val]) => (
        `${JSON.stringify(key)}:${jsonStringify(val)}`
      )).join(",") +
    "}";
  }
  else if (val instanceof Object) {
    throw "User has access to an object that they shouldn't have";
  }
  else {
    return JSON.stringify(val ?? null);
  }
}

export function jsonParse(val, node, env) {
  if (val === undefined) return undefined;
  try {
    return JSON.parse(val);
  } catch (_) {
    throw new ArgTypeError(
      "Parsing invalid JSON",
      node, env
    );
  }
}



export function forEachValue(value, node, env, callback, ignore = false) {
  if (value instanceof ObjectObject) {
    if (value.isArray || value.isMap) {
      value.members.forEach(callback);
    }
    else {
      Object.entries(value.members).forEach(([key, val]) => callback(val, key));
    }
  }
  else {
    let valProto = getPrototypeOf(value);
    if (valProto === ARRAY_PROTOTYPE) {
      value.forEach(callback);
    }
    else if (valProto === OBJECT_PROTOTYPE) {
      Object.entries(value).forEach(([key, val]) => callback(val, key));
    }
    else if (!ignore) throw new RuntimeError(
      "Iterating over a non-iterable value: " + getString(value, env),
      node, env
    );
  }
}

export function mapValues(value, node, env, callback) {
  if (value instanceof ObjectObject) {
    if (value.isArray) {
      return value.members.map((val, ind) => callback(val, ind, ind));
    }
    else if (value.isMap) {
      return [...value.members.entries()].map(
        ([key, val], ind) => callback(val, key, ind)
      );
    }
    else {
      return Object.entries(value.members).map(
        ([key, val], ind) => callback(val, key, ind)
      );
    }
  }
  else {
    let valProto = getPrototypeOf(value);
    if (valProto === ARRAY_PROTOTYPE) {
      return value.map((val, ind) => callback(val, ind, ind));
    }
    else if (valProto === OBJECT_PROTOTYPE) {
      return Object.entries(value).map(
        ([key, val], ind) => callback(val, key, ind)
      );
    }
    else throw new RuntimeError(
      "Iterating over a non-iterable value: " + getString(value, env),
      node, env
    );
  }
}


export function getPrototypeOf(value) {
  if (value && value instanceof Object) {
    return Object.getPrototypeOf(value);
  }
  else {
    return undefined;
  }
}


export function isArray(value) {
  if (value instanceof ObjectObject) {
    return value.isArray;
  }
  else return (value instanceof Array);
}




// // deepCopy() deep-copies the object and all ist nested properties.
// export function deepCopy(value) {
//   if (value instanceof ObjectObject) {
//     let ret = Object.create(value);
//     ret.members = deepCopy(value.members);
//     ret.proto = deepCopy(value.proto);
//     if (value instanceof PromiseObject) {
//       ret.isCopied = true;
//     }
//     return ret;
//   }
//   let valProto = getPrototypeOf(value);
//   if (valProto === ARRAY_PROTOTYPE) {
//     return value.map(val => deepCopy(val));
//   }
//   else if (valProto === OBJECT_PROTOTYPE) {
//     let ret = {};
//     Object.entries(value).forEach(([key, val]) => {
//       ret[key] = deepCopy(val);
//     });
//     return ret;
//   }
//   else {
//     return value;
//   }
// }







export class FunctionObject extends ObjectObject {
  constructor() {
    super("Function");
  }

  isInstanceOfThis(val) {
    if (val.classConstructor === this) {
      return true;
    }
    else if (val.proto instanceof ObjectObject) {
      return this.isInstanceOfThis(val.proto);
    }
    else {
      return false;
    }
  }
};

export class DefinedFunction extends FunctionObject {
  constructor(node, decEnv, thisVal = undefined) {
    super();
    this.node = node;
    this.decEnv = decEnv;
    this.thisVal = thisVal;
  }
  get isArrowFun() {
    return this.node.type === "arrow-function";
  }
  get name() {
    return this.node.name ?? "<anonymous>";
  }
}

export class DevFunction extends FunctionObject {
  constructor(name, options, fun) {
    super();
    if (!fun) {
      fun = options;
      options = {};
    }
    let {isAsync, typeArr, flags, thisVal, superVal} = options;
    this._name = name;
    if (isAsync) this.isAsync = isAsync;
    if (typeArr) this.typeArr = typeArr;
    if (flags) this.flags = flags;
    if (thisVal) this.thisVal = thisVal;
    if (superVal) this.superVal = superVal;
    this.fun = fun;
  }
  get isArrowFun() {
    return false;
  }
  get isDevFun() {
    return true;
  }
  get name() {
    return this._name ?? "<anonymous dev function>";
  }
}






export const mutableObjectClass = new ClassObject(
  "MutableObject", new DevFunction(
    "MutableObject", {typeArr: ["any?"]},
    ({callerNode, execEnv, thisVal}, [obj]) => {
      if (obj) {
        forEachValue(obj, callerNode, execEnv, (val, key) => {
          setPropertyOfObject(thisVal, key, val, callerNode, execEnv);
        });
      }
    }
  ), undefined, undefined, true, true
);
export const mutableArrayClass = new ClassObject(
  "MutableArray", new DevFunction(
    "MutableArray", {typeArr: ["array?"]},
    ({callerNode, execEnv, thisVal}, [arr]) => {
      if (arr) {
        forEachValue(arr, callerNode, execEnv, (val, ind) => {
          setPropertyOfObject(thisVal, ind, val, callerNode, execEnv);
        });
      }
    }
  ), undefined, undefined, true, true, true
);
export const mutableMapClass = new ClassObject(
  "MutableMap", undefined, undefined, undefined, false, true, false, true
);






export function verifyType(val, type, isOptional, node, env) {
  if (val === undefined) {
    if (isOptional) {
      return;
    }
    else throw new ArgTypeError(
      "Value is undefined, expected " + getString(type, env),
      node, env
    );
  }
  let typeOfVal = typeof val;
  switch (type) {
    case "string":
      if (typeOfVal !== "string") throw new ArgTypeError(
        `Value is not a string: ${getString(val, env)}`,
        node, env
      );
      break;
    case "hex-string":
    case "hex string":
    case "hex":
      if (typeOfVal !== "string" || !/^[0-9a-fA-F]*$/.test(val)) {
        throw new ArgTypeError(
          `Value is not a hexadecimal string: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "number":
      if (typeOfVal !== "number") throw new ArgTypeError(
        `Value is not a number: ${getString(val, env)}`,
        node, env
      );
      break;
    case "integer":
      if (typeOfVal !== "number" || parseInt(val) !== val) {
        throw new ArgTypeError(
          `Value is not an integer: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "integer unsigned":
    case "integer nonnegative":
      if (typeOfVal !== "number" || parseInt(val) !== val || val < 0) {
        throw new ArgTypeError(
          `Value is not an non-negative integer: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "integer positive":
      if (typeOfVal !== "number" || parseInt(val) !== val || val <= 0) {
        throw new ArgTypeError(
          `Value is not a positive integer: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "boolean":
      if (typeOfVal !== "boolean") throw new ArgTypeError(
        `Value is not a boolean: ${getString(val, env)}`,
        node, env
      );
      break;
    case "symbol":
      if (typeOfVal !== "symbol") throw new ArgTypeError(
        `Value is not a Symbol: ${getString(val, env)}`,
        node, env
      );
      break;
    case "object key":
      if (!val || (typeOfVal !== "string" && typeOfVal !== "symbol")) {
        throw new ArgTypeError(
          `Value is not a valid object key: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "object":
      if (
        getPrototypeOf(val) !== OBJECT_PROTOTYPE &&
        !(val instanceof ObjectObject)
      ) {
        throw new ArgTypeError(
          `Value is not an object: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "array":
      if (
        getPrototypeOf(val) !== ARRAY_PROTOTYPE &&
        (!(val instanceof ObjectObject) || !val.isArray)
      ) {
        throw new ArgTypeError(
          `Value is not an array: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "function":
      if (!(val instanceof FunctionObject)) {
        throw new ArgTypeError(
          `Value is not a function: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "module":
      if (!(val instanceof LiveJSModule)) {
        throw new ArgTypeError(
          `Value is not a live module object: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "promise":
        if (!(val instanceof PromiseObject)) {
          throw new ArgTypeError(
            `Value is not a promise object: ${getString(val, env)}`,
            node, env
          );
        }
        break;
    case "class":
      if (!(val instanceof ClassObject)) {
        throw new ArgTypeError(
          `Value is not a class: ${getString(val, env)}`,
          node, env
        );
      }
      break;
    case "any":
      break;
    case (type instanceof ClassObject):
      if (!type.isInstanceOfThis(val)) {
        throw new ArgTypeError(
          `Value is not an instance of the ${type.className} class`,
          node, env
        );
      }
      break;
    default:
      if (typeof type === "symbol") {
        if (!(val instanceof ObjectObject) || val.className !== type) {
          throw new ArgTypeError(
            `Value is not an instance of the ${type.valueOf()} class`,
            node, env
          );
        }
      }
      else if (typeof type === "string" && type[0] === type[0].toUpperCase()) {
        if (!(val instanceof ObjectObject) || val.className !== type) {
          throw new ArgTypeError(
            `Value is not an instance of the ${type} class`,
            node, env
          );
        }
      }
      else throw new RuntimeError(
        "Unrecognized type", node, env
      );
  }
}


const TYPE_AND_QM_REGEX = /([^?]*)(\??)/

export function verifyTypes(valArr, typeArr, node, env) {
  typeArr.forEach((typeStr, ind) => {
    let [ , type, isOptional] = TYPE_AND_QM_REGEX.exec(typeStr);
    verifyType(valArr[ind], type, isOptional, node, env);
  });
}








export class LiveJSModule extends ObjectObject {
  constructor(modulePath, exports, scriptVars, script = undefined) {
    super("LiveJSModule");
    this.modulePath = modulePath;
    this.script = script;
    this.interpreter = scriptVars.interpreter;
    exports.forEach(([alias, val]) => {
      // Filter out any Function instance, which might be exported from a dev
      // library, in which case it is meant only for other dev libraries.
      if (!(val instanceof Function)) {
        this.members[alias] = val;
      }
    });
  }

  toString(env, getSourceCode) {
    return getSourceCode ? (
      this.script ??
      "***Casting to the source code of a dev lib not implemented yet***"
    ) : super.toString(env);
  }
}

export class CSSModule extends ObjectObject {
  constructor(modulePath, styleSheet) {
    super("CSSModule");
    this.modulePath = modulePath;
    this.styleSheet = styleSheet;
    this.members["styleSheet"] = styleSheet;
  }

  toString(env, getSourceCode) {
    return getSourceCode ? this.styleSheet : super.toString(env);
  }
}





export class JSXElement extends ObjectObject {
  constructor(node, decEnv, interpreter) {
    super("JSXElement");
    this.node = node;
    this.decEnv = decEnv;
    let {tagName, isComponent, isFragment, propArr, children} = node;
    this.tagName = tagName;
    this.isComponent = isComponent;
    if (isComponent) this.componentModule = decEnv.get(tagName, node);
    this.isFragment = isFragment;
    this.props = {};
    if (propArr) propArr.forEach(propNode => {
      let expVal = propNode.exp ?
        interpreter.evaluateExpression(propNode.exp, decEnv) :
        true;
      if (propNode.isSpread) {
        forEachValue(expVal, propNode.exp, decEnv, (val, key) => {
          this.props[key] = val;
        });
      } else {
        this.props[propNode.ident] = expVal;
      }
    });
    if (children) {
      // Get an array of all the children. 
      let childArr = [], i = 0;
      let len = children.length;
      children.forEach((contentNode, ind) => {
        if (contentNode.type === "empty-jsx-content") {
          return;
        }
        else if (contentNode.type === "text-literal") {
          let val = contentNode.text;
          if (ind === 0) {
            val = val.trimStart();
          }
          if (ind === len - 1) {
            val = val.trimEnd();
          }
          if (val) childArr[i++] = val;
        }
        else {
          let val = interpreter.evaluateExpression(contentNode, decEnv);
          childArr[i++] = val;
        }
      });

      // If there is only one child, set the children prop to that, and else
      // set it to the childArr array.
      if (childArr.length === 1) {
        this.props["children"] = childArr[0];
      }
      else {
        this.props["children"] = childArr;
      }
    }
    if (isComponent) {
      this.key = this.props["key"];
      if (this.key === undefined) throw new RuntimeError(
        'JSX component element defined without a "key" prop',
        node, decEnv
      );
    }
  }
}





// TODO: Change the current syntactical implementation of Promise in the
// language, and instead create a Promise ClassObject and make it one of the
// few built-in global values (along with MutableObject etc. from above.)



export class PromiseObject extends ObjectObject {
  constructor(promiseOrFun, interpreter, node, env) {
    super("Promise");
    this.isCaught = false;

    // Set this.promise depending on whether promiseOrFun is a Promise or a
    // FunctionObject.
    if (promiseOrFun instanceof Promise) {
      this.promise = promiseOrFun;
    }
    else {
      let fun = promiseOrFun;
      this.promise = new Promise((resolve, reject) => {
        env.scriptVars.exitPromise.then(() => reject(
          new Exception(
            "Script exited before promise resolved",
            node, env
          )
        ));
        let userResolve = new DevFunction(
          "resolve", {}, ({}, [res]) => resolve(res)
        );
        let userReject = new DevFunction(
          "reject", {}, ({callerNode, execEnv}, [err]) => reject(
            new Exception(err, callerNode, execEnv)
          )
        );
        interpreter.executeFunction(
          fun, [userResolve, userReject], node, env
        );
      }).then(x => x, err => {
        if (err instanceof Exception) {
          return new ErrorWrapper(err)
        }
        else throw err;
      });
    }

    // Wait until after all currently executing code has finished, allowing
    // users to catch the promise on the same tick of the event loop, before
    // handling this.promise if it fails/has failed and isn't caught.
    setTimeout(
      () => {
        this.promise.then(res => {
          if (res instanceof ErrorWrapper && !this.isCaught) {
            interpreter.handleUncaughtException(res.val, env);
          }
        });
      },
      0
    );

    // Define the instance methods.
    this.members["then"] = new ThenFunction(this);
    this.members["catch"] = new DevFunction(
      "catch", {}, ({callerNode, execEnv, interpreter}, [onRejectedFun]) => {
        return interpreter.executeFunction(
          this.members["then"], [undefined, onRejectedFun], callerNode, execEnv
        );
      }
    );
    this.members["finally"] = new DevFunction(
      "finally", {}, ({callerNode, execEnv, interpreter}, [onSettledFun]) => {
        return interpreter.executeFunction(
          this.members["then"], [onSettledFun, onSettledFun], callerNode,
          execEnv
        );
      }
    );
  }
}

class ThenFunction extends DevFunction {
  constructor(thisPromObj) {
    super(
      "then", {typeArr: ["function?", "function?"]},
      ({callerNode, execEnv, interpreter}, [onFulfilledFun, onRejectedFun]) => {
        thisPromObj.isCaught = true;
        onFulfilledFun ??= new DevFunction("onFulfilled", {}, ({}, [x]) => {
          return x;
        });
        let newPromise = new Promise(resolve => {
          thisPromObj.promise.then(result => {
            let handlerFun = onFulfilledFun;
            let val = result;
            if (result instanceof ErrorWrapper) {
              if (!onRejectedFun) {
                return resolve(result);
              }
              handlerFun = onRejectedFun;
              val = result.val;
              if (val instanceof Exception) {
                val = val.val;
              }
              else throw val;
            }
            let newResult;
            try {
              newResult = interpreter.executeFunction(
                handlerFun, [val], callerNode, execEnv
              );
            }
            catch (err) {
              newResult = (result instanceof ErrorWrapper && err.val === val) ?
                result : new ErrorWrapper(err);
            }
            if (newResult instanceof PromiseObject) {
              newResult.promise.then(res => resolve(res));
            }
            else {
              resolve(newResult);
            }
          });
        });
        return new PromiseObject(newPromise, interpreter, callerNode, execEnv);
      }
    );
  }
}


export class ErrorWrapper {
  constructor(val) {
    this.val = val;
  }
};







// TODO: Consider refactoring to not use these exceptions, and do something
// else, if wanting to make it easier to use "pause on caught exceptions" for
// debugging.

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
class AwaitException {
  constructor(whenReady, node, environment) {
    this.whenReady = whenReady;
    this.node = node;
    this.environment = environment;
  }
}







export const exceptionClass = new ClassObject(
  "Exception",
  new DevFunction(
    "Exception", {}, ({thisVal}, [message]) => {
      if (thisVal instanceof ObjectObject) {
        thisVal.set("message", message);
      }
    }
  ),
  {
    toString: new DevFunction(
      "toString", {}, ({thisVal}) => {
        if (thisVal instanceof ObjectObject) {
          return thisVal.get("message");
        }
      }
    )
  }
);

export class ExceptionClassObject extends ClassObject {
  constructor(className) {
    super(className, undefined, undefined, exceptionClass);
  }

  // Alter the getNewInstance() method in order to avoid spending further
  // computation gas.
  getNewInstance([message], _callerNode, _callerEnv) {
    let members = {message: message};
    let newInst = new ObjectObject(
      this.className, this, members, this.instanceProto,
      this.instanceConstructor, this.instancesAreComparable, true,
      this.instancesAreArrays, this.instancesAreMaps,
    );
    newInst.isMutable = this.instancesAreMutable;
    return newInst;
  }
}

export const syntaxErrorClass = new ExceptionClassObject("SyntaxError");
export const runtimeErrorClass = new ExceptionClassObject("RuntimeError");
export const loadErrorClass = new ExceptionClassObject("LoadError");
export const networkErrorClass = new ExceptionClassObject("NetworkError");
export const outOfGasErrorClass = new ExceptionClassObject("OutOfGasError");
export const typeErrorClass = new ExceptionClassObject("TypeError");






export class Exception {
  constructor(val, node, environment) {
    this.val = val;
    this.node = node;
    this.environment = environment;
  }
  toString() {
    return getString(this.val, this.environment);
  }
}

export class ParserError extends Exception {
  constructor(message, node, environment) {
    super(syntaxErrorClass.getNewInstance(
      [message], node, environment), node, environment
    );
  }
}
export class RuntimeError extends Exception {
  constructor(message, node, environment) {
    super(runtimeErrorClass.getNewInstance(
      [message], node, environment), node, environment
    );
  }
}
export class LoadError extends Exception {
  constructor(message, node, environment) {
    super(loadErrorClass.getNewInstance(
      [message], node, environment), node, environment
    );
  }
}
export class NetworkError extends Exception {
  constructor(message, node, environment) {
    super(networkErrorClass.getNewInstance(
      [message], node, environment), node, environment
    );
  }
}
export class OutOfGasError extends Exception {
  constructor(message, node, environment) {
    super(outOfGasErrorClass.getNewInstance(
      [message], node, environment), node, environment
    );
  }
}
export class ArgTypeError extends Exception {
  constructor(message, node, environment) {
    super(typeErrorClass.getNewInstance(
      [message], node, environment), node, environment
    );
  }
}






const SNIPPET_BEFORE_MAX_LEN = 600;
const SNIPPET_AFTER_MAX_LEN = 100;

export function getExtendedErrorMsg(err) {
  // If the error is internal, return it as a string (using its toString()
  // method if it has one).
  if (!(err instanceof Exception)) {
    return (err ?? "undefined").toString();
  }

  // Get the error message.
  let env = err.environment;
  let msg = getString(err.val, env);

  // If error is thrown from the global environment, also return the
  // toString()'ed error as is.
  let {
    modulePath, lexArr, strPosArr, script
  } = env.getModuleEnv() ?? {};
  if (!lexArr) {
    return msg;
  }

  // Else construct an error message containing the line and column number, as
  // well as a code snippet around where the error occurred.
  let {pos, nextPos} = err.node;
  let strPos = strPosArr[pos];
  let finStrPos = strPosArr[nextPos - 1] + lexArr[nextPos - 1].length;
  let [ln, col] = getLnAndCol(script.substring(0, strPos));
  let codeSnippet =
    script.substring(strPos - SNIPPET_BEFORE_MAX_LEN, strPos) +
    " ▶▶▶" + script.substring(strPos, finStrPos) + "◀◀◀ " +
    script.substring(finStrPos, finStrPos + SNIPPET_AFTER_MAX_LEN);
    let {interpreter, log} = env.scriptVars;
  let traceAndLogAppendix = "";
  if (interpreter.isServerSide) {
    let trace = env.getFlag(NO_TRACE_FLAG) ? [] : env.getCallTrace();
    let varReadout = env.getVariableReadout();
    traceAndLogAppendix = "\n\nTrace when error occurred:\n" +
      trace.join(",\n\n") + "\n\nAnd Declared variables:\n" + varReadout +
      "\n\nAnd log:\n" +
      log.entries.map(entry => entry.join(", ")).join(";\n") + ";\n"
  }
  return (
    msg + ` \nError occurred in ${modulePath ?? "root script"} at ` +
    `Ln ${ln}, Col ${col}: \`\n${codeSnippet}\n\`` +
    traceAndLogAppendix
  );
}



export function getNodeString(node, env, appendModuleLocation = false) {
  let {modulePath, lexArr, strPosArr, script} = env.getModuleEnv();
  let {pos, nextPos} = node;
  let strPos = strPosArr[pos];
  let finStrPos = strPosArr[nextPos - 1] + lexArr[nextPos - 1].length;
  let ret = script.substring(strPos, finStrPos);
  if (appendModuleLocation) {
    let [ln, col] = getLnAndCol(script.substring(0, strPos));
    ret = ret + ` \nin ${modulePath ?? "root script"}, Ln ${ln}, Col ${col}`
  }
  return ret;
}


export function logExtendedErrorAndTrace(err) {
  let msg = getExtendedErrorMsg(err);
  let trace = err.environment.getCallTrace();
  let varReadout = err.environment.getVariableReadout();
  console.error(msg);
  console.error(
    "Trace when the previous error occurred:\n" + trace.join(",\n\n")
  );
  console.error(
    "Declared variables where the previous error occurred:\n" + varReadout
  );
}







const FILENAME_REGEX = /\/[^./]+(?<=[~a-zA-Z0-9_\-])\.[^/]+$/;
const SEGMENT_TO_REPLACE_REGEX = /(\/\.\/|\/[^/]+\/\.\.\/|\/?\+)/g;
const RELATIVE_PATH_START_REGEX = /^(\.\.?\/|~\/|\+)/;
const HOME_PATH_REGEX = /^\/[0-9a-f]+\/[0-9a-f]+(?=(\/|$))/g;
const SLASH_END_REGEX = /\/$/;


export function getAbsolutePath(curPath, path, callerNode, callerEnv) {
  if (!curPath) curPath = "/";

  if (!path) throw new LoadError(
    `Ill-formed path: "${path}"`, callerNode, callerEnv
  );

  // If path is either an absolute path or a a bare one, return that, also
  // removing any trailing slash, unless the slash is the full path.
  let fullPath;
  if (path[0] === "/" || !RELATIVE_PATH_START_REGEX.test(path)) {
    fullPath = (path === "/") ? path : path.replace(SLASH_END_REGEX, "");
  }

  // Else if the path begins with "./" or "../", remove the file name part of
  // curPath (recognized by a dot in the middle), if any, and append path to
  // curPath.
  else if (path[0] === ".") {
    // Remove the last file name from the current path, if any.
    let moddedCurPath = curPath;
    let [filenamePart] = curPath.match(FILENAME_REGEX) ?? [""];
    if (filenamePart) {
      moddedCurPath = curPath.slice(0, -filenamePart.length);
    }
    fullPath = (curPath.at(-1) === "/") ?
      moddedCurPath + path :
      moddedCurPath + "/" + path;
  }


  // Else if path start with "~/", remove anything except the "home path" from
  // curPath and change the start of path to "./", before concatenating the two.
  else if (path[0] === "~") {
    let [homePath] = curPath.match(HOME_PATH_REGEX) ?? [];
    if (!homePath) throw new LoadError(
      `Invalid path in this context: "${path}"`, callerNode, callerEnv
    );
    fullPath = homePath + path.substring(1); 
  }

  // Else if path starts with "+". simply append the rest of it to curPath.
  // Since we remove all occurrences of "/+" and "+" in the next step, this
  // "+", as well as any "/" before it, will also be removed (even wen curPath
  // is just "/").
  // (TODO: Explain this extension of the usual kinds of relative paths in a
  // tutorial.)
  else if (path[0] === "+") {
    fullPath = curPath + path;
  }

  // Then replace any occurrences of "/./", and "<dirName>/../" with "/".
  let prevFullPath;
  do {
    prevFullPath = fullPath
    fullPath = fullPath.replaceAll(SEGMENT_TO_REPLACE_REGEX, "/");
  }
  while (fullPath !== prevFullPath);

  if (fullPath.includes("/../")) throw new LoadError(
    `Ill-formed path: "${path}"`, callerNode, callerEnv
  );

  // Then remove any trailing "/" from fullPath, unless that is the whole path,
  // and return it. 
  if (fullPath !== "/") {
    fullPath = fullPath.replace(SLASH_END_REGEX, "");
  }
  return fullPath;
}





export function payGas(node, environment, gasCost) {
  let {gas} = environment.scriptVars;
  Object.keys(gasCost).forEach(key => {
    if (gas[key] ??= 0) {
      gas[key] -= gasCost[key];
    }
    if (gas[key] < 0) {
      gas[key] += gasCost[key];
      throw new OutOfGasError(
        "Ran out of " + GAS_NAMES[key] + " gas",
        node, environment,
      );
    }
  });
}

export function decrCompGas(node, environment, amount = 1) {
  let {gas} = environment.scriptVars;
  gas.comp = gas.comp - amount;
  if (0 > --gas.comp) {
    gas.comp = gas.comp + amount;
    throw new OutOfGasError(
      "Ran out of " + GAS_NAMES.comp + " gas",
      node, environment,
    );
  }
}

export function decrGas(node, environment, gasName) {
  let {gas} = environment.scriptVars;
  if (0 > --gas[gasName]) {
    gas[gasName]++;
    throw new OutOfGasError(
      "Ran out of " + GAS_NAMES[gasName] + " gas",
      node, environment,
    );
  }
}






export {ScriptInterpreter as default};
