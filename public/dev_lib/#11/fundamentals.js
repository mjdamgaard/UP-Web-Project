
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



export function getOrFetchEntity(entID, callback) {
  decrCompGas(callerNode, callerEnv);

  // Try to get the entity from the entity cache.
  let [
    parsedEnt, entType, creatorID, isEditable, whitelistID
  ] = entityCache.get(entID);
  if (parsedEnt) {
    callback(parsedEnt, entType, creatorID, isEditable, whitelistID);
    return;
  }

  // Else fetch and parse the entity from the database.
  else {
    decrGas(callerNode, callerEnv, "fetch");

    io.fetchEntity(entID).then(res => {
      let [entType, defStr, creatorID, isEditable, whitelistID] = res;
      if (!entType) {
        callback("missing entity");
      }

      // If the entity was gotten successfully, first parse it, and also make
      // sure to cache the parsed entity.
      let parsedEnt = getParsedEntity(entType, defStr);
      entityCacheServerSide.set(entID, parsedEnt);

      callback(parsedEnt, entType, creatorID, isEditable, whitelistID);
    });
  }
}





export function _fetchEntity(
  {callerNode, callerEnv, interpreter, isAsync}, entRef, callback
) {

  if (!(entRef instanceof EntityReference)) {
    let err = new RuntimeError(
      "fetchEntity(): entRef is not an EntityReference instance",
      callerNode, callerEnv
    );
    throwExceptionAsyncOrNot(err, node, environment, isAsync);
  }
  let entID = entRef.id;

  getOrFetchEntity(
    entID,
    (parsedEnt, entType, creatorID, isEditable, whitelistID) => {
      if (parsedEnt === "missing entity") {
        executeUserOrJSCallback(
          callback, "missing entity", callerNode, callerEnv, interpreter
        );
        return;
      }

      if (whitelistID != "0") {
        executeUserOrJSCallback(
          callback, "access denied", callerNode, callerEnv, interpreter
        );
      }
      else {
        let ent = getEntity(entType, parsedEnt, creatorID, isEditable);
        executeUserOrJSCallback(
          callback, ent, callerNode, callerEnv, interpreter
        );
      }
    },
  );
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
      "fetchEntityAsUser(): entRef is not an EntityReference instance",
      callerNode, callerEnv
    );
    throwExceptionAsyncOrNot(err, node, environment, isAsync);
  }
  let entID = entRef.id;


  getOrFetchEntity(
    entID,
    (parsedEnt, entType, creatorID, isEditable, whitelistID) => {
      if (parsedEnt === "missing entity") {
        executeUserOrJSCallback(
          callback, "missing entity", callerNode, callerEnv, interpreter
        );
        return;
      }

      let ent = getEntity(
        entType, parsedEnt, creatorID, isEditable, whitelistID
      );
      let {gas, reqUserID} = callerEnv.scriptGlobals;
      checkIfUserIsWhitelisted(
        whitelistID, callerNode, callerEnv, interpreter, gas, reqUserID,
        (output) => {
          if (output) {
            executeUserOrJSCallback(
              callback, ent, callerNode, callerEnv, interpreter
            );
          } else {
            executeUserOrJSCallback(
              callback, "access denied", callerNode, callerEnv, interpreter
            );
          }
        },
        (err) => {
          interpreter.throwAsyncException(err, callerNode, callerEnv);
        },
      );
    },
  );
}

export const fetchFormalEntityMatch = new DeveloperFunction(
  "10", "read", _fetchFormalEntityMatch
);




export function checkIfUserIsWhitelisted(
  whitelistID, callerNode, callerEnv, interpreter, gas, userID,
  resolve, reject
) {
  if (whitelistID == "0" || whitelistID == userID) {
    resolve(true);
  }
  else if (whitelistID == userID) {
    resolve(true);
  }
  else {
    _fetchEntityAsUser(
      {callerNode, callerEnv, interpreter},
      new EntityReference(whitelistID),
      ([whitelistScriptEnt]) => {
        interpreter.interpretScript(
          gas, undefined, whitelistScriptEnt.id,
          [new EntityReference(userID)]
        )
        .then(([output]) => {
          resolve(output);
        })
        .catch((err) => {
          reject(err)
        });
      }, 
    );
  }
}


export const isWhitelisted = new DeveloperFunction(
  "10", "read",
  ({callerNode, callerEnv, interpreter}, userRef, whitelistRef, callback) => {
    decrCompGas(callerNode, callerEnv);

    if (!(userRef instanceof EntityReference)) {
      let err = new RuntimeError(
        "fetchEntityAsUser(): userRef is not an EntityReference instance",
        callerNode, callerEnv
      );
      throwExceptionAsyncOrNot(err, node, environment, isAsync);
    }
    let userID = userRef.id;

    if (!(whitelistRef instanceof EntityReference)) {
      let err = new RuntimeError(
        "fetchEntityAsUser(): whitelistRef is not an EntityReference instance",
        callerNode, callerEnv
      );
      throwExceptionAsyncOrNot(err, node, environment, isAsync);
    }
    let whitelistID = whitelistRef?.id;

    let {gas} = callerEnv.scriptGlobals;
    checkIfUserIsWhitelisted(
      whitelistID, callerNode, callerEnv, interpreter, gas, userID,
      (output) => {
        executeUserOrJSCallback(
          callback, output, callerNode, callerEnv, interpreter
        );
      },
      (err) => {
        interpreter.throwAsyncException(err, callerNode, callerEnv);
      },
    );
  },
);






export function fetchFormalEntity(
  {callerNode, callerEnv, interpreter, isAsync},
  funEntRef, inputArr, whitelistID, callback
) {
  if (callback === undefined) {
    callback = whitelistID;
    whitelistID = "0";
  }
  decrCompGas(callerNode, callerEnv);

  if (!(funEntRef instanceof EntityReference)) {
    let err = new RuntimeError(
      "fetchFormalEntityMatch(): funEntRef is not an EntityReference instance",
      callerNode, callerEnv
    );
    throwExceptionAsyncOrNot(err, node, environment, isAsync);
  }
  if (!(inputArr instanceof Array)) {
    let err = new RuntimeError(
      "fetchFormalEntityMatch(): inputArr is not an array",
      callerNode, callerEnv
    );
    throwExceptionAsyncOrNot(err, node, environment, isAsync);
  }
  let funEntID = funEntRef.id;

  // ...
}

export const fetchEntityAsUser = new DeveloperFunction(
  "10", "read_prv", _fetchEntityAsUser
);









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


