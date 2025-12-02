
// Some functions that are useful for fetching the entity ID or path when you
// got the other one (and when you just got the "entity key" in general), as
// well as functions to fetch entity definitions, and such.

import homePath from "./.id.js";
import {post, fetch, clearPermissions} from 'query';
import {valueToHex} from 'hex';
import {verifyType, hasType} from 'type';
import {toUpperCase} from 'string';
import {mapToArray, keys} from 'object';
import {forEach, map, reduce} from 'array';

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



// fetch(entKey, propArr, useScores) fetches the given entity's definition
// object, and if propArr is defined and contains any property names, these
// properties will be fetched via substituteIfGetterProperty(). This means
// that "properties," which we in this semantic system take to denote the
// non-method properties of the entities, can be substituted (recursively) if
// they are functions or promises. The propArr argument can also simply take
// the value of true, which has the same semantics as letting propArr consist
// of all the defining properties of the entity.
// And in a future implementation, passing the third argument,'useScores,' as
// true might also mean that the so-called "scored properties" will be checked
// as well, namely to see if a defining property has been overwritten by a
// scored one.
export function fetchEntityDefinition(
  entKey, propArr = undefined, useScores = false
) {
  // useScores is not implemented yet, meaning that so far, the properties of
  // the returned entity definition will always come from the defining
  // properties themselves, and not from so-called 'scored properties' (yet).
  useScores = useScores;

  return new Promise(resolve => {
    fetchEntityPath(entKey).then(entPath => {
      fetch(entPath).then(entDef => {
        // If propArr is falsy, just resolve with the entDef as is.
        if (!propArr) return resolve(entDef);

        // And if propArr is equal to true, treat it as being equal to the
        // array of all the keys in entDef.
        if (propArr === true) {
          propArr = keys(entDef);
        }

        // Then call substituteIfGetterProperty on all the properties, wait
        // for the resulting promises in parallel, and use substitute the
        // obtained properties in entDef before returning it.
        let propValuePromiseArr = map(propArr, propName => (
          substituteIfGetterProperty(propName, entDef[propName])
        ));
        Promise.all(propValuePromiseArr).then(subbedPropArr => {
          let partialSubbedEntDef = new MutableObject();
          forEach(subbedPropArr, (subbedProp, ind) => {
            partialSubbedEntDef[propArr[ind]] = subbedProp;
          });
          let subbedEntDef = {...entDef, ...partialSubbedEntDef};
          resolve(subbedEntDef);
        });
      });
    });
  });
}



export function substituteIfGetterProperty(propName, propValue) {
  // If the property does not start with an upper-case letter, simply resolve
  // with propValue, and else call substituteIfGetterPropertyHelper().
  return new Promise(resolve => {
    let startChar = propName[0];
    if (startChar !== toUpperCase(startChar)) {
      resolve(propValue);
    }
    else {
      substituteIfGetterPropertyHelper(propValue, resolve);
    }
  });
}

export function substituteIfGetterPropertyHelper(propValue, resolve) {
  // If propValue is a function, call it (with all permission cleared) to get
  // its return value, and then call this function recursively on that value.
  if (hasType(propValue, "function")) {
    propValue = clearPermissions(() => propValue());
    substituteIfGetterPropertyHelper(propValue, resolve);
  }

  // Else if it is a promise, wait for the result of that promise, and call
  // this function recursively on that result.
  else if (hasType(propValue, "promise")) {
    propValue.then(
      result => substituteIfGetterPropertyHelper(result, resolve)
    );
  }

  // Else if it is neither of those, resolve with the value as it is.
  else {
    resolve(propValue);
  }
}



// fetchEntityProperty() is similar to fetchEntityDefinition(), except it only
// fetches and substitutes one property in particular, and only resolves to
// that property's value in particular, rather than the full entDef.
export function fetchEntityProperty(
  entKey, propName, useScores = false
) {
  return new Promise(resolve => {
    fetchEntityDefinition(entKey, [propName], useScores).then(
      subbedEntDef => resolve(subbedEntDef[propName])
    );
  });
}




// checkClass() and checkSuperClass() searches an entity's class and/or list
// of superclasses for a given class, and returns true if that class is found.

export function checkClass(
  entKey, searchClassPath,  maxRecLevel = 10
) {
  return new Promise(resolve => {
    fetchEntityProperty(entKey, "Class").then(classKey => {
      checkSuperClass(classKey, searchClassPath, maxRecLevel).then(
        isFound => resolve(isFound)
      );
    });
  });
}

export function checkSuperClass(
  subClassKey, searchSuperClassPath, maxRecLevel = 10, recLevel = 0
) {
  return new Promise(resolve => {
    if (recLevel > maxRecLevel) return resolve(false);
    fetchEntityPath(subClassKey).then(subClassPath => {
      if (subClassPath === searchSuperClassPath) {
        resolve(true);
      }
      else {
        fetchEntityProperty(subClassKey, "Superclass").then(superclassKey => {
          if (!superclassKey) return resolve(false);
          fetchEntityPath(superclassKey).then(superclassPath => {
            if (superclassPath === searchSuperClassPath) {
              resolve(true);
            }
            else {
              checkSuperClass(
                superclassPath, searchSuperClassPath, maxRecLevel, recLevel + 1
              ).then(
                isFound => resolve(isFound)
              );
            }
          });
        });
      }
    });
  });
}

