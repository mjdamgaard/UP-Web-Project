
import {scriptParser} from "./DataParser.js";
import {PriorityCache} from "./PriorityCache.js";
// import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";


const cache = new PriorityCache(5000, 3600 * 2);



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
    // statement list with that environment.

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
    // statement is reached.. ..Hm, it's easiest to throw rather than return,
    // then just let the loop executor function catch it (or catch it and turn
    // it into a ScriptError, if not caught by a loop execution function).

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
    // TODO: If their is a declaration statement for the loop, first create a
    // new environment (with previous environment as the prototype, of course)
    // and run the declaration statement in that, then create a new empty 
    // environment with the other new environment as the parent/prototype (or
    // if there is no declaration statement, just start by doing this). Then
    // run the looped statement, and catch any.. ..Oh, we should trow the return
    // statements as well.. ..Sure..
  }



}




export class ScriptError {
  constructor(msg) {
    this.msg = msg;
  }
}

export class CustomError {
  constructor(msg) {
    this.msg = msg;
  }
}
