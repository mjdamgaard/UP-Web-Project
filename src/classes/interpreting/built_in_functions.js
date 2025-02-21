
import {
  payGas, decrCompGas, decrFetchGas, DefinedFunction, BuiltInFunction,
  ThisBoundFunction, RuntimeError,
} from "./ScriptInterpreter.js";



function callFunction({callerNode, callerEnv}, fun, inputArr) {
  if (fun instanceof Function) {
    return fun(...inputArr);
  }
  else if (
    fun instanceof DefinedFunction || fun instanceof BuiltInFunction ||
    fun instanceof ThisBoundFunction 
  ) {
    let {scriptInterpreter} = callerEnv.scriptGlobals;
    scriptInterpreter.executeFunction(
      callback, inputArr, callerNode, callerEnv
    );
  }
  else throw "callFunction(): callback is not a function";
}



export const builtInFunctions = {

  getStructModuleIDs: function ({callerEnv}, structDef) {
    decrCompGas(callerEnv);
    let secondAttributeStr = (structDef.match(/[^,]+/g) ?? [])[1];
    return secondAttributeStr.match(/[1-9][0-9]*/g) ?? [];
  },


  fetchStructDef: function (envData, structID, callback) {
    let {callerEnv, scriptGlobals} = envData;
    decrCompGas(callerEnv);
    let {
      fetchEnt, entityCache, structPriority = 1,
    } = scriptGlobals.funOptions;

    let [defStr] = entityCache.get(structID, structPriority) ?? [];
    if (defStr !== undefined) {
      callFunction(envData, callback, [defStr]);
    }
    else {
      fetchEnt(structID, 700, (entType, defStr) => {
        entityCache.set(structID, [defStr], structPriority);
        callFunction(envData, callback, [defStr]);
      });
    }
  },


  fetchScript: function (
    {callerNode, callerEnv, scriptGlobals}, scriptID, callback
  ) {
    decrCompGas(callerEnv);
    let {scriptInterpreter} = scriptGlobals;
    let {
      fetchEnt, entityCache, scriptPriority = 1, maxScriptLen = 4294967295,
    } = scriptGlobals.funOptions;

    let [defStr] = entityCache.get(scriptID, scriptPriority) ?? [];
    if (defStr !== undefined) {
      scriptInterpreter.executeFunction(
        callback, [defStr], callerNode, callerEnv
      );
    }
    else {
      fetchEnt(scriptID, maxScriptLen, (defStr) => {
        entityCache.set(scriptID, [defStr], scriptPriority);
        scriptInterpreter.executeFunction(
          callback, [defStr], callerNode, callerEnv
        );
      });
    }
  },

}