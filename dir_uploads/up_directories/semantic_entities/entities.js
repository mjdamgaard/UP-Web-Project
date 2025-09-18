
// Some functions that are useful for fetching the entity ID or path when you
// got the other one (and when you just got the "entity key" in general), as
// well as functions to fetch entity definitions, and such.

import homePath from "./.id.js";
import {post, fetch, upNodeID} from 'query';
import {valueToHex} from 'hex';
import {verifyType} from 'type';
import {substring} from 'string';
import {mapToArray} from 'object';
import {map, forEach} from 'array';




export function fetchEntityID(entKey) {
  // If entKey is a path, fetch the entID from ./entIDs.bt.
  if (entKey[0] === "/") {
    return new Promise(resolve => {
      let entPathHex = valueToHex(entKey, "string");
      fetch(homePath + "/entIDs.bt/entry/k=" + entPathHex).then(
        entID => resolve(entID)
      );
    });
  }

  // Else if it is a user key, of the form '@<userID>', fetch the ID of
  // the user entity (assuming that this has been uploaded).
  else if (entKey[0] === "@") {
    return new Promise(resolve => {
      let entPath = homePath + "/em1.js;call/User/" + userID + "/" + upNodeID;
      let entPathHex = valueToHex(entPath, "string");
      fetch(homePath + "/entIDs.bt/entry/k=" + entPathHex).then(
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
      homePath + "/em1.js;call/User/" + userID + "/" + upNodeID
    ));
  }

  // Else expect entKey to be of the form '#<entID>' or just '<entID>', and
  // fetch the path from the entPaths.att table.
  if (entKey[0] === "#") {
    entKey = substring(entKey, 1);
  }
  verifyType(entKey, "hex-string");
  return new Promise(resolve => {
    fetch(homePath + "/entPaths.att/entry/k=" + entKey).then(
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





export function fetchRelevancyQualityPath(classOrObjKey, relKey = undefined) {
  let classOrObjIDProm = fetchEntityID(classOrObjKey);
  let relIDProm = relKey ? fetchEntityID(relKey) :
    new Promise(res => res(undefined));
  return new Promise(resolve => {
    Promise.all([
      classOrObjIDProm, relIDProm
    ]).then(([classOrObjID, relID]) => {
      if (!classOrObjID || relKey && !relID) {
        resolve(undefined);
      }
      else {
        let qualPath = homePath + "/em1.js;call/RelevancyQuality/" +
          classOrObjID + (relID ? "/" + relID : "");
        resolve(qualPath);
      }
    });
  });
}




export function postRelevancyQuality(classOrObjKey, relKey = undefined) {
  let classOrObjIDProm = fetchEntityID(classOrObjKey);
  let relIDProm = relKey ? fetchEntityID(relKey) : new Promise(res => res());
  return new Promise(resolve => {
    Promise.all([
      classOrObjIDProm, relIDProm
    ]).then(([classOrObjID, relID]) => {
      let entPath = homePath + "/em1.js;call/RelevancyQuality/" +
        classOrObjID + (relID ? "/" + relID : "");
      post(homePath + "/entities.sm.js/callSMF/postEntity", entPath).then(
        entID => resolve(entID)
      );
    });
  });
}


export function postConstructedEntity(
  modulePath, constructorAlias, argEntKeyArr = []
) {
  let entIDPromArr = map(argEntKeyArr, entKey => fetchEntityID(entKey));
  let relIDProm = relKey ? fetchEntityID(relKey) : new Promise(res => res());
  return new Promise(resolve => {
    Promise.all(entIDPromArr).then(entIDArr => {
      let entPath = modulePath + ";call/" + constructorAlias;
      forEach(entIDArr, entID => {
        entPath = entPath + "/" + entID;
      });
      post(homePath + "/entities.sm.js/callSMF/postEntity", entPath).then(
        entID => resolve(entID)
      );
    });
  });
}



export function postEntity(modulePath, alias) {
  let entPath = modulePath + ";get/" + alias;
  return post(homePath + "/entities.sm.js/callSMF/postEntity", entPath);
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


