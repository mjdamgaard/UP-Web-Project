
// Some functions that are useful for fetching the entity ID or path when you
// got the other one (and when you just got the "entity key" in general), as
// well as functions to fetch entity definitions, and such.

import homePath from "./.id.js";
import {post, fetch, upNodeID} from 'query';
import {valueToHex} from 'hex';
import {verifyType} from 'type';
import {substring} from 'string';
import {mapToArray} from 'object';
import {forEach} from 'array';

const membersRelationPath = "/1/1/em1.js;get/members";



export function fetchEntityID(entKey) {
  // If entKey is a path, fetch the entID from ./entIDs.bt.
  if (entKey[0] === "/") {
    return new Promise(resolve => {
      let entPathHex = valueToHex(entKey, "string");
      fetch(homePath + "/entIDs.bt//entry/k/" + entPathHex).then(
        entID => resolve(entID)
      );
    });
  }

  // Else if it is a user key, of the form '@<userID>', fetch the ID of
  // the user entity (assuming that this has been uploaded).
  else if (entKey[0] === "@") {
    let userID = substring(entKey, 1);
    return new Promise(resolve => {
      let entPath = homePath + "/em1.js;call/User/" + upNodeID + "/" + userID;
      let entPathHex = valueToHex(entPath, "string");
      fetch(homePath + "/entIDs.bt//entry/k/" + entPathHex).then(
        entID => resolve(entID)
      );
    });
  }

  // Else if of the form '#<entID>' or '<entID>', return a trivial promise to
  // that entID.
  else {
    return new Promise(resolve => {
      if (entKey[0] === "#") {
        entKey = substring(entKey, 1);
      }
      verifyType(entKey, "hex-string");
      resolve(entKey);
    });
  }
}

export function fetchEntityPath(entKey) {
  // If entKey is a path, just return a trivial promise to the same path.
  if (entKey[0] === "/") {
    return new Promise(resolve => resolve(entKey));
  }

  // Else if the entity key is of the form '@<userID>', generate the
  // path instead of fetching it.
  if (entKey[0] === "@") {
    let userID = substring(entKey, 1);
    return new Promise(resolve => resolve(
      homePath + "/em1.js;call/User/" + upNodeID + "/" + userID
    ));
  }

  // Else expect entKey to be of the form '#<entID>' or just '<entID>', and
  // fetch the path from the entPaths.att table.
  if (entKey[0] === "#") {
    entKey = substring(entKey, 1);
  }
  verifyType(entKey, "hex-string");
  return new Promise(resolve => {
    fetch(homePath + "/entPaths.att//entry/k/" + entKey).then(
      entPath => resolve(entPath)
    );
  });
}



export function fetchEntityDefinition(entKey) {
  return new Promise(resolve => {
    fetchEntityPath(entKey).then(entPath => {
      fetch(entPath).then(entDef => resolve(entDef));
    });
  });
}



export function fetchOrCreateEntityID(entKey) {
  return new Promise((resolve) => {
    fetchEntityID(entKey).then(entID => {
      if (entID) {
        resolve(entID);
      }
      else {
        fetchEntityPath(entKey).then(entPath => {
          postEntity(entPath).then(entID => resolve(entID));
        });
      }
    });
  });
}




export function fetchRelationalPredicatePath(
  objKey, relKey = membersRelationPath
) {
  let objIDProm = fetchEntityID(objKey);
  let relIDProm = fetchEntityID(relKey);
  return new Promise(resolve => {
    Promise.all([
      objIDProm, relIDProm
    ]).then(([objID, relID]) => {
      if (!objID || !relID) {
        resolve(undefined);
      }
      else {
        let qualPath = homePath + "/em1.js;call/RP/" + objID + "/" + relID;
        resolve(qualPath);
      }
    });
  });
}




export function postRelationalPredicate(objKey, relKey = membersRelationPath) {
  let objIDProm = fetchEntityID(objKey);
  let relIDProm = fetchEntityID(relKey);
  return new Promise(resolve => {
    Promise.all([
      objIDProm, relIDProm
    ]).then(([objID, relID]) => {
      if (!objID || !relID) {
        resolve(undefined);
      }
      else {
        let qualPath = homePath + "/em1.js;call/RP/" + objID + "/" + relID;
        post(homePath + "/entities.sm.js//callSMF/postEntity", qualPath).then(
          qualID => resolve(qualID)
        );
      }
    });
  });
}


export function postConstructedEntity(
  modulePath, constructorAlias, argArr
) {
  let entPath = modulePath + ";call/" + constructorAlias;
  forEach(argArr, arg => {
    entPath = entPath + "/" + arg;
  });
  return postEntity(entPath);
}


export function fetchConstructedEntityID(
  modulePath, constructorAlias, argArr
) {
  let entPath = modulePath + ";call/" + constructorAlias;
  forEach(argArr, arg => {
    entPath = entPath + "/" + arg;
  });
  return fetchEntityID(entPath);
}



export function postEntity(moduleOrEntPath, alias = undefined) {
  let entPath = alias ? moduleOrEntPath + ";get/" + alias : moduleOrEntPath;
  return new Promise(resolve => {
    fetch(entPath).then(entDef => {
      if (!entDef || !entDef.Class) {
        resolve(false);
      }
      else {
        post(homePath + "/entities.sm.js//callSMF/postEntity", entPath).then(
          entID => resolve(entID)
        );
      }
    });
  });
}


export function postAllEntitiesFromModule(modulePath) {
  return new Promise(resolve => {
    import(modulePath).then(entityModule => {
      // Post all the entities simultaneously, then wait for all these post
      // requests before resolving.
      let postPromArr = mapToArray(entityModule, (val, alias) => {
        if (val.Class !== undefined) {
          return postEntity(modulePath, alias);
        }
        else {
          return new Promise(res => res());
        }
      });
      Promise.all(postPromArr).then(() => resolve(true));
    });
  });
}


