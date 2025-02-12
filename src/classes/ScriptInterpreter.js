
import {scriptParser} from "./DataParser.js";
import {PriorityCache} from "./CombinedCache.js";
// import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";
import {EntityReference, EntityPlaceholder} from "./DataParser.js";


const MAX_ARRAY_INDEX = 1E+15;

const GAS_NAMES = {
  comp: "computation",
};



export class ScriptInterpreter {

  constructor(queryEntity, builtInFunctions, cache) {
    this.queryEntity = queryEntity;
    this.builtInFunctions = builtInFunctions;
    this.moduleCache = cache;
  }


  static executeFunctionsInModule(gas, moduleID, funArr, inputArrArr) {
    // Import modules and sub-modules, then execute each function in funArr,
    // with its inputs found in inputArrArr. If any function is undefined for
    // a given inputArr, execute the main function of the script instead, and
    // if no function is called 'main', execute the default export.
    
    // If there
    // are no default export, but nly one declaration (including an anonymous
    // declaration, meaning that
    // the script only includes a single expression after the imports), then
    // execute that. If the default/only declaration is a variable, simply
    // return that right away (it is already computed as part of the
    // initialization).

  }



  static parseScript(str) {
    // TODO: Throw a RuntimeError on failure.
    return scriptParser.parse(str);
  }

  static importModules(gas, scriptTree, importedModules = []) {
    // TODO: Get all module scriptIDs, look for them in cache, and if not found,
    // query the defStr of the script entity, parse it, and add it to the cache.
    // When a module is found, add it to importedModules, then call this method
    // recursively on the parsed script, until all modules or found. *Do this as
    // much in parallel as possible.

    // Then return modules, and increase counters inside gas object as a side-
    // effect.

  }

  static initializeScript(
    gas, scriptTree, modules, importingScriptIDs = []
  ) {
    // TODO: Run all the imported modules in order, and run all their modules
    // as well, etc. If a module imports a module that has imported it, throw.
    // For each module, including the outer script, look in the cache *(actually
    // look in modules instead, which is a subset of the cache) if the module/
    // script has already been initialized before, and if so, just copy
    // the initial variables from that instead.
    // Return initialized script and array of initialized objects, which are
    // all new objects that can be muted without changing the inputs of this
    // method, except gas, and where each initialized script/module holds a live
    // environment of variables.
    // Also increase counters inside gas.

    // No, let's just return an environment, but let all variables in it,
    // including functions, be typed, and for all functions, we attach a (live)
    // environment to them. Then we don't need to think about modules from
    // there.

    // ..Wait, so should all expression values be typed, then? ..Or what..?
    // ..Or i could also just wrap functions in a Function class monad, and
    // then it will just look like an empty object (since we will not prefix
    // properties of the Function class with '#') to any user that tries to do
    // operations on it.. Hm.. (16:43) ..Hm, yeah, this could work.. ..Yes, let
    // me do that.. (16:45)

    // return environment;
  }






  static executeFunction(
    gas, funSyntaxTree, inputValueArr, environment, thisVal = undefined
  ) {
    decrCompGas(gas);

    // Initialize a new environment for the execution of the function.
    let newEnv = new Environment(environment, "function", thisVal);

    // Add the input parameters to the new environment.
    funSyntaxTree.params.forEach((param, ind) => {
      let paramName = param.lexeme;
      let paramVal = inputValueArr[ind];

      // If the parameter is typed, check the type.
      if (param.invalidTypes) {
        let inputValType = getType(paramVal);
        if (param.invalidTypes.includes(inputValType)) {
          throw new RuntimeError(
            `Input parameter of invalid type "${inputValType}"`,
            param,
          );
        }
      }

      // Else declare the parameter in the new environment.
      newEnv.declare(paramName, paramVal, false, "block", param);
    });

    // Now execute the statements inside a try-catch statement to catch any
    // return exception, or any uncaught break or continue exceptions. On a
    // return exception, return the held value. 
    let stmtArr = funSyntaxTree.body.stmtArr;
    try {
      stmtArr.forEach(stmt => this.executeStatement(gas, stmt, newEnv));
    } catch (err) {
      if (err instanceof ReturnException) {
        return err.val;
      }
      else if (
        err instanceof BreakException || err instanceof ContinueException
      ) {
        throw new RuntimeError(
          "Invalid break or continue statement",
          err.node
        );
      }
      else {
        throw err;
      }
    }

    return undefined;
  }




