
import {scriptParser} from "./DataParser.js";
import {PriorityCache} from "./CombinedCache.js";
// import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";
import {EntityReference, EntityPlaceholder} from "./DataParser.js";


const cache = new PriorityCache(5000, 3600 * 2);

const COMP_GAS_ERROR = "Ran out of computation gas.";



export class ScriptInterpreter {

  constructor(queryEntity, builtInFunctions, cache) {
    this.queryEntity = queryEntity;
    this.builtInFunctions = builtInFunctions;
    this.moduleCache = cache;
  }

  static parseScript(str) {
    // TODO: Throw a ScriptError on failure.
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

  static executeMainFunction(gas, scriptTree, environment) {
    // Execute the main function of the script, and if no function is called
    // 'main', execute the default export. If there are no default export, but
    // only one declaration (including an anonymous declaration, meaning that
    // the script only includes a single expression after the imports), then
    // execute that. If the default/only declaration is a variable, simply
    // return that right away (it is already computed as part of the
    // initialization).

  }

  static executeFunction( gas, funSyntaxTree, inputValueArr, environment) {
    // TODO: Pair the input values with the parameters, and convert the values
    // automatically to the type of the input parameter, if the type is a
    // primitive one. Then create a new environment, and start executing the
    // statement list with that environment. The return statement inside the
    // function will throw the returned value, so try-catch it. And if no
    // return value is thrown, the return value should be regarded as
    // undefined.

    // Return the return value of the function (or throw either a ScriptError
    // on runtime error, or if the gas runs up, or a CustomError, if a throw
    // statement is reached).

  }


  static executeStatementList(gas, stmtListSyntaxTree, environment) {
    // TODO: Pair the input values with the parameters, and convert the values
    // automatically to the type of the input parameter, if the type is a
    // primitive one. Then create a new environment, and start executing the
    // statement list with that environment.

    // If a return statement is reached, return the returned value, else return
    // undefined if the end of the list is reached. If a break or continue
    // statement is reached, throw a break or continue signal, which can be
    // caught by a loop (or if not caught can be turned into a ScriptError).

    // Make changes to environment (and gas) as side-effects.
  }

  static executeBlockStatement(gas, blockStmtSyntaxTree, environment) {
    // TODO: Create a new empty environment (with input environment as
    // the prototype), and execute the statement list inside the block.

  }

  static executeLoop(gas, loopListSyntaxTree, environment) {
    // TODO: Make a environment (with the input as its parent/prototype), and 
    // run the declaration statement, if any, inside it at first. Then
    // depending on the doFirst flag, evaluate and check the condition
    // initially or not. Then run the statement inside the environment and
    // catch any break or continue exceptions, and pass on any other
    // exceptions/errors. Then run the update expression inside the environment,
    // if any. Then make the condition check again and repeat.
  }

  static executeIfElseStatement(gas, ifElseStmtSyntaxTree, environment) {
    // TODO: Simply check the condition, and then either run the ifStmt or
    // elseStmt depending, or do nothing if the to-be-run elseStmt is undefined.
  }


  // TODO: Implement switch-case grammar and handling at some point.


  static executeVariableDeclaration(gas, varDecSyntaxTree, environment) {
    // TODO: If the statement is a definition list, iterate over each variable
    // definition, evaluate that expression if any, and then add the variable
    // to the environment, or throw a runtime error, if it already defined in
    // the environment (or a function of the same name is defined), but not
    // if its defined in a parent environment.
    // If it is a destructuring statement, evaluate the expression, then make
    // sure that is has all the required "0", "1", ... entries. Then for each
    // identifier (on the LHS), assign it the value on the corresponding entry,
    // and also make a similar check that it isn't defined already in the
    // current environment.
  }


  static executeStatement(gas, stmtSyntaxTree, environment) {
    if (--gas.comp < 0) throw new ScriptError(
      COMP_GAS_ERROR,
      stmtSyntaxTree
    );
    // TODO: switch-case the type of the statement, and then call any of the
    // above flow methods, or one of the below singular statements, depending
    // on the type. For some of the simple statements, like return, throw,
    // break, continue or the empty statement, just handle them inside the
    // switch-case statement. ..Oh, and do the same for the expression
    // statement. (So let me just move executeVariableDeclaration() up above
    // this one..)
  }


  static evaluateExpression(gas, expSyntaxTree, environment) {
    if (--gas.comp < 0) throw new ScriptError(
      COMP_GAS_ERROR,
      stmtSyntaxTree
    );
    // TODO: switch-case the type of the expression, and just handle each one
    // inside this statement.. ..Sure (unless they turn out to be too
    // complicated). ..Oh, which some are, especially the function call, but
    // then just factor those ones out.

    let type = expSyntaxTree.type;
    switch (type) {
      case "assignment":
        break;
      case "conditional-expression":
        break;
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
                if (!Array.isArray(nextVal)) throw new ScriptError(
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
        try {
          return root ** exp;
        } catch (err) {
          throw new ScriptError("Type error", expSyntaxTree);
        }
      }
      case "prefix-expression": {
        let val = this.evaluateExpression(gas, expSyntaxTree.exp, environment);
        let op = expSyntaxTree.op;
        switch (op) {
          case "++":
            // TODO: Implement.
            return;
          case "--":
            // TODO: Implement.
            return;
          case "!":
            return !val;
          case "~":
            return ~val;
          case "+":
            return +val;
          case "-":
            return -val;
          case "typeof":
            if (Array.isArray(val)) {
              return "array"
            } else {
              return typeof val;
            }
          case "void":
            return void val;
          case "delete":
            // TODO: Implement
            return;
            return;
          default: throw (
            "ScriptInterpreter.evaluateExpression(): Unrecognized " +
            `operator: "${op}"`
          );
        }
      }
      case "postfix-expression": {
        let val = this.evaluateExpression(gas, expSyntaxTree.exp, environment);
        let op = expSyntaxTree.op;
        switch (op) {
          case "++":
            // TODO: Implement.
            return;
          case "--":
            // TODO: Implement.
            return;
        }
      }
      case "function-call":
        break;
      case "member-access":
        break;
      case "array":
        break;
      case "object":
        break;
      case "entity-reference":
        if (expSyntaxTree.isTBD) {
          return new EntityPlaceholder(expSyntaxTree.lexeme);
        } else {
          return new EntityReference(expSyntaxTree.lexeme);
        }
      case "identifier":
        let ident = expSyntaxTree.lexeme;
        return environment.get(ident);
      case "string":
        return JSON.parse(expSyntaxTree.lexeme);
      case "number":
        return parseFloat(expSyntaxTree.lexeme);
      case "constant":
        let lexeme = expSyntaxTree.lexeme;
        return (lexeme === "true") ? true :
               (lexeme === "false") ? false :
               (lexeme === "null") ? null :
               undefined;
      default: throw (
        "ScriptInterpreter.evaluateExpression(): Unrecognized type: " +
        `"${type}"`
      );
    }
  }


  static assignToVariableOrMember(expSyntaxTree, assignFun, environment) {
    if (expSyntaxTree.type === "identifier") {
      let ident = expSyntaxTree.lexeme;
      return environment.assign(ident, assignFun, expSyntaxTree);;
    }
    else if (expSyntaxTree.type === "member-access") {
      let identTree = expSyntaxTree.exp;
      if (expSyntaxTree.type !== "identifier") throw new ScriptError(
        "Assignment to invalid expression",
        expSyntaxTree
      );

      // Remove and record the last index.
      let lastIndex = expSyntaxTree.indices.pop();

      // If the remaining indices array is empty, evaluate the identifier, or
      // else evaluate the whole member access with the last index removed.
      let valBeforeLastInd;
      if (expSyntaxTree.indices.length === 0) {
        valBeforeLastInd = this.evaluateExpression(
          gas, expSyntaxTree, environment
        );
      } else {
        valBeforeLastInd = this.evaluateExpression(
          gas, identTree, environment
        );
      }

      // Now get the index value.
      let indexVal = this.evaluateExpression(gas, lastIndex.exp, environment);

      // If valBeforeLastInd is an array, check that indexVal is a non-negative
      // integer, and if it is an object, append "#" to the indexVal.
      if (Array.isArray(valBeforeLastInd)) {
        indexVal = parseInt(indexVal);
        if (!(indexVal >= 0)) {
          throw new ScriptError(
            "Assignment to an array with a non-integer or a " +
            "negative integer key",
            lastIndex
          );
        }
      }
      else if (!valBeforeLastInd || typeof valBeforeLastInd !== "object") {
        throw new ScriptError(
          "Assignment to a member of a non-object",
          expSyntaxTree
        );
      }
      else {
        indexVal = "#" + indexVal;
      }

      // And then we simply assign the member of our valBeforeLastInd.
      let [newVal, ret] = assignFun(valBeforeLastInd[indexVal]);
      valBeforeLastInd[indexVal] = newVal;
      return ret;
    }
    else {
      throw new ScriptError(
        "Assignment to invalid expression",
        expSyntaxTree
      );
    }
  }


}




class Environment {
  constructor(parent = undefined, scopeType = "block") {
    this.parent = parent;
    this.scopeType = scopeType;
    this.variables = {};
  }

