
import {MainDBInterface} from "../../../node_js/db_io/MainDBInterface";



export function selectEntity(entID, asUser, maxLen = 4294967295) {
  MainDBInterface.selectEntity();
}

export function selectEntity_flags(entID, asUser, maxLen) {
  return asUser ? "R" : "r";
};











// function callFunction({callerNode, callerEnv}, fun, inputArr) {
//   if (fun instanceof Function) {
//     return fun(...inputArr);
//   }
//   else if (
//     fun instanceof DefinedFunction || fun instanceof BuiltInFunction ||
//     fun instanceof ThisBoundFunction 
//   ) {
//     let {scriptInterpreter} = callerEnv.runtimeGlobals;
//     scriptInterpreter.executeFunction(
//       callback, inputArr, callerNode, callerEnv
//     );
//   }
//   else throw "callFunction(): callback is not a function";
// }



export const basicBuiltInFunctions = {

  getStructModuleIDs: new BuiltInFunction(function ({callerEnv}, structDef) {
    decrCompGas(callerEnv);
    return getStructModuleIDs(structDef)
  }),


  fetchEntity: new BuiltInFunction(function (
    {gas, callerEnv, callerNode, options: {dataFetcher}},
    entID, callback // TODO: Change to entRef instead.
  ) {
    decrCompGas(callerEnv);
    // TODO: Check permissions first.
    let {scriptInterpreter} = callerEnv.runtimeGlobals;
    dataFetcher.fetchEntity(gas, entID).then(res => {
      scriptInterpreter.executeFunction(callback, [res], callerNode, callerEnv);
    });
  }),

  fetchAndParseEntity: new BuiltInFunction(function (
    {gas, callerEnv, callerNode, options: {dataFetcher}},
    entID, entType = "any", callback
  ) {
    decrCompGas(callerEnv);
    // TODO: Check permissions first.
    let {scriptInterpreter} = callerEnv.runtimeGlobals;
    dataFetcher.fetchAndParseEntity(gas, entID, entType).then(res => {
      scriptInterpreter.executeFunction(callback, [res], callerNode, callerEnv);
    });
  }),


}