  static executeVariableDeclaration(gas, varDecSyntaxTree, environment) {
    decrCompGas(gas);

    let type = varDecSyntaxTree.type;
    if (type === "definition-list") {
      varDecSyntaxTree.defList.forEach(varDef => {
        let ident = varDef.ident.lexeme;
        let val = (!varDef.exp) ? undefined :
          this.evaluateExpression(gas, varDef.exp, environment);
        environment.declare(ident, val, false, "block", varDecSyntaxTree);
      });
    }
    else if (type === "destructuring") {
      let val = this.evaluateExpression(
        gas, varDecSyntaxTree.exp, environment
      );
      if (!Array.isArray(val)) throw new RuntimeError(
        "Destructuring of a non-array expression",
        varDecSyntaxTree
      );
      varDecSyntaxTree.identList.forEach((ident, ind) => {
        ident = ident.lexeme;
        let nestedVal = val[ind];
        environment.declare(
          ident, nestedVal, false, "block", varDecSyntaxTree
        );
      });
    }
    else throw (
      "ScriptInterpreter.evaluateExpression(): Unrecognized " +
      `variable declaration type: "${type}"`
    );
  }


  static executeFunctionDeclaration(gas, funDecSyntaxTree, environment) {
    decrCompGas(gas);

    let funVal = new DefinedFunction(funDecSyntaxTree, environment);
    environment.declare(
      funDecSyntaxTree.name, funVal, false, "block", funDecSyntaxTree
    );
  }




  static executeStatement(gas, stmtSyntaxTree, environment) {
    decrCompGas(gas);

    let type = stmtSyntaxTree.type;
    switch (type) {
      case "block-statement": {
        let newEnv = new Environment(environment, "block");
        let stmtArr = stmtSyntaxTree.children;
        let len = stmtArr.length;
        for (let i = 0; i < len; i++) {
          this.executeStatement(gas, stmtArr[i], newEnv);
        }
      }
      case "if-else-statement": {
        let condVal = this.evaluateExpression(
          gas, stmtSyntaxTree.cond, environment
        );
        if (condVal) {
          this.executeStatement(gas, stmtSyntaxTree.isStmt, environment);
        } else if (stmtSyntaxTree.elseStmt) {
          this.executeStatement(gas, stmtSyntaxTree.elseStmt, environment);
        }
      }
      case "loop-statement": {
        let newEnv = new Environment(environment, "block");
        let innerStmt = stmtSyntaxTree.stmt;
        let updateExp = stmtSyntaxTree.updateExp;
        let condExp = stmtSyntaxTree.updateStmt;
        if (stmtSyntaxTree.dec) {
          this.executeStatement(gas, stmtSyntaxTree.dec, newEnv);
        }
        let postponeCond = stmtSyntaxTree.doFirst;
        while (postponeCond || this.evaluateExpression(gas, condExp, newEnv)) {
          postponeCond = false;
          try {
            this.executeStatement(gas, innerStmt, newEnv);
          } catch (err) {
            if (err instanceof BreakException) {
              return;
            } else if (!(err instanceof ContinueException)) {
              throw err;
            }
          }
          this.evaluateExpression(gas, updateExp, newEnv);
        }
      }
      case "return-statement": {
        let expVal = (!stmtSyntaxTree.exp) ? undefined :
          this.evaluateExpression(gas, stmtSyntaxTree.cond, environment);
        throw new ReturnException(expVal, stmtSyntaxTree);
      }
      case "throw-statement": {
        let expVal = (!stmtSyntaxTree.exp) ? undefined :
          this.evaluateExpression(gas, stmtSyntaxTree.cond, environment);
        throw new ThrownException(expVal, stmtSyntaxTree);
      }
      case "try-catch-statement": {
        try {
          this.executeStatement(gas, stmtSyntaxTree.tryStmt, environment);
        } catch (err) {
          if (err instanceof RuntimeError || err instanceof CustomError) {
            let newEnv = new Environment(environment, "block");
            newEnv.declare(
              stmtSyntaxTree.ident, err.msg, false, "block", stmtSyntaxTree
            );
            this.executeStatement(gas, stmtSyntaxTree.catchStmt, newEnv);
          }
          else throw err;
        }
      }
      case "instruction-statement": {
        if (stmtSyntaxTree.lexeme === "break") {
          throw new BreakException(stmtSyntaxTree);
        } else {
          throw new ContinueException(stmtSyntaxTree);
        }
      }
      case "empty-statement": {
        return;
      }
      case "variable-declaration": {
        this.executeVariableDeclaration(gas, stmtSyntaxTree, environment);
      }
      case "function-declaration": {
        this.executeFunctionDeclaration(gas, stmtSyntaxTree, environment);
      }
      default: throw (
        "ScriptInterpreter.evaluateExpression(): Unrecognized " +
        `statement type: "${type}"`
      );
    }

  }