  get(ident) {
    let safeIdent = "#" + ident;
    let [val] = this.variables[safeIdent];
    if (val !== undefined) {
      return val;
    } else if (this.parent) {
      return this.parent.get(ident);
    } else {
      return undefined;
    }
  }

  declare(ident, val, isConst, scopeType, node) {
    let safeIdent = "#" + ident;
    let [prevVal] = this.variables[safeIdent];
    if (scopeType === "block") {
      if (prevVal !== undefined) {
        throw new ScriptError(
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

  assign(ident, assignFun, node) {
    let safeIdent = "#" + ident;
    let [prevVal, isConst] = this.variables[safeIdent];
    if (prevVal !== undefined) {
      if (isConst) {
        throw new ScriptError(
          "Reassignment of constant variable or function '" + ident + "'",
          node
        );
      } else {
        let [newVal, ret] = assignFun(prevVal);
        this.variables[safeIdent][0] = newVal;
        return ret;
      }
    } else if (this.parent) {
      return this.parent.assign(ident, assignFun, node);
    } else {
      throw new ScriptError(
        "Assignment of undefined variable '" + ident + "'",
        node
      );
    }
  }

}






class DefinedFunction {
  constructor(funTree, environment) {
    this.fun = funTree;
    this.env = environment;
  }
}

class BuiltInFunction {
  constructor(fun, gasCosts) {
    this.fun = fun;
    this.gasCosts = gasCosts;
  }
}



export class ScriptError {
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
