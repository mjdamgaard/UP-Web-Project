
// Server module (SM) that allows for posting semantic entities, defined by an
// "entity path/route" (entPath) in order to assign them an "entity ID" (entID).
// And for any given entity, one can also ask this SM to store an entPath--
// ID pair such that the entID can be obtained knowing the entPath, making the
// entID searchable as well.

import homePath from "./.id.js";
import {post, fetch} from 'query';
import {valueToHex} from 'hex';
import {verifyType} from 'type';
import {substring} from 'string';




export function postEntity(entPath, useSecIdx = true) {
  // Consider removing the following line again to allow for entities without
  // a secondary index entry (entPath -> entID).
  useSecIdx = true;
 
  return new Promise(resolve => {
    // If the user does not want to use the secondary index, just post to
    // the entPaths.att table.
    if (!useSecIdx) {
      post(homePath + "/entPaths.att./_insert", entPath).then(
        entID => resolve(entID)
      );
    }
    else {
      let entPathHex = valueToHex(entPath, "string");
      fetch(
        homePath + "/entIDs.bt./entry/k/" + entPathHex
      ).then(entID => {
        // If the entPath already has an entID, resolve with that.
        if (entID) {
          if (entID[0] === "0") entID = substring(entID, 1);
          return resolve(entID);
        }
        
        // Else post a new entity, and when the new entID is gotten, try to
        // insert it in the entIDs.bt table if an entry has not been inserted
        // for that same entPath in the meantime.
        post(homePath + "/entPaths.att./_insert", entPath).then(entID => {
          post(
            homePath + "/entIDs.bt./_insert/k/" + entPathHex +
            "/p/" + entID + "/i/1"
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
    fetch(
      homePath + "/entPaths.att./entry/k/" + entID
    ).then(entPath => {
      if (!entPath) return resolve(false);
      let entPathHex = valueToHex(entPath, "string");
      fetch(
        homePath + "/entIDs.bt./entry/k/" + entPathHex
      ).then(existingEntID => {
        // If the entPath already has another entID, resolve with false, and
        // if it already has the same ID, resolve with true.
        if (existingEntID) {
          return resolve(existingEntID == entID);
        }
        
        // Else try to insert that entID in the entIDs.bt table if an entry has
        // not been inserted for that same entPath in the meantime.
        post(
          homePath + "/entIDs.bt./_insert/k/" + entPathHex +
          "/p/" + entID + "/i/1"
        ).then(wasUpdated => resolve(wasUpdated));
      });
    });
  });
}

