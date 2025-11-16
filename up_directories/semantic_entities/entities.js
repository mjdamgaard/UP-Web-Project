
// Some functions that are useful for fetching the entity ID or path when you
// got the other one (and when you just got the "entity key" in general), as
// well as functions to fetch entity definitions, and such.

import homePath from "./.id.js";
import {post, fetch} from 'query';
import {valueToHex} from 'hex';
import {verifyType, hasType} from 'type';
import {toUpperCase} from 'string';
import {mapToArray} from 'object';
import {forEach, map} from 'array';

const membersRelationPath = "/1/1/em1.js;get/members";



export function fetchEntityID(entKey) {
  // If entKey is a path, fetch the entID from ./entIDs.bt.
  if (entKey[0] === "/") {
    return new Promise(resolve => {
      let entPathHex = valueToHex(entKey, "string");
      fetch(homePath + "/entIDs.bt./entry/k/" + entPathHex).then(
        entID => resolve(entID)
      );
    });
  }

  // Else if of the form '<entID>', return a trivial promise to that entID.
  else {
    verifyType(entKey, "hex-string");
    return new Promise(resolve => resolve(entKey));
  }
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


export function fetchEntityPath(entKey) {
  // If entKey is a path, just return a trivial promise to the same path.
  if (entKey[0] === "/") {
    return new Promise(resolve => resolve(entKey));
  }

  // Else expect entKey to be of the form '<entID>', and fetch the path from
  // the entPaths.att table.
  else {
    verifyType(entKey, "hex-string");
    return new Promise(resolve => {
      fetch(homePath + "/entPaths.att./entry/k/" + entKey).then(
        entPath => resolve(entPath)
      );
    });
  }
}



export function getUserEntPath(upNodeID, userID) {
  return homePath + "/em1.js;call/User/" + upNodeID + "/" + userID;
}



// fetch(entKey, attrArr) fetches the given entity's definition object, and if
// attrArr is defined and contains any property names (in the form of strings),
// these attributes will be fetched via fetchAttribute(), which will
// automatically substitute any function-valued attribute with its result
// (either returned directly from the function, or being the result of a
// returned promise).
// In a future implementation of fetchEntityDefinition(), the third 'useScores'
// argument can also be used to signal that the function should search for
// the corresponding "scored attributes," as we call them, to see if such can
// be found, and with a high enough score (and weight) to merit overriding the
// defining attribute.
export function fetchEntityDefinition(
  entKey, attrArr = undefined, useScores = false
) {
  // useScores is not implemented yet, meaning that so far, the properties of
  // the returned entity definition will always come from the attributes
  // themselves, and not from so-called 'scored properties' (yet).
  useScores = useScores;

  return new Promise(resolve => {
    fetchEntityPath(entKey).then(entPath => {
      fetch(entPath).then(entDef => {
        // If attrArr is falsy, just resolve with the entDef as is.
        if (!attrArr) return resolve(entDef);

        // And if attrArr is equal to true, treat it as being...
        // TODO: Treat cases where attrArr === true.

        let attributePromiseArr = map(
          attrArr, attrName => substituteIfFunction(entDef[attrName])
        );
        Promise.all(attributePromiseArr).then(subbedAttrArr => {
          let partialSubbedEntDef = new MutableObject();
          forEach(subbedAttrArr, (subbedAttr, ind) => {
            partialSubbedEntDef[attrArr[ind]] = subbedAttr;
          });
          let subbedEntDef = {...entDef, ...partialSubbedEntDef};
          resolve(subbedEntDef);
        });
      });
    });
  });
}



export function substituteIfFunction(attrValue) {
  return new Promise(resolve => {
    substituteIfFunctionHelper(attrValue, resolve);
  });
}

export function substituteIfFunctionHelper(attrValue, resolve) {
  // If attrValue is a function, call it to get its return value, and then call
  // this function recursively on that return value.
  if (hasType(attrValue, "function")) {
    substituteIfFunctionHelper(attrValue(), resolve);
  }

  // Else if it is a promise, wait for the result of that promise, and call
  // this function recursively on that result.
  else if (hasType(attrValue, "Promise")) {
    attrValue.then(result => substituteIfFunctionHelper(result, resolve));
  }

  // Else if it is neither of those, resolve with the value as it is.
  else {
    resolve(attrValue);
  }
}



// fetchAttribute() is similar to fetchEntityDefinition(), except it only
// fetches and substitutes one attribute in particular, and only resolves to
// that attribute's value in particular, rather than the full entDef.
export function fetchAttribute(
  entKey, attrName, useScores = false
) {
  return new Promise(resolve => {
    fetchEntityDefinition(entKey, [attrName], useScores).then(
      subbedEntDef => resolve(subbedEntDef[attrName])
    );
  });
}











export function fetchRelationalQualityPath(
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
        let qualPath = homePath + "/em1.js;call/RQ/" + objID + "/" + relID;
        resolve(qualPath);
      }
    });
  });
}




export function postRelationalQuality(objKey, relKey = membersRelationPath) {
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
        let qualPath = homePath + "/em1.js;call/RQ/" + objID + "/" + relID;
        post(homePath + "/entities.sm.js./callSMF/postEntity", qualPath).then(
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
        post(homePath + "/entities.sm.js./callSMF/postEntity", entPath).then(
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


