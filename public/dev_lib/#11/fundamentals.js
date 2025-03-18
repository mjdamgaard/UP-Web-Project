
import {
  DeveloperFunction, decrCompGas, decrGas, payGas, RuntimeError,
  getParsingGasCost, EntityReference, ScriptEntity, ExpressionEntity,
  FormalEntity,
} from "../../../src/interpreting/ScriptInterpreter.js";

// Following module paths are substituted by module mapping webpack plugin.
import {entityCache} from "entityCache";
import * as io from "io";




export function _selectEntity(
  {callerNode, callerEnv, interpreter}, entRef, callback
) {
  decrCompGas(callerNode, callerEnv);

  if (!(entRef instanceof EntityReference)) throw new RuntimeError(
    "selectEntity(): entRef has to be an EntityReference instance",
    callerNode, callerEnv
  );
  let entID = entRef.id;

  // Try to get the entity from the entity cache.
  let [
    parsedEnt, entType, creatorID, isEditable, whitelistID
  ] = entityCache.get(entID);
  if (parsedEnt) {
    if (whitelistID != "0") {
      interpreter.executeAsyncCallback(
        callback, ["access denied"], callerNode, callerEnv
      );
    }
    else {
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
  else {
    decrGas(callerNode, callerEnv, "fetch");

    io.selectEntity(entID).then(res => {
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
  }
}


export const selectEntity = new DeveloperFunction(
  "10", "read", _selectEntity
);






export function _selectPrivateEntity(
  {callerNode, callerEnv, interpreter}, entRef, callback
) {
  decrCompGas(callerNode, callerEnv);
  let {gas, reqUserID} = callerEnv.scriptGlobals;

  if (!(entRef instanceof EntityReference)) throw new RuntimeError(
    "selectEntity(): entRef has to be an EntityReference instance",
    callerNode, callerEnv
  );
  let entID = entRef.id;

  // Try to get the entity from the entity cache.
  let [
    parsedEnt, entType, creatorID, isEditable, whitelistID
  ] = entityCache.get(entID);
  if (parsedEnt) {
    if (whitelistID != "0") {
      if (whitelistID == reqUserID) {
        interpreter.executeAsyncCallback(
          callback, [
            getEntity(entType, parsedEnt, creatorID, isEditable, whitelistID)
          ],
          callerNode, callerEnv
        );
      }
      else {
        selectPrivateEntity(
          {callerNode, callerEnv, interpreter},
          new EntityReference(whitelistID),
          // TODO: Replace this with a.. DefinedFunction.. Hm..
          ([whitelistScriptEnt]) => {
            interpreter.interpretScript(
              gas, undefined, whitelistScriptEnt.id,
              [new EntityReference(reqUserID)]
            )
            .then(([output, log]) => {
              // ...
            })
            .catch((err) => {
              // ...
            });
          }, 
        );
      }
    }
    else {
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
  else {
    decrGas(callerNode, callerEnv, "fetch");

    io.selectEntity(entID).then(res => {
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
  }
}

export const selectPrivateEntity = new DeveloperFunction(
  "10", "read_prv", _selectPrivateEntity
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