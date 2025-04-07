
// import {
//   DeveloperFunction, decrCompGas, decrGas, payGas, RuntimeError,
//   getParsingGasCost, EntityReference, ScriptEntity, ExpressionEntity,
//   FormalEntity, throwExceptionAsyncOrNot,
// } from "../interpreting/ScriptInterpreter.js";

// // Following module paths are substituted by module mapping webpack plugin.
// import {entityCache} from "entityCache";
// import * as io from "io";



export function executeUserOrJSCallback(
  callback, res, callerNode, callerEnv, interpreter
) {
  if (callback instanceof Function) {
    callback(res);
  }
  else {
    interpreter.executeAsyncCallback(callback, [res], callerNode, callerEnv);
  }
}



// export function getOrFetchEntity(entID, callback) {
//   decrCompGas(callerNode, callerEnv);

//   // Try to get the entity from the entity cache.
//   let [
//     parsedEnt, entType, creatorID, isEditable, whitelistID
//   ] = entityCache.get(entID);
//   if (parsedEnt) {
//     callback(parsedEnt, entType, creatorID, isEditable, whitelistID);
//     return;
//   }

//   // Else fetch and parse the entity from the database.
//   else {
//     decrGas(callerNode, callerEnv, "fetch");

//     io.fetchEntity(entID).then(res => {
//       let [entType, defStr, creatorID, isEditable, whitelistID] = res;
//       if (!entType) {
//         callback("missing entity");
//       }

//       // If the entity was gotten successfully, first parse it, and also make
//       // sure to cache the parsed entity.
//       let parsedEnt = getParsedEntity(entType, defStr);
//       entityCacheServerSide.set(entID, parsedEnt);

//       callback(parsedEnt, entType, creatorID, isEditable, whitelistID);
//     });
//   }
// }





// export function _fetchEntity(
//   {callerNode, callerEnv, interpreter}, entID, callback
// ) {
//   getOrFetchEntity(
//     entID,
//     (parsedEnt, entType, creatorID, isEditable, whitelistID) => {
//       if (parsedEnt === "missing entity") {
//         executeUserOrJSCallback(
//           callback, "missing entity", callerNode, callerEnv, interpreter
//         );
//         return;
//       }

//       if (whitelistID != "0") {
//         executeUserOrJSCallback(
//           callback, "access denied", callerNode, callerEnv, interpreter
//         );
//       }
//       else {
//         let ent = getEntity(entType, parsedEnt, creatorID, isEditable);
//         executeUserOrJSCallback(
//           callback, ent, callerNode, callerEnv, interpreter
//         );
//       }
//     },
//   );
// }


// export const fetchEntity = new DeveloperFunction(
//   "10", "read",
//   ({callerNode, callerEnv, interpreter}, entRef, callback) => {
//     if (!(entRef instanceof EntityReference)) throw new RuntimeError(
//       "fetchEntity(): entRef is not an EntityReference instance",
//       callerNode, callerEnv
//   );
//     let entID = entRef.id;

//     _fetchEntity({callerNode, callerEnv, interpreter}, entID, callback);
//   }
// );





// export function _fetchEntityAsUser(
//   {callerNode, callerEnv, interpreter}, entID, callback
// ) {
//   decrCompGas(callerNode, callerEnv);

//   getOrFetchEntity(
//     entID,
//     (parsedEnt, entType, creatorID, isEditable, whitelistID) => {
//       if (parsedEnt === "missing entity") {
//         executeUserOrJSCallback(
//           callback, "missing entity", callerNode, callerEnv, interpreter
//         );
//         return;
//       }

//       let ent = getEntity(
//         entType, parsedEnt, creatorID, isEditable, whitelistID
//       );
//       let {gas, reqUserID} = callerEnv.scriptGlobals;
//       checkIfUserIsWhitelisted(
//         whitelistID, callerNode, callerEnv, interpreter, gas, reqUserID,
//         (output) => {
//           if (output) {
//             executeUserOrJSCallback(
//               callback, ent, callerNode, callerEnv, interpreter
//             );
//           } else {
//             executeUserOrJSCallback(
//               callback, "access denied", callerNode, callerEnv, interpreter
//             );
//           }
//         },
//         (err) => {
//           interpreter.throwAsyncException(err, callerNode, callerEnv);
//         },
//       );
//     },
//   );
// }

// export const fetchEntityAsUser = new DeveloperFunction(
//   "10", "read",
//   ({callerNode, callerEnv, interpreter, isAsync}, entRef, callback) => {
//     if (!(entRef instanceof EntityReference)) throw new RuntimeError(
//       "fetchEntityAsUser(): entRef is not an EntityReference instance",
//       callerNode, callerEnv
//   );
//     let entID = entRef.id;

