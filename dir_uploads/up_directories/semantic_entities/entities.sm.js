
// Server module (SM) that allows for posting semantic entities, defined by an
// "entity path/route" (entPath) in order to assign them an "entity ID" (entID).
// And for any given entity, one can also ask this SM to store an entPath--
// ID pair such that the entID can be obtained knowing the entPath, making the
// entID searchable as well.

import homePath from "./.id.js";
import {post, fetch, upNodeID} from 'query';
import {valueToHex} from 'hex';
import {verifyType} from 'types';
import {substring} from 'string';
import {TypeError} from 'error';



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
            "/p=" + entID + "/i=1"
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
            "/p=" + entID + "/i=1"
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
      resolve(entKey)
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

