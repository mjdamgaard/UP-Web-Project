
import {
  DeveloperFunction, decrCompGas, decrGas, payGas, RuntimeError,
  getParsingGasCost,
} from "../../../interpreting/ScriptInterpreter.js";
import {MainDBInterface} from "../../../node_js/db_io/MainDBInterface.js";
import {
  entityCacheServerSide
} from "../../../caching/entity_caches/entityCahceServerSide.js";


export const selectEntity = new DeveloperFunction(
  ["10", "r"],
  function ({callerNode, callerEnv, interpreter}, entID, callback) {
    entID = entID.toString();
    if (!/^[$_a-zA-Z0-9]+$/.test(entID)) throw new RuntimeError(
      "selectEntity(): entID has to be of the form /^[$_a-zA-Z0-9]+$/",
      callerNode, callerEnv
    );
    decrCompGas(callerNode, callerEnv);
    let [parsedEnt, entType, creatorID, isEditable, whitelistID] =
      entityCacheServerSide.get(entID);
    if (parsedEnt) {
      if (whitelistID == "0") {
        interpreter.executeFunction(
          callback, [parsedEnt, entType, creatorID, isEditable],
          callerNode, callerEnv
        );
      } else {
        interpreter.executeFunction(
          callback, [], callerNode, callerEnv
        );
      }
      return;
    }
    MainDBInterface.selectEntity(entID, maxLen).then(res => {
      let [entType, defStr, len, creatorID, isEditable, whitelistID] = res;
      if (whitelistID != "0") {
        interpreter.executeFunction(
          callback, [], callerNode, callerEnv
        );
        return;
      }
      if (defStr.length != len) {

      }
    });
  }
);

export const selectEntityAsUser = new DeveloperFunction(
  ["10", "R"],
  function ({callerEnv}, entID, entType) {
    decrCompGas(callerEnv);
    MainDBInterface.selectEntity(entID, maxLen);
  }
);











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

  getStructModuleIDs: new DeveloperFunction(function ({callerEnv}, structDef) {
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