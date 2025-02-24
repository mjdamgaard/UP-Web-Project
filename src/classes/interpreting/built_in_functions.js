
import {
  payGas, decrCompGas, decrFetchGas, DefinedFunction, BuiltInFunction,
  ThisBoundFunction, RuntimeError, getStructModuleIDs,
} from "./ScriptInterpreter.js";



// function callFunction({callerNode, callerEnv}, fun, inputArr) {
//   if (fun instanceof Function) {
//     return fun(...inputArr);
//   }
//   else if (
//     fun instanceof DefinedFunction || fun instanceof BuiltInFunction ||
//     fun instanceof ThisBoundFunction 
//   ) {
//     let {scriptInterpreter} = callerEnv.scriptGlobals;
//     scriptInterpreter.executeFunction(
//       callback, inputArr, callerNode, callerEnv
//     );
//   }
//   else throw "callFunction(): callback is not a function";
// }



export const basicBuiltInFunctions = {

  getStructModuleIDs: function ({callerEnv}, structDef) {
    decrCompGas(callerEnv);
    return getStructModuleIDs(structDef)
  },


  fetchEntity: function (
    {gas, callerEnv, callerNode, options: {dataFetcher}},
    entID, callback
  ) {
    decrCompGas(callerEnv);
    // TODO: Check permissions first.
    let {scriptInterpreter} = callerEnv.scriptGlobals;
    dataFetcher.fetchEntity(gas, entID, (res) => {
      scriptInterpreter.executeFunction(callback, [res], callerNode, callerEnv);
    });
  },

  fetchAndParseEntity: function (
    {gas, callerEnv, callerNode, options: {dataFetcher}},
    entID, entType, callback
  ) {
    decrCompGas(callerEnv);
    // TODO: Check permissions first.
    let {scriptInterpreter} = callerEnv.scriptGlobals;
    dataFetcher.fetchAndParseEntity(gas, entID, entType, (res) => {
      scriptInterpreter.executeFunction(callback, [res], callerNode, callerEnv);
    });
  },


}