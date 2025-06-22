
import {scriptParser} from "./parsing/ScriptParser.js";
// import {sassParser} from "./parsing/SASSParser.js";
import {
  LexError, SyntaxError, getExtendedErrorMsg as getExtendedErrorMsgHelper,
  getLnAndCol,
} from "./parsing/Parser.js";


export {LexError, SyntaxError};


export const ARRAY_PROTOTYPE = Object.getPrototypeOf([]);
export const OBJECT_PROTOTYPE = Object.getPrototypeOf({});

const MAX_ARRAY_INDEX = 4294967294;
const MINIMAL_TIME_GAS = 10;

const TEXT_FILE_ROUTE_REGEX = /[^?]+\.(jsx?|txt|json|html|xml|md|scss|)$/;
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
  let result = syntaxTree.res;
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
    }).catch(err => console.error(err));


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
      let [resultRow = []] = await this.fetch(
        scriptPath, callerNode, callerEnv
      ) ?? [];
      [script] = resultRow;
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
    let fetchFun = callerEnv.scriptVars.liveModules.get("query")
      .members["fetch"];
    let resultPromise = this.executeFunction(
      fetchFun, [route], callerNode, callerEnv
    ).promise;
    return await resultPromise;
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
    return [moduleEnv.getLiveModule(), moduleEnv];
  }





  async executeSubmoduleOfImportStatement(
    impStmt, curModulePath, callerModuleEnv
  ) {
    let submodulePath = getFullPath(curModulePath, impStmt.str);
    return await this.import(submodulePath, impStmt, callerModuleEnv);
  }


  async import(modulePath, callerNode, callerEnv) {
    decrCompGas(callerNode, callerEnv);
    decrGas(callerNode, callerEnv, "import");

    let {liveModules, parsedScripts} = callerEnv.scriptVars;
    let globalEnv = callerEnv.getGlobalEnv();

    // If the module has already been executed, we can return early.
    let liveModule = liveModules.get(modulePath);
    if (liveModule) {
      if (liveModule instanceof Promise) {
        liveModule = await liveModule;
      }
      return deepCopy(liveModule);
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
          let liveModulePromise = new Promise(async (resolve) => {
            let devMod = await import(devLibURL);
            let liveModule = new LiveModule(
              modulePath, Object.entries(devMod), globalEnv.scriptVars
            );
            resolve(liveModule);
          });
          liveModules.set(modulePath, liveModulePromise);
          liveModule = await liveModulePromise;
          liveModules.set(modulePath, liveModule);
        } catch (err) {
          throw new LoadError(
            `Developer library "${modulePath}" failed to import ` +
            `from ${devLibURL}`,
            callerNode, callerEnv
          );
        }
      }

      // If the dev library module was found, create a "liveModule" object from
      // it and return that.
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
          liveModule = await liveModule;
        }
        return deepCopy(liveModule);
      }

      // Then execute the module, inside the global environment, and return the
      // resulting liveModule, after also adding it to liveModules.
      let liveModulePromise = new Promise(async (resolve) => {
        let [liveModule] = await this.executeModule(
          submoduleNode, lexArr, strPosArr, script, modulePath, globalEnv
        );
        resolve(liveModule);
      });
      liveModules.set(modulePath, liveModulePromise);
      liveModule = await liveModulePromise;
      liveModules.set(modulePath, liveModule);
      return deepCopy(liveModule);
    }

    // Else if the module is actually a non-JS text file, fetch/get it and
    // return a string of its content instead.
    else if (TEXT_FILE_ROUTE_REGEX.test(modulePath)) {
      let [resultRow = []] = await this.fetch(
        modulePath, callerNode, callerEnv
      );
      let [text] = resultRow;
      if (modulePath.slice(-5) === ".scss") {
        return new SASSModule(modulePath, text);
      } else {
        return text;
      }
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
          let moduleNamespaceObj = liveSubmodule;
          curModuleEnv.declare(imp.ident, moduleNamespaceObj, true, imp);
        }
        else if (impType === "named-imports") {
          imp.namedImportArr.forEach(namedImp => {
            let ident = namedImp.ident ?? "default";
            let alias = namedImp.alias ?? ident;
            let val = liveSubmodule.members[ident];
            curModuleEnv.declare(alias, val, true, namedImp);
          });
        }
        else if (impType === "default-import") {
          let val = liveSubmodule.members["default"];
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
    let {flags} = scriptEnv.scriptVars;
    this.executeModuleFunction(
      liveScriptModule, "main", inputArr, resolveFun, scriptNode, scriptEnv,
      flags,
    );
  }

  executeModuleFunction(
    liveModule, funName, inputArr, resolveFun, moduleNode, moduleEnv, flags
  ) {
    let fun = liveModule.members[funName];
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
        fun: fun, callerNode: callerNode, callerEnv: callerEnv,
        thisVal: thisVal, flags: flags,
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
      let promise = devFun.fun(execVars, inputArr).catch(err => {
        this.throwAsyncException(err, callerNode, execEnv);
      });
      return new PromiseObject(promise, this, callerNode, execEnv);
    }

    // Else call the dev function synchronously and return what it returns.
    else {
      return devFun.fun(execVars, inputArr);
    }
  }



  thenPromise(promise, callbackFun, callerNode, execEnv) {
    promise.then(res => {
      this.#executeAsyncFunction(callbackFun, [res], callerNode, execEnv);
    });
  }



  #executeAsyncFunction(fun, inputArr, callerNode, execEnv, thisVal) {
    if (execEnv.scriptVars.isExiting) {
      return;
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
        console.error(err);
      }
    }
  }

  throwAsyncException(err, callerNode, execEnv) {
    let wasCaught = execEnv.runNearestCatchStmtAncestor(err, callerNode);
    if (!wasCaught) {
      execEnv.scriptVars.resolveScript(undefined, err);
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
        let {catchStmtArr, errIdent} = stmtNode;
        let tryCatchEnv = new Environment(
          environment, "try-catch", {
            catchStmtArr: catchStmtArr, errIdent: errIdent
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
      case "destructuring-assignment" : {
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
                  newVal = getString(prevVal) + getString(val);
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
                getString(acc) + getString(nextVal) :
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
      }
      case "object": {
        let obj = {};
        expNode.members.forEach(member => {
          if (member.type === "spread") {
            let spreadExpVal = this.evaluateExpression(member.exp, environment);
            forEachValue(spreadExpVal, member, environment, (val, key) => {
              obj[key] = val;
            });
          }
          else {
            let key = member.ident;
            if (key === undefined) {
              key = getString(
                this.evaluateExpression(member.keyExp, environment)
              );
            }
            if (!key) throw new RuntimeError(
              "Invalid, falsy object key",
              expNode, environment
            );
            obj[key] = this.evaluateExpression(member.valExp, environment);
          }
        });
        return obj;
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
        if (!(expVal.values instanceof Function)) throw new RuntimeError(
          "Expression is not iterable",
          expNode.exp, environment
        );
        return new PromiseObject(
          Promise.all(
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
          ).catch(err => {
            this.throwAsyncException(err, expNode, environment);
          }),
          this, expNode, environment
        );
      }
      case "import-call": {
        let path = this.evaluateExpression(expNode.pathExp, environment);
        let namespaceObjPromise = this.import(
          path, expNode, environment
        ).catch(err => {
          this.throwAsyncException(err, expNode, environment);
        });
        if (expNode.callback) {
          let callback = this.evaluateExpression(expNode.callback, environment);
          this.thenPromise(
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
        throw new RuntimeError(
          "Maps are not implemented yet",
          expNode, environment
        );
        // let expVal;
        // if (expNode.exp) {
        //   expVal = this.evaluateExpression(expNode.exp, environment);
        // }
        // let ret;
        // if (expVal === undefined) {
        //   ret = new MapWrapper();
        // }
        // else {
        //   try {
        //     ret = new MapWrapper(expVal);
        //   }
        //   catch (err) {
        //     throw new ArgTypeError(
        //       "Map expects a key-value entries array, but got: " +
        //       getVerboseString(expVal),
        //       expNode.exp, environment
        //     );
        //   }
        // }
        // return ret;
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


  executeDestructuring(expNode, val, environment, isDeclaration, isConst) {
    let type = expNode.type
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
      return val;
    }
    else if (type === "object-destructuring") {
      let members = val;
      if (val instanceof AbstractUHObject) {
        members = val.members;
      }
      else if (valProto !== OBJECT_PROTOTYPE) throw new RuntimeError(
        "Destructuring an object with a non-object value",
        expNode, environment
      );
      expNode.children.forEach(paramMemExp => {
        let ident = paramMemExp.ident;
        let propVal = (Object.hasOwn(val, ident)) ? members[ident] : undefined;
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
          expNode.rootExp, expNode.postfixArr, environment
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

      // If the object is an AbstractUHObject, instead of assigning one of the
      // object's own properties directly, assign to the objects 'members'
      // property instead. Also check against setting members of a non-object.
      let objProto = getPrototypeOf(objVal);
      if (objProto !== OBJECT_PROTOTYPE) {
        if (objProto === ARRAY_PROTOTYPE) {
          if (key !== "length"){
            key = parseInt(key);
            if (key !== NaN && 0 <= key && key < MAX_ARRAY_INDEX) {
              throw new RuntimeError(
                "Invalid key for array entry assignment",
                expNode, environment
              );
            }
          }
        }
        else throw new RuntimeError(
          "Trying to assign a member of an object whose members are constant",
          expNode, environment
        );
      }

      // Then assign newVal to the member of objVal and return ret, where
      // newVal and ret are both specified by the assignFun.
      let [newVal, ret] = assignFun(prevVal);
      if (!key) throw new RuntimeError(
        "Invalid, falsy object key",
        expNode, environment
      );
      objVal[key] = newVal;
      return ret;
    }
  }


  // evaluateChainedExpression() => [val, objVal, key], or throws
  // a BrokenOptionalChainException. Here, val is the value of the whole
  // expression, and objVal, is the value of the object before the last member
  // accessor (if the last postfix is a member accessor and not a tuple).
  evaluateChainedExpression(rootExp, postfixArr, environment) {
    let val = this.evaluateExpression(rootExp, environment);
    let len = postfixArr.length;
    if (len === 0) {
      return [val];
    }
    decrCompGas(rootExp, environment);

    // Evaluate the chained expression accumulatively, one postfix at a time. 
    let postfix, objVal, key;
    for (let i = 0; i < len; i++) {
      postfix = postfixArr[i];

      // If postfix is a member accessor, get the member value, and assign the
      // current val to objVal.
      if (postfix.type === "member-accessor") {
        objVal = val;

        // Throw a BrokenOptionalChainException if an optional chaining is
        // broken.
        if (postfix.isOpt && (objVal === undefined || objVal === null)) {
          throw new BrokenOptionalChainException();
        }

        // Else, first get the key.
        key = postfix.ident;
        if (key === undefined) {
          key = getString(this.evaluateExpression(postfix.exp, environment));
        }

        // If the object is an AbstractUHObject, instead of getting from the
        // object's properties directly, get from the objects 'members'
        // property. Also check against accessing members of a non-object.
        let objProto = getPrototypeOf(objVal);
        if (objProto !== OBJECT_PROTOTYPE) {
          if (objProto === ARRAY_PROTOTYPE) {
            if (key === "length"){
              val = objVal.length;
            } else {
              val = Object.hasOwn(objVal, key) ? objVal[key] : undefined;
            }
          }
          else if (objVal instanceof AbstractUHObject) {
            let members = objVal.members;
            val = Object.hasOwn(members, key) ? members[key] : undefined;
          }
          else if (typeof objVal === "string" && key === "length") {
            val = objVal.length;
          }
          else throw new RuntimeError(
            "Trying to access a member of a non-object",
            postfix, environment
          );
        }
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
          val, inputValArr, postfix, environment, objVal
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

}









export class Environment {
  constructor(
    parent, scopeType = "block", {
      fun, callerNode, callerEnv, thisVal, flags: addedFlags,
      modulePath, lexArr, strPosArr, script,
      scriptVars,
      catchStmtArr, errIdent,
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
      let {isArrowFun, isDevFun, flags: funFlags} = fun;
      this.callerNode = callerNode;
      this.callerEnv = callerEnv;
      if (thisVal && !isArrowFun) this.thisVal = thisVal;
      if (isArrowFun) this.isArrowFun = isArrowFun;
      if (isDevFun) this.isDevFun = isDevFun;
      if (funFlags || addedFlags) {
        this.setFlags(funFlags ?? []);
        this.setFlags(addedFlags ?? []);
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
      return this.parent.get(ident, node, nodeEnvironment);
      // let val = this.parent.get(ident, node, nodeEnvironment);
      // if (this.isNonArrowFunction) {
      //   return turnImmutable(val);
      // } else {
      //   return val;
      // }
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
    else {
      return undefined;
    }
  }

  getFlag(flag, stopAtClear = true) {
    let flagParams = this.flags.get(flag);
    if (flagParams !== undefined) {
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
    else {
      return undefined;
    }
  }

  setFlag(flag, flagParams = null) {
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

export const CLEAR_FLAG = Symbol("clear"); 












export class AbstractUHObject {
  constructor(className, members = {}) {
    this.className = className;
    this.members = members;
  }

 stringify() {
    return  `"${this.className}()"`;
  }
 toString() {
    return  `[object ${this.className}()]`;
  }
}




export function getString(val) {
  if (val === undefined) {
    return "undefined";
  }
  else if (val === null) {
    return "null";
  }
  else if (val.toString instanceof Function) {
    return val.toString();
  }
  else throw (
    "toString(): Invalid argument"
  );
}


export function jsonStringify(val) {
  if (val instanceof AbstractUHObject) {
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
    let ret = "{";
    Object.entries(val).map(([key, val]) => (
      `${JSON.stringify(key.toString())}:${jsonStringify(val)}`
    )).join(",");
    return ret + "}";
  }
  else if (val instanceof Object) {
    throw "User has access to an object that they shouldn't have";
  }
  else {
    return JSON.stringify(val);
  }
}




export function forEachValue(value, node, env, callback) {
  if (value instanceof AbstractUHObject) {
    value = value.members;
  }
  let valProto = getPrototypeOf(value);
  if (valProto === ARRAY_PROTOTYPE) {
    value.forEach(callback);
  }
  else if (valProto === OBJECT_PROTOTYPE) {
    Object.entries(value).forEach(([key, val]) => callback(val, key));
  }
  else throw new RuntimeError(
    "Iterating over a non-iterable value",
    node, env
  );
}


export function getPrototypeOf(value) {
  if (value && value instanceof Object) {
    return Object.getPrototypeOf(value);
  }
  else {
    return undefined;
  }
}


export function deepCopy(value) {
    if (value instanceof AbstractUHObject) {
      let ret = Object.create(value);
      ret.members = deepCopy(ret.members);
      return ret;
    }
    let valProto = getPrototypeOf(value);
    if (valProto === ARRAY_PROTOTYPE) {
      return value.map(val => deepCopy(val));
    }
    else if (valProto === OBJECT_PROTOTYPE) {
      let ret = {};
      Object.entries(value).forEach(([key, val]) => {
        ret[key] = deepCopy(val);
      });
      return ret;
    }
    else {
      return value;
    }
}







export class FunctionObject extends AbstractUHObject {
  constructor() {
    super("Function");
  }
};

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
    // TODO: Implement capturing function names for the sake of e.g. console.
    // trace() once implemented, and debugging in general. 
    return this.node.name ?? "<anonymous function>";
  }
}

export class DevFunction extends FunctionObject {
  constructor(options, fun) {
    if (!fun) {
      fun = options;
      options = {};
    }
    let {isAsync, typeArr, flags} = options;
    super();
    if (isAsync) this.isAsync = isAsync;
    if (typeArr) this.typeArr = typeArr;
    if (flags) this.flags = flags;
    this.fun = fun;
  }
  get isArrowFun() {
    return false;
  }
  get isDevFun() {
    return true;
  }
  get name() {
    return "<anonymous dev function>";
  }
}






export function verifyType(val, type, isOptional, node, env) {
  if (val === undefined) {
    if (isOptional) {
      return;
    }
    else throw new ArgTypeError(
      "Value is undefined", node, env
    );
  }
  let typeOfVal = typeof val;
  switch (type) {
    case "string":
      if (typeOfVal !== "string") throw new ArgTypeError(
        `Value is not a string: ${getString(val)}`,
        node, env
      );
      break;
    case "number":
      if (typeOfVal !== "number") throw new ArgTypeError(
        `Value is not a number: ${getString(val)}`,
        node, env
      );
      break;
    case "integer":
      if (typeOfVal !== "number" || parseInt(val) !== val) {
        throw new ArgTypeError(
          `Value is not an integer: ${getString(val)}`,
          node, env
        );
      }
      break;
    case "integer unsigned":
      if (typeOfVal !== "number" || parseInt(val) !== val || val < 0) {
        throw new ArgTypeError(
          `Value is not a positive integer: ${getString(val)}`,
          node, env
        );
      }
      break;
    case "boolean":
      if (typeOfVal !== "boolean") throw new ArgTypeError(
        `Value is not a boolean: ${getString(val)}`,
        node, env
      );
      break;
    case "object":
      if (getPrototypeOf(val) !== OBJECT_PROTOTYPE) {
        throw new ArgTypeError(
          `Value is not a plain object: ${getString(val)}`,
          node, env
        );
      }
      break;
    case "object":
      if (getPrototypeOf(val) !== ARRAY_PROTOTYPE) {
        throw new ArgTypeError(
          `Value is not an array: ${getString(val)}`,
          node, env
        );
      }
      break;
    case "function":
      if (!(val instanceof FunctionObject)) {
        throw new ArgTypeError(
          `Value is not a function: ${getString(val)}`,
          node, env
        );
      }
      break;
    case "module":
      if (!(val instanceof LiveModule)) {
        throw new ArgTypeError(
          `Value is not a live module object: ${getString(val)}`,
          node, env
        );
      }
      break;
    case "any":
      return;
    default:
      throw new RuntimeError(
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






export class LiveModule extends AbstractUHObject {
  constructor(modulePath, exports, scriptVars) {
    super("LiveModule");
    this.modulePath = modulePath;
    this.interpreter = scriptVars.interpreter;
    exports.forEach(([alias, val]) => {
      // Filter out any Function instance, which might be exported from a dev
      // library, in which case it is meant only for other dev libraries.
      if (!(val instanceof Function)) {
        this.members[alias] = val;
      }
    });
  }
}

export class SASSModule extends AbstractUHObject {
  constructor(modulePath, styleSheet) {
    super("SASSModule");
    this.modulePath = modulePath;
    this.styleSheet = styleSheet;
    this.members["styleSheet"] = styleSheet;
  }
}





export class JSXElement extends AbstractUHObject {
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
      let childrenProp = [];
      children.forEach((contentNode, ind) => {
        let val = interpreter.evaluateExpression(contentNode, decEnv);
        childrenProp[ind] = val;
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



export class PromiseObject extends AbstractUHObject {
  constructor(promiseOrFun, interpreter, node, env) {
    super("Promise");
    if (promiseOrFun instanceof Promise) {
      this.promise = promiseOrFun;
    }
    else {
      let fun = promiseOrFun;
      this.promise = new Promise((resolve) => {
        let userResolve = new DevFunction({}, ({}, [res]) => {
          resolve(res);
        });
        interpreter.executeFunction(fun, [userResolve], node, env);
      }).catch(err => {
        interpreter.throwAsyncException(err, node, env);
      });
    }

    this.members["then"] = new DevFunction(
      {}, ({callerNode, execEnv, interpreter}, [callbackFun]) => {
        interpreter.thenPromise(
          this.promise, callbackFun, callerNode, execEnv
        );
      }
    );
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
export class NetworkError extends RuntimeError {
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
export class ArgTypeError extends RuntimeError {
  constructor(val, node, environment) {
    super(val, node, environment);
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
  if (err instanceof ArgTypeError) {
    type = "TypeError";
  }
  else if (err instanceof LoadError) {
    type = "LoadError";
  }
  else if (err instanceof NetworkError) {
    type = "NetworkError";
  }
  else if (err instanceof OutOfGasError) {
    type = "OutOfGasError";
  }
  else if (err instanceof CustomException) {
    type = "Uncaught or re-thrown custom exception";
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
      " ▶▶▶" + script.substring(strPos, finStrPos) + "◀◀◀ " +
      script.substring(finStrPos, SNIPPET_AFTER_MAX_LEN);
    return (
      type + ` in ${modulePath ?? "root script"} at Ln ${ln}, Col ${col}: ` +
      `${msg}. Error occurred at \`\n${codeSnippet}\n\`.`
    );
  }
}



export {ScriptInterpreter as default};
