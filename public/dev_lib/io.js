
import {
  DeveloperFunction, decrCompGas, decrGas, payGas, RuntimeError,
  getParsingGasCost, EntityReference, ScriptEntity, ExpressionEntity,
  FormalEntity,
} from "../../src/interpreting/ScriptInterpreter.js";
import {
  entityCacheServerSide
} from "../../src/caching/entity_caches/entityCacheServerSide.js";



export const selectEntity = new DeveloperFunction(
  ["10", "read"],
  function ({callerNode, callerEnv, interpreter}, entRef, callback) {
    decrCompGas(callerNode, callerEnv);
    let {isServerSide} = callerEnv.scriptGlobals;

    if (!(entRef instanceof EntityReference)) throw new RuntimeError(
      "selectEntity(): entRef has to be an EntityReference instance",
      callerNode, callerEnv
    );
    let entID = entRef.id;

    if (isServerSide) {
      import("../../src/node_js/db_io/MainDBInterface.js").then(mod => {
        let MainDBInterface = mod.MainDBInterface;

        // Try to get the entity from the entity cache.
        let [parsedEnt, entType, creatorID, isEditable, whitelistID] =
        entityCacheServerSide.get(entID);
        if (parsedEnt) {
          if (whitelistID != "0") {
            interpreter.executeAsyncCallback(
              callback, ["access denied"], callerNode, callerEnv
            );
          } else {
            // If the entity was found in the cache, and it is a public entity,
            // get an appropriate class-wrapped entity, and call callback on
            // that.
            interpreter.executeAsyncCallback(
              callback, [
                getEntity(entType, parsedEnt, creatorID, isEditable)
              ],
              callerNode, callerEnv
            );
          }
          return;
        }

        // Else fetch and parse the entity from the database.
        MainDBInterface.selectEntity(entID).then(res => {
          let [entType, defStr, creatorID, isEditable, whitelistID] = res;
          if (whitelistID != "0") {
            interpreter.executeAsyncCallback(
              callback, ["access denied"], callerNode, callerEnv
            );
          } else {
            // If the entity was gotten successfully, first parse it.
            let parsedEnt = getParsedEntity(entType, defStr);

            // Also make sure to cache the parsed entity.
            entityCacheServerSide.set(entID, parsedEnt);

            // Then get call the callback on an appropriate class-wrapped
            // entity.
            interpreter.executeAsyncCallback(
              callback, [
                getEntity(entType, parsedEnt, creatorID, isEditable)
              ],
              callerNode, callerEnv
            );
          }
        });
      })
    }

  }
);






export const selectPrivateEntity = new DeveloperFunction(
  ["10", "read_prv"],
  function ({callerEnv}, entID, entType) {
    decrCompGas(callerEnv);
    MainDBInterface.selectEntity(entID, maxLen);
  }
);








export function getParsedEntity(entType, defStr) {
  payGas(callerEnv, {comp: getParsingGasCost(defStr)});
  if (entType === "s") {
    let [parsedEnt] = scriptParser.parse(defStr);
    return parsedEnt;
  }
  else if (entType === "e") {
    let [parsedEnt] = scriptParser.parse(defStr, "expression");
    return parsedEnt;
  }
  else if (entType === "f") {
    let [parsedEnt] = formEntParser.parse(defStr);
    return parsedEnt;
  }
}


export function getEntity(
  entType, parsedEnt, entID, creatorID, isEditable, whitelistID
) {
  if (entType === "s") {
    return new ScriptEntity(
      parsedEnt, entID, creatorID, isEditable, whitelistID
    );
  }
  else if (entType === "e") {
    return new ExpressionEntity(
      parsedEnt, entID, creatorID, isEditable, whitelistID
    );
  }
  else if (entType === "f") {
    return new FormalEntity(
      parsedEnt.funEntID, parsedEnt.inputArr, entID, creatorID,
      isEditable, whitelistID
    );
  }
}





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