// checkDomain() uses checkSuperClass() to check the "Domain" of a quality.
export function checkDomain(
  qualKey, searchClassPath,  maxRecLevel = 10
) {
  return new Promise(resolve => {
    fetchEntityProperty(qualKey, "Domain").then(domainKey => {
      checkSuperClass(domainKey, searchClassPath, maxRecLevel).then(
        isFound => resolve(isFound)
      );
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

export function getConstructedEntityPath(
  modulePath, constructorAlias, argArr
) {
  let entPath = modulePath + ";call/" + constructorAlias;
  forEach(argArr, arg => {
    entPath = entPath + "/" + arg;
  });
  return entPath;
}

export function fetchConstructedEntityID(
  modulePath, constructorAlias, argArr
) {
  let entPath = getConstructedEntityPath(modulePath, constructorAlias, argArr);
  return fetchEntityID(entPath);
}


export function postEntityKeyConstructedEntity(
  modulePath, constructorAlias, entKeyArr
) {
  return new Promise(resolve => {
    let entIDPromArr = map(entKeyArr, entKey => fetchOrCreateEntityID(entKey));
    Promise.all(entIDPromArr).then(entIDArr => {
      postConstructedEntity(modulePath, constructorAlias, entIDArr).then(
        entID => resolve(entID)
      );
    });
  });
}

export function fetchEntityKeyConstructedEntityPath(
  modulePath, constructorAlias, entKeyArr
) {
  return new Promise(resolve => {
    let entIDPromArr = map(entKeyArr, entKey => fetchEntityID(entKey));
    Promise.all(entIDPromArr).then(entIDArr => resolve(
      getConstructedEntityPath(modulePath, constructorAlias, entIDArr)
    ));
  });
}

export function fetchEntityKeyConstructedEntityID(
  modulePath, constructorAlias, entKeyArr
) {
  return new Promise(resolve => {
    let entIDPromArr = map(entKeyArr, entKey => fetchEntityID(entKey));
    Promise.all(entIDPromArr).then(entIDArr => {
      fetchConstructedEntityID(modulePath, constructorAlias, entIDArr).then(
        entID => resolve(entID)
      );
    });
  });
}



export function postRelationalQuality(objKey, relKey = membersRelationPath) {
  return postEntityKeyConstructedEntity(
    homePath + "/em1.js", "RQ", [objKey, relKey]
  );
}
export function fetchRelationalQualityPath(
  objKey, relKey = membersRelationPath
) {
  return fetchEntityKeyConstructedEntityPath(
    homePath + "/em1.js", "RQ", [objKey, relKey]
  );
}
export function fetchRelationalQualityID(
  objKey, relKey = membersRelationPath
) {
  return fetchEntityKeyConstructedEntityID(
    homePath + "/em1.js", "RQ", [objKey, relKey]
  );
}


export function postScalarEntity(subjKey, extQualKey) {
  return new Promise(resolve => {
    if (hasType(extQualKey, "array")) {
      let [objKey, relKey] = extQualKey;
      postRelationalQuality(objKey, relKey).then(qualID => {
        postEntityKeyConstructedEntity(
          homePath + "/em1.js", "Scalar", [subjKey, qualID]
        ).then(
          entID => resolve(entID)
        );
      });
    }
    else {
      let qualKey = extQualKey;
      postEntityKeyConstructedEntity(
        homePath + "/em1.js", "Scalar", [subjKey, qualKey]
      ).then(
        entID => resolve(entID)
      );
    }
  });
}

export function fetchScalarEntityPath(subjKey, extQualKey) {
  return new Promise(resolve => {
    if (hasType(extQualKey, "array")) {
      let [objKey, relKey] = extQualKey;
      fetchRelationalQualityPath(objKey, relKey).then(qualPath => {
        fetchEntityKeyConstructedEntityPath(
          homePath + "/em1.js", "Scalar", [subjKey, qualPath]
        ).then(
          entPath => resolve(entPath)
        );
      });
    }
    else {
      let qualKey = extQualKey;
      fetchEntityKeyConstructedEntityPath(
        homePath + "/em1.js", "Scalar", [subjKey, qualKey]
      ).then(
        entPath => resolve(entPath)
      );
    }
  });
}

export function fetchScalarEntityID(subjKey, extQualKey) {
  return new Promise(resolve => {
    if (hasType(extQualKey, "array")) {
      let [objKey, relKey] = extQualKey;
      fetchRelationalQualityPath(objKey, relKey).then(qualPath => {
        fetchEntityKeyConstructedEntityID(
          homePath + "/em1.js", "Scalar", [subjKey, qualPath]
        ).then(
          entID => resolve(entID)
        );
      });
    }
    else {
      let qualKey = extQualKey;
      fetchEntityKeyConstructedEntityID(
        homePath + "/em1.js", "Scalar", [subjKey, qualKey]
      ).then(
        entID => resolve(entID)
      );
    }
  });
}







export function postEntity(moduleOrEntPath, alias = undefined) {
  let entPath = alias ? moduleOrEntPath + ";get/" + alias : moduleOrEntPath;
  return new Promise(resolve => {
    fetch(entPath).then(entDef => {
      if (entDef === undefined) {console.log("--LOG------------");throw "stop";
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
        // Only post so-called referential entities, namely with a defined
        // "Class" property.
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