//     _fetchEntityAsUser({callerNode, callerEnv, interpreter}, entID, callback);
//   }
// );




// export function checkIfUserIsWhitelisted(
//   whitelistID, callerNode, callerEnv, interpreter, gas, userID,
//   resolve, reject
// ) {
//   if (whitelistID == "0" || whitelistID == userID) {
//     resolve(true);
//   }
//   else if (whitelistID == userID) {
//     resolve(true);
//   }
//   else {
//     _fetchEntityAsUser(
//       {callerNode, callerEnv, interpreter},
//       whitelistID,
//       ([whitelistScriptEnt]) => {
//         interpreter.interpretScript(
//           gas, undefined, whitelistScriptEnt.id,
//           [new EntityReference(userID)]
//         )
//         .then(([output]) => {
//           resolve(output ? true : false);
//         })
//         .catch((err) => {
//           reject(err)
//         });
//       }, 
//     );
//   }
// }


// export const isWhitelisted = new DeveloperFunction(
//   "10", "read",
//   ({callerNode, callerEnv, interpreter}, userRef, whitelistRef, callback) => {
//     decrCompGas(callerNode, callerEnv);

//     if (!(userRef instanceof EntityReference)) throw new RuntimeError(
//       "fetchEntityAsUser(): userRef is not an EntityReference instance",
//       callerNode, callerEnv
//     );
//     let userID = userRef.id;

//     if (!(whitelistRef instanceof EntityReference)) throw new RuntimeError(
//       "fetchEntityAsUser(): whitelistRef is not an EntityReference instance",
//       callerNode, callerEnv
//     );
//     let whitelistID = whitelistRef.id;

//     let {gas} = callerEnv.scriptGlobals;
//     checkIfUserIsWhitelisted(
//       whitelistID, callerNode, callerEnv, interpreter, gas, userID,
//       (output) => {
//         executeUserOrJSCallback(
//           callback, output, callerNode, callerEnv, interpreter
//         );
//       },
//       (err) => {
//         interpreter.throwAsyncException(err, callerNode, callerEnv);
//       },
//     );
//   },
// );






// export function _fetchFormalEntRef(
//   {callerNode, callerEnv, interpreter},
//   funID, inputArr, editorID, whitelistID, callback
// ) {
//   decrCompGas(callerNode, callerEnv);

//   // TODO: Also make a formal entity ID cache at some point, and then query
//   // that first here.

//   _fetchEntity(
//     {callerNode, callerEnv, interpreter}, entID, (ent) => {
//       if (!(ent instanceof ExpressionEntity)) {
//         executeUserOrJSCallback(
//           callback, "invalid function", callerNode, callerEnv, interpreter
//         );
//       }
//       else {
//         let defStr = getFormalEntityDefStr(funID, inputArr);
//         io.fetchFormalEntityID(defStr, editorID, whitelistID).then(entID => {
//           if (!entID) {
//             executeUserOrJSCallback(
//               callback, "missing entity", callerNode, callerEnv, interpreter
//             );
//           }
//           else {
//             let entRef = new EntityReference(entID);
//             executeUserOrJSCallback(
//               callback, entRef, callerNode, callerEnv, interpreter
//             );
//           }
//         });
//       }
//     }
//   )
// }


// export const fetchFormalEntRef = new DeveloperFunction(
//   "10", "read",
//   (
//     {callerNode, callerEnv, interpreter}, funRef, inputArr, editorRef,
//     whitelistRef, callback
//   ) => {
//     if (callback === undefined) {
//       callback = whitelistRef;
//       whitelistRef = editorRef ?? new EntityReference("0");
//     }
//     if (callback === undefined) {
//       callback = editorRef;
//       editorRef = new EntityReference("0");
//     }

//     if (!(funRef instanceof EntityReference)) throw new RuntimeError(
//       "fetchFormalEntityMatch(): funRef is not an EntityReference instance",
//       callerNode, callerEnv
//     );
//     let funID = funRef.id;

//     if (!(
//       inputArr instanceof Array ||
//       inputArr instanceof Immutable && inputArr.val instanceof Array
//     )) throw new RuntimeError(
//       "fetchFormalEntityMatch(): inputArr is not an array",
//       callerNode, callerEnv
//     );

//     if (!(editorRef instanceof EntityReference)) new RuntimeError(
//       "fetchFormalEntityMatch(): editorRef is not an EntityReference instance",
//       callerNode, callerEnv
//     );
//     let editorID = editorRef.id;

