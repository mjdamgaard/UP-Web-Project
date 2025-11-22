
import {scriptParser} from "./parsing/ScriptParser.js";
import {
  getExtendedErrorMsg as getExtendedSyntaxErrorMsg, getLnAndCol,
} from "./parsing/Parser.js";
import {REQUESTING_SMF_ROUTE_FLAG} from "../dev_lib/query/src/flags.js";




export const OBJECT_PROTOTYPE = Object.getPrototypeOf({});
export const ARRAY_PROTOTYPE = Object.getPrototypeOf([]);
export const MAP_PROTOTYPE = Object.getPrototypeOf(new Map());

const MAX_ARRAY_INDEX = Number.MAX_SAFE_INTEGER;
const MINIMAL_TIME_GAS = 10;

export const TEXT_FILE_ROUTE_REGEX =
  /.+\.(jsx?|txt|json|html|xml|svg|md|css)$/;
export const SCRIPT_ROUTE_REGEX = /.+\.jsx?$/;

export const GAS_NAMES = {
  comp: "computation",
  import: "import",
  fetch: "fetching",
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


  async fetch(route, callerNode, callerEnv) {
    let fetchFun = callerEnv.scriptVars.liveModules.get("query").get("fetch");
    return await this.executeFunction(
      fetchFun, [route], callerNode, callerEnv
    ).promise;
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
    return [moduleEnv.getLiveJSModule(), moduleEnv];
  }





  async executeSubmoduleOfImportStatement(
    impStmt, curModulePath, callerModuleEnv
  ) {
    let submodulePath = getAbsolutePath(curModulePath, impStmt.str);
    return await this.import(
      submodulePath, impStmt, callerModuleEnv, false, true
    );
  }


  async import(
    route, callerNode, callerEnv, assertJSModule = false, assertModule = false
  ) {
    decrCompGas(callerNode, callerEnv);
    decrGas(callerNode, callerEnv, "import");

    // If modulePath is a relative path, get the current modulePath and
    // compute the full path.
    if (/^\.\.?\//.test(route)) {
      let curPath = callerNode.getModuleEnv().modulePath;
      route = getAbsolutePath(curPath, route, callerNode, callerEnv);
    }

    // Then simple redirect to this.fetch(), and if assertJSModule is true,
    // assert that the returned value is a LiveJSModule instance.
    let ret = await this.fetch(route, callerNode, callerEnv);
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
      appSettings && ret instanceof LiveJSModule && route.slice(-4) === ".jsx"
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
      let promise = devFun.fun(execVars, inputArr).catch(err => {
        if (!ret.hasCatch) {
          this.handleUncaughtException(err, execEnv);
        }
      });
      ret = new PromiseObject(promise, this, callerNode, execEnv);
      return ret;
    }

    // Else call the dev function synchronously and return what it returns.
    else {
      return devFun.fun(execVars, inputArr);
    }
  }



  thenPromise(promise, callbackFun, node, env) {
    promise.then(res => {
      this.executeFunctionOffSync(callbackFun, [res], node, env);
    });
  }

  catchPromise(promise, callbackFun, node, env) {
    promise.catch(err => {
      if (err instanceof Exception) {
        this.executeFunctionOffSync(callbackFun, [err.val], node, env);
      } else {
        this.handleUncaughtException(err, env);
      }
    });
  }


  executeFunctionOffSync(fun, inputArr, callerNode, execEnv, thisVal, flags) {
    if (execEnv.scriptVars.isExiting) {
      return;
    }
    try {
      this.executeFunction(fun, inputArr, callerNode, execEnv, thisVal, flags);
    } catch (err) {
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
          }
          catch (err) {
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
      case "switch-statement": {
        let switchExpVal = this.evaluateExpression(stmtNode.exp, environment);
        let startInd = stmtNode.defaultCase;
        stmtNode.caseArr.some(([caseExp, ind]) => {
          if (switchExpVal === this.evaluateExpression(caseExp, environment)) {
            startInd = ind;
            return true; // breaks the some() iteration.
          }
        });
        if (startInd !== undefined) {
          let newEnv = new Environment(environment);
          let stmtArr = stmtNode.stmtArr;
          let len = stmtArr.length;
          try {
            for (let i = startInd; i < len; i++) {
              this.executeStatement(stmtArr[i], newEnv);
            }
          }
          catch (err) {
            if (err instanceof BreakException) {
              return;
            } else {
              throw err;
            }
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
        throw new Exception(expVal, stmtNode, environment);
      }
      case "try-catch-statement": {
        try {
          let newEnv = new Environment(environment);
          stmtNode.tryStmtArr.forEach(stmt => {
            this.executeStatement(stmt, newEnv);
          });
        } catch (err) {
          if (err instanceof Exception) {
            let catchEnv = new Environment(environment);
            catchEnv.declare(stmtNode.ident, err.val, false, stmtNode);
            try {
              stmtNode.catchStmtArr.forEach(stmt => {
                this.executeStatement(stmt, catchEnv);
              });
            } catch (err2) {
              if (err2 instanceof Exception && err2.val === err.val) {
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
        break;
      }
      case "variable-declaration": {
        let isConst = stmtNode.isConst;
        stmtNode.children.forEach(paramExp => {
          this.assignToParameter(
            paramExp, undefined, environment, true, isConst
          );
        });
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
          prototype[key] = this.evaluateExpression(member.valExp, environment);
        });

        let classObj = new ClassObject(
          stmtNode.name, prototype.constructor, prototype, superclass
        );
        environment.declare(stmtNode.name, classObj, false, stmtNode);
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
      case "array-destructuring-assignment" :
      case "object-destructuring-assignment" : {
        let val = this.evaluateExpression(expNode.valExp, environment);
        return this.executeDestructuring(expNode.destExp, val, environment);
      }
      case "assignment": {
        let op = expNode.op;
        switch (op) {
          case "=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, () => {
                let newVal =
                  this.evaluateExpression(expNode.exp2, environment);
                return [newVal, newVal];
              }
            );
          case "+=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let val = this.evaluateExpression(expNode.exp2, environment);
                let newVal;
                if (typeof prevVal === "string" || typeof val === "string") {
                  newVal = getString(prevVal, environment) +
                    getString(val, environment);
                }
                else if (
                  typeof prevVal !== "number" || typeof val !== "number"
                ) throw new ArgTypeError(
                  "Addition of two non-string, non-numerical values",
                  expNode, environment
                );
                return [newVal, newVal];
              }
            );
          case "-=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) - parseFloat(
                  this.evaluateExpression(expNode.exp2, environment)
                );
                return [newVal, newVal];
              }
            );
          case "*=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) * parseFloat(
                  this.evaluateExpression(expNode.exp2, environment)
                );
                return [newVal, newVal];
              }
            );
          case "/=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) / parseFloat(
                  this.evaluateExpression(expNode.exp2, environment)
                );
                return [newVal, newVal];
              }
            );
          case "&&=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = prevVal &&
                  this.evaluateExpression(expNode.exp2, environment);
                return [newVal, newVal];
              }
            );
          case "||=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = prevVal ||
                  this.evaluateExpression(expNode.exp2, environment);
                return [newVal, newVal];
              }
            );
          case "??=":
            return this.assignToVariableOrMember(
              expNode.exp1, environment, prevVal => {
                let newVal = prevVal ??
                  this.evaluateExpression(expNode.exp2, environment);
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
          [val] = this.evaluateChainedExpression(expNode, environment);
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
        let ret = [];
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
        return ret;
      }
      case "object": {
        let ret = {};
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
      case "promise-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        return new PromiseObject(expVal, this, expNode.exp, environment);
      }
      case "promise-all-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        if (!(expVal instanceof Array)) throw new RuntimeError(
          "Expression is not iterable",
          expNode.exp, environment
        );
        let ret;
        ret = new PromiseObject(
          Promise.all(
            expVal.map((promiseObject, key) => {
              if (promiseObject instanceof PromiseObject) {
                return promiseObject.promise;
              }
              else throw new RuntimeError(
                "Promise.all() received a non-promise-valued element, at " +
                `index/key = ${key}`,
                expNode, environment
              );
            })
          ).catch(err => {
            if (!ret.hasCatch) {
              this.handleUncaughtException(err, environment);
            }
          }),
          this, expNode, environment
        );
        return ret;
      }
      case "symbol-call": {
        let expVal = (expNode.exp === undefined) ? undefined : getString(
          this.evaluateExpression(expNode.exp, environment), environment
        );
        return Symbol(expVal);
      }
      case "import-call": {
        let path = this.evaluateExpression(expNode.pathExp, environment);
        let ret;
        let liveModulePromise = this.import(
          path, expNode, environment
        ).catch(err => {
          if (!ret.hasCatch) {
            this.handleUncaughtException(err, environment);
          }
        });
        ret = new PromiseObject(
          liveModulePromise, this, expNode, environment
        );
        return ret;
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
          maxNum = Number.isNaN(maxNum) ? undefined : maxNum;
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
        return undefined;
      }
      case "super-call": {
        let superclass = environment.getSuperclass(expNode);
        let thisVal = environment.getThisVal();
        let inputArr = expNode.params.map(
          param => this.evaluateExpression(param, environment)
        );
        this.executeFunction(
          superclass.instanceConstructor, inputArr, expNode, environment,
          thisVal, [SUPERCLASS_FLAG, superclass.superclass]
        );
        return undefined;
      }
      case "super-access": {
        let superclass = environment.getSuperclass(expNode);
        let superPropVal = this.getProperty(
          superclass.instanceProto, expNode.accessor, environment
        );
        if (superPropVal instanceof FunctionObject) {
          superPropVal = Object.create(superPropVal);
          superPropVal.thisVal = environment.getThisVal();
        }
        return superPropVal;
      }
      case "abs-call": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        let expType = typeof expVal;
        if (expType === "string") {
          let curPath = environment.getModuleEnv().modulePath;
          return getAbsolutePath(curPath, expVal, expNode.exp, environment);
        }
        else if (expType === "number") {
          return Math.abs(expVal);
        }
        else {
          return NaN
        };
      }
      default: throw (
        "ScriptInterpreter.evaluateExpression(): Unrecognized type: " +
        `"${type}"`
      );
    }
  }


  executeDestructuring(expNode, val, environment, isDeclaration, isConst) {
    let type = expNode.type;
    let valProto = getPrototypeOf(val);
    if (type === "array-destructuring") {
      if (valProto !== ARRAY_PROTOTYPE) throw new RuntimeError(
        "Destructuring an array with a non-array value",
        expNode, environment
      );
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


  assignToParameter(paramExp, val, environment, isDeclaration, isConst) {
    let targetExp = paramExp.targetExp;
    if (val === undefined && paramExp.defaultExp) {
      val = this.evaluateExpression(paramExp.defaultExp, environment);
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
        "Trying to access a member of a non-object",
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
        isArrowFun, isDevFun, flags: funFlags, thisVal: boundThisVal, name,
      } = fun;
      thisVal = boundThisVal ?? thisVal;
      this.inputArr = inputArr;
      this.callerNode = callerNode;
      this.callerEnv = callerEnv;
      if (!isArrowFun && thisVal) this.thisVal = thisVal;
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
  }

  assignThisVal(thisVal) {
    if (this.isNonArrowFunction) {
      this.thisVal = thisVal;
    }
    else if (this.parent) {
      this.parent.assignThisVal(thisVal);
    }
  }

  getSuperclass(node, nodeEnvironment = this) {
    let superclass = this.getFlag(SUPERCLASS_FLAG);
    if (superclass === undefined) throw new RuntimeError(
      "'super' is not defined in this context",
      node, nodeEnvironment
    );
    return superclass;
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


  getCallTrace(maxLen = 15, stringify = false) {
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
    else if (this.flags.get(REQUESTING_SMF_ROUTE_FLAG)) {
      // If the function is an SMF called by another SMF, stop the trace before
      // it bleeds into the caller SMF (in order to prevent data leaks).
      // TODO: Test that the trace is cut off at the correct point.
      return [];
    }
    else {
      return this.parent.getCallTraceHelper(maxLen, stringify);
    }
  }

  getVariableReadout() {
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
  return nodeStr + ", arguments: (" +
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
    let toStringMethod = this.get("toString");
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
        new DevFunction(className, {}, () => {}) :
        new DevFunction(
          className, {},
          ({callerNode, execEnv, thisVal, interpreter}, inputArr) => {
            let superclass = execEnv.getSuperclass(callerNode);
            interpreter.executeFunction(
              superclass.instanceConstructor, inputArr, callerNode, execEnv,
              thisVal, [SUPERCLASS_FLAG, superclass.superclass]
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
      this.instanceConstructor, inputArr, callerNode, callerEnv, newInst,
      [[SUPERCLASS_FLAG, this.superclass]]
    );
    newInst.isMutable = this.instancesAreMutable;
    return newInst;
  }

  toString() {
    return "[object Class]";
  }
}

const SUPERCLASS_FLAG = Symbol("superclass");








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
      val.map(entry => getString(entry, env)).join(", ") +
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
    let {isAsync, typeArr, flags, thisVal} = options;
    this._name = name;
    if (isAsync) this.isAsync = isAsync;
    if (typeArr) this.typeArr = typeArr;
    if (flags) this.flags = flags;
    if (thisVal) this.thisVal = thisVal;
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
      let childrenProp = [], i = 0;
      children.forEach((contentNode) => {
        if (contentNode.type === "empty-jsx-content") return;
        let val = interpreter.evaluateExpression(contentNode, decEnv);
        childrenProp[i++] = val;
      });
      this.props["children"] = childrenProp;
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
    this.hasCatch = false;
    if (promiseOrFun instanceof Promise) {
      this.promise = promiseOrFun;
    }
    else {
      let fun = promiseOrFun;
      this.promise = new Promise((resolve, reject) => {
        env.scriptVars.exitPromise.then(() => {reject()});
        let userResolve = new DevFunction(
          "resolve", {}, ({}, [res]) => resolve(res)
        );
        let userReject = new DevFunction(
          "reject", {}, ({}, [err]) => reject(err)
        );
        interpreter.executeFunctionOffSync(
          fun, [userResolve, userReject], node, env
        );
      }).catch(err => {
        if (err instanceof Error) console.error(err);
      });
    }
// TODO: Add onRejected callback argument to then().
    this.members["then"] = new DevFunction(
      "then", {}, ({callerNode, execEnv, interpreter}, [callbackFun]) => {
        interpreter.thenPromise(
          this.promise, callbackFun, callerNode, execEnv
        );
        return this;
      }
    );
    this.members["catch"] = new DevFunction(
      "catch", {}, ({callerNode, execEnv, interpreter}, [callbackFun]) => {
        interpreter.catchPromise(
          this.promise, callbackFun, callerNode, execEnv
        );
        this.hasCatch = true;
        return this;
      }
    );
  }
}








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
  let msg = getString(err.val, err.environment);

  // If error is thrown from the global environment, also return the
  // toString()'ed error as is.
  let {
    modulePath, lexArr, strPosArr, script
  } = err.environment.getModuleEnv() ?? {};
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
  return (
    msg + ` \nError occurred in ${modulePath ?? "root script"} at ` +
    `Ln ${ln}, Col ${col}: \`\n${codeSnippet}\n\``
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
    "Trace when the previous error occurred:\n" + trace.join(",\n")
  );
  console.error(
    "Declared variables where the previous error occurred:\n" + varReadout
  );
}







const FILENAME_REGEX = /\/[^./]+\.[^/]+$/;
const SEGMENT_TO_REPLACE_REGEX = /(\/\.\/|\/[^/]+\/\.\.\/)/g;


export function getAbsolutePath(curPath, path, callerNode, callerEnv) {
  if (!curPath) curPath = "/";

  if (!path) throw new LoadError(
    `Ill-formed path: "${path}"`, callerNode, callerEnv
  );

  if (path[0] === "/" || path[0] !== ".") {
    return path.replace(/\/$/, "");
  }

  // Remove the last file name from the current path, if any.
  let moddedCurPath;
  let [filenamePart] = curPath.match(FILENAME_REGEX) ?? [""];
  if (filenamePart) {
    moddedCurPath = curPath.slice(0, -filenamePart.length);
  }

  // Then concatenate the two paths.
  let fullPath = (curPath.at(-1) === "/") ? moddedCurPath + path :
    moddedCurPath + "/" + path;

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

  return fullPath.replace(/\/$/, "");
}





export function payGas(node, environment, gasCost) {
  let {gas} = environment.scriptVars;
  Object.keys(gasCost).forEach(key => {
    if (gas[key] ??= 0) {
      gas[key] -= gasCost[key];
    }
    if (gas[key] < 0) {
      gas[key] += gasCost[key]
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
