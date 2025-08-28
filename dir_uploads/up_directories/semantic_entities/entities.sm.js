
// Server module (SM) that allows for posting semantic entities, defined by an
// "entity path/route" (entPath) in order to assign them an "entity ID" (entID).
// And for any given entity, one can also ask this SM to store an entPath--
// ID pair such that the entID can be obtained knowing the entPath, making the
// entID searchable as well.

import homePath from "./.id.js";
import {post, fetch} from 'query';
import {valueToHex} from 'hex';
import {verifyType} from 'types';
import {substring} from 'string';



export function postEntity(entPath, useSecIdx = true) {
  return new Promise(resolve => {
    // If the user does not want to use the secondary index, just post to
    // the entPaths.att table.
    if (!useSecIdx) {
      post(homePath + "/entPaths.att/_insert", entPath).then(
        entID => resolve(entID)
      );
    }
    else {
      let entPathHex = valueToHex(entPath, "string");
      fetch(homePath + "/entIDs.bt/entry/k=" + entPathHex).then(entID => {
        // If the entPath already has an entID, resolve with that.
        if (entID) {
          return resolve(entID);
        }
        
        // Else post a new entity, and when the new entID is gotten, try to
        // insert it in the entIDs.bt table if an entry has not been inserted
        // for that same entPath in the meantime.
        post(homePath + "/entPaths.att/_insert", entPath).then(entID => {
          post(
            homePath + "/entIDs.bt/_insert/k=" + entPathHex +
            "/p=" + entID + "/o=0"
          );
          resolve(entID);
        });
      });
    }
  });
}





export function addSecondaryIndex(entID) {
  verifyType(entID, "hex-string");
  return new Promise(resolve => {
    fetch(homePath + "/entPaths.att/entry/k=" + entID).then(entPath => {
      let entPathHex = valueToHex(entPath, "string");
      fetch(homePath + "/entIDs.bt/entry/k=" + entPathHex).then(
        existingEntID => {
          // If the entPath already has another entID, resolve with false, and
          // if it already has the same ID, resolve with true.
          if (existingEntID) {
            return resolve(existingEntID == entID);
          }
          
          // Else try to insert that entID in the entIDs.bt table if an entry has
          // not been inserted for that same entPath in the meantime.
          post(
            homePath + "/entIDs.bt/_insert/k=" + entPathHex +
            "/p=" + entID + "/o=0"
          ).then(wasUpdated => resolve(wasUpdated));
        }
      );
    });
  });
}



// The following functions does not need to be called via a 'callSMF' route,
// which is generally true for functions that doesn't post any data. These can
// thus also freely be imported and used by other modules. (This is not true
// for the post methods; there you need to use 'callSMF' routes to this
// specific SM.)

export function fetchEntityID(entPath) {
  return new Promise(resolve => {
    let entPathHex = valueToHex(entPath, "string");
    fetch(homePath + "/entIDs.bt/entry/k=" + entPathHex).then(
      entID => resolve(entID)
    );
  });
}

export function fetchEntityPath(entIDIdent) {
  let entID = substring(entIDIdent, 1);
  verifyType(entID, "hex-string");
  return new Promise(resolve => {
    fetch(homePath + "/entPaths.att/entry/k=" + entID).then(
      entPath => resolve(entPath)
    );
  });
}



export function fetchEntityIDIfPath(entIdent) {
  if (entIdent[0] === "/") {
    return fetchEntityID(entIdent);
  } else {
    return new Promise(resolve => {
      let entID = substring(entIdent, 1);
      verifyType(entID, "hex-string");
      resolve(entIdent)
    });
  }
}

export function fetchEntityPathIfID(entIdent) {
  if (entIdent[0] === "/") {
    return entIdent;
  } else {
    return fetchEntityPath(entIdent);
  }
}



export function fetchEntityDefinition(entIdent) {
  return new Promise(resolve => {
    fetchEntityPathIfID(entIdent).then(entPath => {
      fetch(entPath).then(entDef => resolve(entDef));
    });
  });
}