//     if (!(whitelistRef instanceof EntityReference)) new RuntimeError(
//       "fetchFormalEntityMatch(): whitelistRef is not an EntityReference " +
//       "instance",
//       callerNode, callerEnv
//     );
//     let whitelistID = whitelistRef.id;

//     _fetchFormalEntity(
//       {callerNode, callerEnv, interpreter}, funID, inputArr, editorID,
//       whitelistID, callback
//     );
//   }
// );




// export function _insertFormalEntity(
//   {callerNode, callerEnv, interpreter}, funRef, inputArr, isAnonymous,
//   isEditable, whitelistID, callback
// ) {
//   let defStr = getFormalEntityDefStr(funRef.id, inputArr);
//   io.insertFormalEntity(defStr, isAnonymous, isEditable, whitelistID).then(
//     (outID, exitCode) => {
//       if (exitCode == "0") {
//         let entRef = new EntityReference(outID);
//         executeUserOrJSCallback(
//           callback, entRef, callerNode, callerEnv, interpreter
//         );
//       }
//       else {
//         // TODO ...
//       }
//     }
//   );
// }


// export const insertFormalEntity = new DeveloperFunction(
//   "10", "read",
//   (
//     {callerNode, callerEnv, interpreter}, funRef, inputArr, editorRef,
//     whitelistRef, callback
//   ) => {
//     if (callback === undefined) {
//       callback = whitelistRef;
//       whitelistRef = editorRef ?? new EntityReference("0");
//     }
//     if (callback === undefined) {
//       callback = editorRef;
//       editorRef = new EntityReference("0");
//     }

//     if (!(funRef instanceof EntityReference)) throw new RuntimeError(
//       "fetchFormalEntityMatch(): funRef is not an EntityReference instance",
//       callerNode, callerEnv
//     );
//     let funID = funRef.id;

//     if (!(
//       inputArr instanceof Array ||
//       inputArr instanceof Immutable && inputArr.val instanceof Array
//     )) throw new RuntimeError(
//       "fetchFormalEntityMatch(): inputArr is not an array",
//       callerNode, callerEnv
//     );

//     if (!(editorRef instanceof EntityReference)) new RuntimeError(
//       "fetchFormalEntityMatch(): editorRef is not an EntityReference instance",
//       callerNode, callerEnv
//     );
//     let editorID = editorRef.id;

//     if (!(whitelistRef instanceof EntityReference)) new RuntimeError(
//       "fetchFormalEntityMatch(): whitelistRef is not an EntityReference instance",
//       callerNode, callerEnv
//     );
//     let whitelistID = whitelistRef.id;

//     _insertFormalEntity(
//       {callerNode, callerEnv, interpreter}, funID, inputArr, editorID,
//       whitelistID, callback
//     );
//   }
// );






// function getFormalEntityDefStr(funID, inputArr) {
//   // TODO: Implement. And make sure to handle the fact that inputArr, and/or
//   // nested elements of it might be wrapped in Immutable().

// }





// export function getParsedEntity(entType, defStr) {
//   // First parse the entity definition string.
//   payGas(callerEnv, {comp: getParsingGasCost(defStr)});
//   let parsedEnt;
//   if (entType === "s") {
//     [parsedEnt] = scriptParser.parse(defStr);
//   }
//   else if (entType === "e") {
//     [parsedEnt] = scriptParser.parse(defStr, "expression");
//   }
//   else if (entType === "f") {
//     [parsedEnt] = formEntParser.parse(defStr);
//   }
//   else if (entType === "u") {
//     // TODO: Implement.
//     throw "getParsedEntity(): 'u' not implemented yet";
//   }
//   else {
//     throw `getParsedEntity(): Unrecognized entType: '${entType}'`
//   }

//   // Then swap parsedEnt for its result (res) property, only if it was parsed
//   // successfully. 
//   if (!parsedEnt.error) {
//     parsedEnt = parsedEnt.res;
//   }
//   return parsedEnt;
// }


// export function getEntity(
//   entType, parsedEnt, entID, creatorID, isEditable, whitelistID
// ) {
//   if (entType === "s") {
//     return new ScriptEntity(
//       parsedEnt, entID, creatorID, isEditable, whitelistID
//     );
//   }
//   else if (entType === "e") {
//     return new ExpressionEntity(
//       parsedEnt, entID, creatorID, isEditable, whitelistID
//     );
//   }
//   else if (entType === "f") {
//     return new FormalEntity(
//       parsedEnt.funEntID, parsedEnt.inputArr, entID, creatorID,
//       isEditable, whitelistID
//     );
//   }
// }






