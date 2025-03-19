
import {
  DeveloperFunction, decrCompGas, decrGas, payGas, RuntimeError,
  getParsingGasCost, EntityReference, ScriptEntity, ExpressionEntity,
  FormalEntity, throwExceptionAsyncOrNot,
} from "../../../src/interpreting/ScriptInterpreter.js";

// Following module paths are substituted by module mapping webpack plugin.
import {entityCache} from "entityCache";
import * as io from "io";


export function executeUserOrJSCallback(
  callback, res, callerNode, callerEnv, interpreter
) {
  if (callback instanceof Function) {
    callback(res);
  }
  else {
    interpreter.executeAsyncCallback( callback, [res], callerNode, callerEnv);
  }
}




export function _fetchEntity(
  {callerNode, callerEnv, interpreter, isAsync}, entRef, callback
) {
  decrCompGas(callerNode, callerEnv);

  if (!(entRef instanceof EntityReference)) {
    let err = new RuntimeError(
      "fetchEntity(): entRef has to be an EntityReference instance",
      callerNode, callerEnv
    );
    throwExceptionAsyncOrNot(err, node, environment, isAsync);
  }
  let entID = entRef.id;

  // Try to get the entity from the entity cache.
  let [
    parsedEnt, entType, creatorID, isEditable, whitelistID
  ] = entityCache.get(entID);
  if (parsedEnt) {
    if (whitelistID != "0") {
      executeUserOrJSCallback(
        callback, ["access denied"], callerNode, callerEnv, interpreter
      );
    }
    else {
      // If the entity was found in the cache, and it is a public entity,
      // get an appropriate class-wrapped entity, and call callback on
      // that.
      let ent = getEntity(entType, parsedEnt, creatorID, isEditable);
      executeUserOrJSCallback(
        callback, ent, callerNode, callerEnv, interpreter
      );
    }
    return;
  }

  // Else fetch and parse the entity from the database.
  else {
    decrGas(callerNode, callerEnv, "fetch");

    io.fetchEntity(entID).then(res => {
      let [entType, defStr, creatorID, isEditable, whitelistID] = res;
      if (!entType) {
        executeUserOrJSCallback(
          callback, ["missing entity"], callerNode, callerEnv, interpreter
        );
        return;
      }

      // If the entity was gotten successfully, first parse it.
      let parsedEnt = getParsedEntity(entType, defStr);

      // Also make sure to cache the parsed entity.
      entityCacheServerSide.set(entID, parsedEnt);

      if (whitelistID != "0") {
        executeUserOrJSCallback(
          callback, ["access denied"], callerNode, callerEnv, interpreter
        );
      } else {
        // Then get call the callback on an appropriate class-wrapped
        // entity.
        let ent = getEntity(entType, parsedEnt, creatorID, isEditable);
        executeUserOrJSCallback(
          callback, ent, callerNode, callerEnv, interpreter
        );
      }
    });
  }
}


export const fetchEntity = new DeveloperFunction(
  "10", "read", _fetchEntity
);





export function _fetchEntityAsUser(
  {callerNode, callerEnv, interpreter, isAsync}, entRef, callback
) {
  decrCompGas(callerNode, callerEnv);

  if (!(entRef instanceof EntityReference)) {
    let err = new RuntimeError(
      "fetchEntity(): entRef has to be an EntityReference instance",
      callerNode, callerEnv
    );
    throwExceptionAsyncOrNot(err, node, environment, isAsync);
  }
  let entID = entRef.id;

  // Try to get the entity from the entity cache.
  let [
    parsedEnt, entType, creatorID, isEditable, whitelistID
  ] = entityCache.get(entID);
  if (parsedEnt) {
    let ent = getEntity(
      entType, parsedEnt, creatorID, isEditable, whitelistID
    );
    if (whitelistID != "0") {
      let {gas, reqUserID} = callerEnv.scriptGlobals;
      checkWhitelistThenResolve(
        whitelistID, callerNode, callerEnv, interpreter, gas, reqUserID,
        ent, callback
      );
    }
    else {
      executeUserOrJSCallback(
        callback, ent, callerNode, callerEnv, interpreter
      );
    }
    return;
  }

  // Else fetch and parse the entity from the database.
  else {
    decrGas(callerNode, callerEnv, "fetch");

    io.fetchEntity(entID).then(res => {
      let [entType, defStr, creatorID, isEditable, whitelistID] = res;
      if (!entType) {
        executeUserOrJSCallback(
          callback, ["missing entity"], callerNode, callerEnv, interpreter
        );
        return;
      }

      // If the entity was gotten successfully, first parse it.
      let parsedEnt = getParsedEntity(entType, defStr);
      let ent = getEntity(
        entType, parsedEnt, creatorID, isEditable, whitelistID
      );

      // Also make sure to cache the parsed entity.
      entityCacheServerSide.set(entID, parsedEnt);

      if (whitelistID != "0") {
        let {gas, reqUserID} = callerEnv.scriptGlobals;
        checkWhitelistThenResolve(
          whitelistID, callerNode, callerEnv, interpreter, gas, reqUserID,
          ent, callback
        );
      } else {
        executeUserOrJSCallback(
          callback, ent, callerNode, callerEnv, interpreter
        );
      }
    });
  }
}






export function checkWhitelistThenResolve(
  whitelistID, callerNode, callerEnv, interpreter, gas, reqUserID,
  res, callback
) {
  if (whitelistID == reqUserID) {
    executeUserOrJSCallback(
      callback, ent, callerNode, callerEnv, interpreter
    );
  }
  else {
    _fetchEntityAsUser(
      {callerNode, callerEnv, interpreter},
      new EntityReference(whitelistID),
      ([whitelistScriptEnt]) => {
        interpreter.interpretScript(
          gas, undefined, whitelistScriptEnt.id,
          [new EntityReference(reqUserID)]
        )
        .then(([output]) => {
          if (output){
            executeUserOrJSCallback(
              callback, res, callerNode, callerEnv, interpreter
            );
          }
        })
        .catch((err) => {
          interpreter.throwAsyncException(err, callerNode, callerEnv);
        });
      }, 
    );
  }
}



export function getParsedEntity(entType, defStr) {
  // First parse the entity definition string.
  payGas(callerEnv, {comp: getParsingGasCost(defStr)});
  let parsedEnt;
  if (entType === "s") {
    [parsedEnt] = scriptParser.parse(defStr);
  }
  else if (entType === "e") {
    [parsedEnt] = scriptParser.parse(defStr, "expression");
  }
  else if (entType === "f") {
    [parsedEnt] = formEntParser.parse(defStr);
  }

  // Then swap parsedEnt for its result (res) property, only if it was parsed
  // successfully. 
  if (!parsedEnt.error) {
    parsedEnt = parsedEnt.res;
  }
  return parsedEnt;
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