  static evaluateExpression(gas, expSyntaxTree, environment) {
    decrCompGas(gas);

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
        let val = this.evaluateExpression(gas, expSyntaxTree.exp2, environment);
        let op = expSyntaxTree.op;
        switch (op) {
          case "=":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp1, environment, () => {
                let newVal = val;
                return [newVal, newVal]
              }
            );
          case "+=":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) + parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "-=":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) - parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "*=":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) * parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "/=":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp1, environment, prevVal => {
                let newVal = parseFloat(prevVal) / parseFloat(val);
                return [newVal, newVal]
              }
            );
          case "&&=":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp1, environment, prevVal => {
                let newVal = prevVal && val;
                return [newVal, newVal]
              }
            );
          case "||=":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp1, environment, prevVal => {
                let newVal = prevVal || val;
                return [newVal, newVal]
              }
            );
          case "??=":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp1, environment, prevVal => {
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
        let cond = this.evaluateExpression(
          gas, expSyntaxTree.cond, environment
        );
        if (cond) {
          return this.evaluateExpression(
            gas, expSyntaxTree.exp1, environment
          );
        } else {
          return this.evaluateExpression(
            gas, expSyntaxTree.exp2, environment
          );
        }
      }
      case "polyadic-operation": {
        let children = expSyntaxTree.children;
        let acc = this.evaluateExpression(gas, children[0], environment);
        expSyntaxTree.operators.forEach((op, ind) => {
          let nextChild = children[ind + 1];
          let nextVal;
          if (op !== "||" && op !== "??" && op !== "&&") {
            nextVal = this.evaluateExpression(gas, nextChild, environment);
          }
          switch (op) {
            case "||":
              acc = acc || this.evaluateExpression(gas, nextChild, environment);
              break;
            case "??":
              acc = acc ?? this.evaluateExpression(gas, nextChild, environment);
              break;
            case "&&":
              acc = acc && this.evaluateExpression(gas, nextChild, environment);
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
            case "<>":
              if (Array.isArray(acc)) {
                if (!Array.isArray(nextVal)) throw new RuntimeError(
                  "Cannot concat a non-array to an array",
                  children[ind + 1]
                );
                acc = [acc, ...nextVal];
              } else {
                acc = acc.toString() + nextVal;
              }
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
        });
        return acc;
      }
      case "exponential-expression": {
        let root = this.evaluateExpression(
          gas, expSyntaxTree.root, environment
        );
        let exp = this.evaluateExpression(
          gas, expSyntaxTree.exp, environment
        );
        return parseFloat(root) ** parseFloat(exp);
      }
      case "prefix-expression": {
        let op = expSyntaxTree.op;
        switch (op) {
          case "++":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Increment of a non-numeric value",
                  expSyntaxTree
                );
                let newVal = int + 1;
                return [newVal, newVal]
              }
            );
          case "--":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Decrement of a non-numeric value",
                  expSyntaxTree
                );
                let newVal = int - 1;
                return [newVal, newVal]
              }
            );
        }
        let val = this.evaluateExpression(gas, expSyntaxTree.exp, environment);
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
              gas, expSyntaxTree.exp, environment, prevVal => {
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
        let op = expSyntaxTree.op;
        switch (op) {
          case "++":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Increment of a non-numeric value",
                  expSyntaxTree
                );
                let newVal = int + 1;
                return [newVal, prevVal]
              }
            );
          case "--":
            return this.assignToVariableOrMember(
              gas, expSyntaxTree.exp, environment, prevVal => {
                let int = parseFloat(prevVal);
                if (!int && int !== 0) throw new RuntimeError(
                  "Decrement of a non-numeric value",
                  expSyntaxTree
                );
                let newVal = int - 1;
                return [newVal, prevVal]
              }
            );
        }
      }
      case "function-call": {
        let fun = this.evaluateExpression(gas, expSyntaxTree.exp, environment);
        let inputExpArr = expSyntaxTree.postfix.children;
        let inputVals = inputExpArr.map(exp => (
          this.evaluateExpression(gas, exp, environment)
        ));

        // Potentially get function and thisVal from ThisBoundFunction wrapper.
        let thisVal = undefined;
        if (fun instanceof ThisBoundFunction) {
          thisVal = fun.thisVal;
          fun = fun.funVal;
        }

        // Then execute the function depending on its type.
        if (fun instanceof DefinedFunction) {
          return this.executeFunction(
            gas, fun.syntaxTree, inputVals, fun.environment, thisVal
          );
        }
        else if (fun instanceof BuiltInFunction) {
          payGas(gas, fun.gasCost);
          return fun.fun(inputVals);
        }
        else throw new RuntimeError(
          "Function call with a non-function-valued expression",
          expSyntaxTree
        );
      }
      case "virtual-method": {
        let objVal = this.evaluateExpression(
          gas, expSyntaxTree.obj, environment
        );
        let funVal = this.evaluateExpression(
          gas, expSyntaxTree.fun, environment
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
          expSyntaxTree.fun
        );
      }
      case "member-access": {
        // Call sub-procedure to get the expVal, and the safe-to-use indexVal.
        let [expVal, indexVal] = this.getMemberAccessExpValAndSafeIndex(
          gas, expSyntaxTree, environment
        );

        // Handle graceful return in case of an optional chaining.
        if (expSyntaxTree.postfix.isOpt) {
          if (expVal === null || expVal === undefined) {
            return undefined;
          }
        }

        // Then get the value held in expVal.
        let ret = expVal[indexVal];

        // And if the value is a function, bind this to expVal for it. (Note
        // that this differs from the conventional semantics of JavaScript,
        // where 'this' is normally only bound at the time when the method is
        // being called.)
        if (ret instanceof DefinedFunction || ret instanceof BuiltInFunction) {
          ret = new ThisBoundFunction(ret, expVal);
        }
        else if (ret instanceof ThisBoundFunction) {
          ret = new ThisBoundFunction(ret.retVal, expVal);
        }

        return ret;
      }
      case "array": {
        let expValArr = expSyntaxTree.children.map(exp => (
          this.evaluateExpression(gas, exp, environment)
        ));
        return expValArr;
      }
      case "object": {
        let memberEntries = expSyntaxTree.children.map(exp => (
          [
            "#" + (
              exp.ident ??
              this.evaluateExpression(gas, exp.nameExp, environment)
            ),
            this.evaluateExpression(gas, exp.valExp, environment)
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
        return environment.get(ident);
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
      default: throw (
        "ScriptInterpreter.evaluateExpression(): Unrecognized type: " +
        `"${type}"`
      );
    }
  }


  static assignToVariableOrMember(gas, expSyntaxTree, environment, assignFun) {
    if (expSyntaxTree.type === "identifier") {
      let ident = expSyntaxTree.lexeme;
      return environment.assign(ident, expSyntaxTree, assignFun);
    }
    else if (
      expSyntaxTree.type === "member-access" && !expSyntaxTree.postfix.isOpt
    ) {
      // Call sub-procedure to get the expVal, and the safe-to-use indexVal.
      let [expVal, indexVal] = this.getMemberAccessExpValAndSafeIndex(
        gas, expSyntaxTree, environment
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
        expSyntaxTree
      );
    }
  }

  static getMemberAccessExpValAndSafeIndex(gas, memAccSyntaxTree, environment) {
    // Evaluate the expression.
    let expVal = this.evaluateExpression(
      gas, memAccSyntaxTree.exp, environment
    );

    // Now get the index value.
    let indexExp = memAccSyntaxTree.postfix;
    let indexVal = indexExp.ident;
    if (!indexVal) {
      indexVal = this.evaluateExpression(gas, indexExp.exp, environment);
    }
    if (typeof indexVal !== "string" && typeof indexVal !== "number") {
      throw new RuntimeError(
        "Indexing with a non-primitive value",
        indexExp
      );
    }

    // If expVal is an array, check that indexVal is a non-negative
    // integer, and if it is an object, append "#" to the indexVal.
    if (Array.isArray(expVal)) {
      indexVal = parseInt(indexVal);
      if (!(indexVal >= 0 && indexVal <= MAX_ARRAY_INDEX)) {
        throw new RuntimeError(
          "Assignment to an array with a non-integer or a " +
          "negative integer key",
          indexExp
        );
      }
    }
    else if (!expVal || typeof expVal !== "object") {
      throw new RuntimeError(
        "Assignment to a member of a non-object",
        memAccSyntaxTree
      );
    }
    else {
      indexVal = "#" + indexVal;
    }

    return [expVal, indexVal];
  }

}




const UNDEFINED = {};


class Environment {
  constructor(parent = undefined, scopeType = "block", thisVal) {
    this.parent = parent;
    this.scopeType = scopeType;
    this.variables = {"#this": thisVal ?? UNDEFINED};
  }

  get(ident) {
    let safeIdent = "#" + ident;
    let [val] = this.variables[safeIdent];
    if (val !== undefined) {
      return (val === UNDEFINED) ? undefined : val;
    } else if (this.parent) {
      return this.parent.get(ident);
    } else {
      return undefined;
    }
  }

  declare(ident, val, isConst, scopeType, node) {
    val = (val === undefined) ? UNDEFINED : val;
    let safeIdent = "#" + ident;
    let [prevVal] = this.variables[safeIdent];
    if (scopeType === "block") {
      if (prevVal !== undefined) {
        throw new RuntimeError(
          "Redeclaration of variable '" + ident + "'",
          node
        );
      } else {
        this.variables[safeIdent] = [val, isConst];
      }
    } else if (scopeType === "function") {
      throw "Environment.declare(): 'var' keyword not implemented";
    } else {
      throw "Environment.declare(): scope type not recognized/implemented"
    }
  }

  assign(ident, node, assignFun) {
    let safeIdent = "#" + ident;
    let [prevVal, isConst] = this.variables[safeIdent];
    if (prevVal !== undefined) {
      if (isConst) {
        throw new RuntimeError(
          "Reassignment of constant variable or function '" + ident + "'",
          node
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
        node
      );
    }
  }

}





function payGas(gas, gasCost, node) {
  Object.keys(this.gasCost).forEach(key => {
    if (gas[key] ??= 0) {
      gas[key] -= gasCost[key];
    }
    if (gas[key] < 0) throw new RuntimeError(
      "Ran out of " + GAS_NAMES[key] + "gas",
      node
    );
  });
}

function decrCompGas(gas, node) {
  if (0 > --gas.comp) throw new RuntimeError(
    "Ran out of " + GAS_NAMES.comp + " gas",
    node
  );
}



function getType(val) {
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





class DefinedFunction {
  constructor(syntaxTree, environment) {
    this.syntaxTree = syntaxTree;
    this.environment = environment;
  }
}

class BuiltInFunction {
  constructor(fun, gasCost) {
    this.fun = fun;
    this.gasCost = gasCost;
    this.gasCost = gasCost;
  }
}

class ThisBoundFunction {
  constructor(funVal, thisVal) {
    this.funVal = funVal;
    this.thisVal = thisVal;
  }
}



class ReturnException {
  constructor(val, node) {
    this.val = val;
    this.node = node;
  }
}
class ThrownException {
  constructor(val, node) {
    this.val = val;
    this.node = node;
  }
}
class BreakException {
  constructor(node) {
    this.node = node;
  }
}
class ContinueException {
  constructor(node) {
    this.node = node;
  }
}



export class RuntimeError {
  constructor(msg, node) {
    this.msg = msg;
    this.node = node;
  }
}

export class CustomError {
  constructor(msg, node) {
    this.msg = msg;
    this.node = node;
  }
}
