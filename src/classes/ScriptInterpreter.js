
import {scriptParser} from "./DataParser.js";
import {PriorityCache} from "./PriorityCache.js";
// import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";
import {EntityReference, EntityPlaceholder} from "./DataParser.js";


const cache = new PriorityCache(5000, 3600 * 2);

const COMP_GAS_ERROR = "Ran out of computation gas.";



export class ScriptInterpreter {

  constructor(queryEntity, builtInFunctions) {
    this.queryEntity = queryEntity;
    this.builtInFunctions = builtInFunctions;
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

    // return [liveScript, liveModules];
  }

  static executeMainFunction(gas, liveScript, liveModules) {
    // Execute the main function of the script, and if no function is called
    // 'main', execute the default export. If there are no default export, but
    // only one declaration (including an anonymous declaration, meaning that
    // the script only includes a single expression after the imports), then
    // execute that. If the default/only declaration is a variable, simply
    // return that right away (it is already computed as part of the
    // initialization).

  }

  static executeFunction(
    gas, funSyntaxTree, inputValueArr, environment, liveModules
  ) {
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


  static executeStatementList(
    gas, stmtListSyntaxTree, environment, liveModules
  ) {
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

  static executeBlockStatement(
    gas, blockStmtSyntaxTree, environment, liveModules
  ) {
    // TODO: Create a new empty environment (with input environment as
    // the prototype), and execute the statement list inside the block.

  }

  static executeLoop(
    gas, loopListSyntaxTree, environment, liveModules
  ) {
    // TODO: Make a environment (with the input as its parent/prototype), and 
    // run the declaration statement, if any, inside it at first. Then
    // depending on the doFirst flag, evaluate and check the condition
    // initially or not. Then run the statement inside the environment and
    // catch any break or continue exceptions, and pass on any other
    // exceptions/errors. Then run the update expression inside the environment,
    // if any. Then make the condition check again and repeat.
  }

  static executeIfElseStatement(
    gas, ifElseStmtSyntaxTree, environment, liveModules
  ) {
    // TODO: Simply check the condition, and then either run the ifStmt or
    // elseStmt depending, or do nothing if the to-be-run elseStmt is undefined.
  }


  // TODO: Implement switch-case grammar and handling at some point.


  static executeVariableDeclaration(
    gas, varDecSyntaxTree, environment, liveModules
  ) {
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


  static executeStatement(
    gas, stmtSyntaxTree, environment, liveModules
  ) {
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


  static evaluateExpression(
    gas, expSyntaxTree, environment, liveModules
  ) {
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
        let acc = this.evaluateExpression(
          gas, children[0], environment, liveModules
        );
        expSyntaxTree.operators.forEach((op, ind) => {
          let nextVal = this.evaluateExpression(
            gas, children[ind + 1], environment, liveModules
          );
          switch (op) {
            case "||":
              acc = acc || nextVal;
              break;
            case "??":
              acc = acc ?? nextVal;
              break;
            case "&&":
              acc = acc && nextVal;
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
        });
        return acc;
      }
      case "exponential-expression": {
        let root = this.evaluateExpression(
          gas, expSyntaxTree.root, environment, liveModules
        );
        let exp = this.evaluateExpression(
          gas, expSyntaxTree.exp, environment, liveModules
        );
        return root ** exp;
      }
      case "prefix-expression": {
        let val = this.evaluateExpression(
          gas, expSyntaxTree.exp, environment, liveModules
        );
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
          case "await":
            // TODO: Implement
            return;
        }
      }
      case "postfix-expression": {
        let val = this.evaluateExpression(
          gas, expSyntaxTree.exp, environment, liveModules
        );
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
