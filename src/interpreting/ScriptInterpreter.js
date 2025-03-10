
import {scriptParser} from "../parsing/ScriptParser.js";
// import {EntityReference, EntityPlaceholder} from "../parsing/RegEntParser.js";
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

async function fetchEntity(libraryPaths, funMetadata, entID, entType) {
  let io = await import(libraryPaths.get("io"));
  return await io.selectEntity(funMetadata, entID, entType);
}



export class ScriptInterpreter {

  constructor(libraryPaths) {
    this.libraryPaths = libraryPaths;
  }


  async interpretScript(
    gas, script = "", scriptID = "1", mainInputs = [], reqUserID = undefined,
    protectScriptID, permissions = {}, settings = {},
    parsedEntities = new Map(),
  ) {
    let scriptGlobals = {
      gas: gas, log: {}, output: undefined, scriptID: scriptID,
      reqUserID: reqUserID, protectScriptID: protectScriptID,
      permissions: permissions, setting: settings,
      shouldExit: false, resolveScript: undefined, scriptInterpreter: this,
      parsedEntities: parsedEntities, liveModules: {},
    };

    // First create global environment if not yet done, and then create an
    // initial global environment, used as a parent environment for all
    // scripts/modules.
    let globalEnv = this.createGlobalEnvironment(scriptGlobals);

    // If script is provided, rather than the scriptID, first parse it.
    let parsedScript;
    if (scriptID === "1") {
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
        let {parsedEnt} = await fetchEntity(
          this.libraryPaths, {callerEnv: globalEnv}, scriptID, "s",
        );
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
              "Ran out of " + GAS_NAMES.time + " gas",
              parsedScript, globalEnv,
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
          "Ran out of " + GAS_NAMES.time + " gas (no exit statement reached)",
          parsedScript, globalEnv,
        );
        return [undefined, scriptGlobals.log];
      }
    }
  }




  createGlobalEnvironment(scriptGlobals) {
    let globalEnv = new Environment(
      undefined, "global", undefined, undefined, undefined, undefined,
      scriptGlobals
    );
    return globalEnv;
  }



  handleException(err, environment) {
    let scriptGlobals = environment.scriptGlobals, {log} = scriptGlobals;
    if (
      err instanceof LexError || err instanceof SyntaxError ||
      err instanceof LoadError || err instanceof RuntimeError ||
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
      globalEnv, "module", undefined, undefined, undefined, moduleID
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
    let {liveModules, parsedEntities} = globalEnv.scriptGlobals;

    // Evaluate the submodule entity reference expression (right after 'from').
    let submoduleRef = impStmt.moduleRef;
    if (!submoduleRef.id) throw new LoadError(
      `Importing from a TBD module`,
      impStmt.moduleExp, callerModuleEnv
    );
    let submoduleID = submoduleRef.id;

    // If the module has already been executed, we can return early.
    let liveModule = liveModules["&" + submoduleID];
    if (liveModule) {
      return liveModule;
    }

    // Then fetch and parse the module. First, try to get it from the
    // parsedEntities buffer.
    let submoduleNode = parsedEntities.get(submoduleID);

    // Else check if submoduleID refers to a developer library, and import it
    // in a special way if so.
    if (!submoduleNode) {
      liveModule = await this.getDeveloperLibrary(submoduleID);
      if (liveModule) {
        liveModules["&" + submoduleID] = liveModule;
        return liveModule;
      }

      // And if it is not a developer module, then fetch and parse the user
      // module.
      let {parsedEnt} = await fetchEntity(
        this.libraryPaths, {callerNode: impStmt, callerEnv: callerModuleEnv},
        submoduleID, "s",
      );
      submoduleNode = parsedEnt;
      parsedEntities.set(submoduleID, submoduleNode);
    }

    // Then execute the module, inside the global environment, and return the
    // resulting liveModule, after also adding it to liveModules.
    liveModule = await this.executeModule(
      submoduleNode, submoduleID, globalEnv
    );
    liveModules["&" + submoduleID] = liveModule;
    return liveModule;
  }




  finalizeImportStatement(impStmt, liveSubmodule, moduleEnv) {
    decrCompGas(moduleEnv);

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
        let moduleID = moduleEnv.moduleID;
        let submoduleID = impStmt.moduleRef.id;
        let protObj = new ProtectedObject(
          submoduleID, moduleID, liveSubmodule
        );
        moduleEnv.declare(imp.ident, protObj, true, imp);
      }
      else if (impType === "named-imports") {
        imp.namedImportArr.forEach(namedImp => {
          let ident = namedImp.ident ?? "default";
          let alias = namedImp.alias ?? ident;
          moduleEnv.declare(alias, liveSubmodule["&" + ident], true, namedImp);
        });
      }
      else {
        moduleEnv.declare(imp.ident, liveSubmodule["&default"], true, imp);
      }
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
    decrCompGas(environment);

    if (stmtNode.subtype === "named-exports") {
      stmtNode.namedExportArr.forEach(({ident, alias}) => {
        environment.export(ident, alias, undefined, stmtNode);
      });
    }
    else if (stmtNode.exp) {
      let val = this.evaluateExpression(stmtNode.exp, environment);
      environment.declare("default", val, true, stmtNode);
      environment.export("default", undefined, stmtNode.isProtected, stmtNode);
    }
    else {
      this.executeStatement(stmtNode.stmt, environment);
      environment.export(
        stmtNode.ident, undefined, stmtNode.isProtected, stmtNode
      );
      if (stmtNode.isDefault) {
        environment.export(
          stmtNode.ident, "default", stmtNode.isProtected, stmtNode
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
    else if (fun instanceof DeveloperFunction) {
      ret = this.executeDeveloperFunction(
        fun, inputArr, callerNode, callerEnv, thisVal, thisFlags
      );
    }
    else throw new RuntimeError(
      "Function call with a non-function-valued expression",
      callerNode, callerEnv
    );

    // If the function reached an exit statement, throw an exit exception.
    if (callerEnv.scriptGlobals.shouldExit) {
      throw new ExitException();
    }
    return ret;
  }




  executeDeveloperFunction(fun, inputArr, callerNode, callerEnv, thisVal) {
    return fun.fun(
      {callerNode: callerNode, callerEnv: callerEnv, thisVal: thisVal},
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
    let newEnv = new Environment(
      funDecEnv, "function", callerNode, callerEnv, thisVal
    );

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
      default: throw (
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
              acc = acc | nextVal;
              break;
            case "^":
              acc = acc ^ nextVal;
              break;
            case "&":
              acc = acc & nextVal;
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
              acc = acc > nextVal;
              break;
            case "<":
              acc = acc < nextVal;
              break;
            case "<=":
              acc = acc <= nextVal;
              break;
            case ">=":
              acc = acc >= nextVal;
              break;
            case "<<":
              acc = acc << nextVal;
              break;
            case ">>":
              acc = acc >> nextVal;
              break;
            case ">>>":
              acc = acc >>> nextVal;
              break;
            case "+":
              acc = acc + nextVal;
              break;
            case "-":
              acc = acc - nextVal;
              break;
            case "*":
              acc = acc * nextVal;
              break;
            case "/":
              acc = acc / nextVal;
              break;
            case "%":
              acc = acc % nextVal;
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
          default: throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
      }
      case "chained-expression": {
        let expVal = this.evaluateExpression(expNode.exp, environment);
        let len = expNode.memAccArr.length;
        let member
        for (let i = 0; i < len - 1; i++) {
          let index = memAccArr[i];
          let safeIndex = (parseInt(index) == index) ? index : "&" + index;
        }
        for (let i = 0; i < len - 1; i++) {
          
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
        if (
          ret instanceof DefinedFunction || ret instanceof DeveloperFunction
        ) {
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
            "&" + (
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
        return new EntityReference(expNode.path);
      }
      case "exit-call": {
        let expVal = (!expNode.exp) ? undefined :
          this.evaluateExpression(expNode.exp, environment);
        environment.scriptGlobals.output = expVal;
        throw new ExitException();
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


  assignToVariableOrMember(chainExpNode, environment, assignFun) {
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
    // integer, and if it is an object, append "&" to the indexVal.
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
      indexVal = "&" + indexVal;
    }

    let isThisAccess = (memAccNode.exp.type === "this-keyword");
    return [expVal, indexVal, isImmutable, isProtected, isThisAccess];
  }

}









export class Environment {
  constructor(
    parent = undefined, scopeType = "block",
    callerNode = undefined, callerEnv = undefined, thisVal = undefined,
    protectPrivileges = undefined, protectData = undefined,
    moduleID = undefined, scriptGlobals = undefined
  ) {
    this.parent = parent;
    this.scopeType = scopeType;
    this.variables = {};
    if (scopeType === "function") {
      this.callerNode = callerNode;
      this.callerEnv = callerEnv;
      if (thisVal) this.thisVal = thisVal;
      if (protectPrivileges) this.protectPrivileges = protectPrivileges;
      if (protectData) this.protectData = protectData;
    }
    else if (scopeType === "module") {
      this.moduleID = moduleID;
      this.exports = [];
      this.liveModule = undefined;
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
      if (
        this.scopeType === "function" && val && typeof val === "object" &&
        !(val instanceof Immutable)
      ) {
        return new Immutable(val);
      }
      else {
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


  // TODO: Correct.
  export(ident, alias = ident, isProtected, node, nodeEnvironment = this) {
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
    this.exports.push([alias, val, isProtected]);
  }

  getLiveModule() {
    if (!this.liveModule ) {
      let liveModule = this.liveModule = {};
      this.exports.forEach(([alias, val, isProtected]) => {
        liveModule["&" + alias] = [val, isProtected];
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
      Object.entries(obj).map(([key, val]) => ["&" + key, getSafeObj(val)])
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

export function decrFetchGas(node, environment) {
  let gas = environment?.scriptGlobals.gas ?? environment;
  if (0 > --gas.fetch) throw new OutOfGasError(
    "Ran out of " + GAS_NAMES.fetch + " gas",
    node, environment,
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
  constructor(
    node, decEnv, thisVal = undefined, canAffectDecEnv = undefined,
    protectPrivileges = undefined,
  ) {
    this.node = node;
    this.decEnv = decEnv;
    if (thisVal) this.thisVal = thisVal;
    if (canAffectDecEnv) this.canAffectDecEnv = canAffectDecEnv;
    if (protectPrivileges) this.protectPrivileges = protectPrivileges;
  }
}

export class DeveloperFunction {
  constructor(fun, protectSignal = undefined) {
    this.fun = fun;
    if (protectSignal) this.protectSignal = protectSignal;
  }
}

export class ProtectedObject {
  constructor(moduleID, privateMethods, publicMethods, otherProps) {
    this.moduleID = moduleID;
    // Method := [signal : string, fun : DefinedFunction | DeveloperFunction].
    this.privateMethods = privateMethods;
    this.publicMethods = publicMethods;
    // Other props are readonly, and can be anything.
    this.otherProps = otherProps;
  }
}

export class EntityReference {
  constructor(path) {
    this.path = path;
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
  constructor(msg, node, environment) {
    this.msg = msg;
    this.node = node;
    this.environment = environment;
  }
}

export class OutOfGasError {
  constructor(msg, node, environment) {
    this.msg = msg;
    this.node = node;
    this.environment = environment;
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
