
import {
  payGas, decrCompGas, decrFetchGas, DefinedFunction, BuiltInFunction,
  ThisBoundFunction, RuntimeError,
} from "./ScriptInterpreter.js";



export const builtInFunctions = {

  getStructModuleIDs: function ({callerEnv}, structDef) {
    decrCompGas(callerEnv);
    let secondAttributeStr = (structDef.match(/[^,]+/g) ?? [])[1];
    return secondAttributeStr.match(/[1-9][0-9]*/g) ?? [];
  },


  fetchStructDef: function (
    {callerNode, callerEnv, scriptGlobals}, structID, callback
  ) {
    decrCompGas(callerEnv);
    let {scriptInterpreter} = scriptGlobals;
    let {
      fetchRegEnt, entityCache, structPriority = 1,
    } = scriptGlobals.funOptions;

    let [defStr] = entityCache.get(structID, structPriority) ?? [];
    if (defStr !== undefined) {
      scriptInterpreter.executeFunction(
        callback, [defStr], callerNode, callerEnv
      );
    }
    else {
      fetchRegEnt(structID, (defStr) => {
        entityCache.set(structID, [defStr], structPriority);
        scriptInterpreter.executeFunction(
          callback, [defStr], callerNode, callerEnv
        );
      });
    }
  },


  fetchScript: function (
    {callerNode, callerEnv, scriptGlobals}, structID, callback
  ) {
    // TODO: Implement.
  },

}