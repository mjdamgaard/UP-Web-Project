
import {post, fetch, fetchPrivate} from 'query';
import {getRequestingUserID} from 'request';
import {valueToHex, hexToValue} from 'hex';
import {verifyType} from 'type';
import {substring} from 'string';
import {getConnection} from 'connection';



export function requestNewUserTag(userTag) {
  verifyType(userTag, "string");
  if (substring(userTag, 0, 5) === "User ") throw (
    'User tag cannot start with "User "'
  );
  return new Promise(resolve => {
    let userID = getRequestingUserID();
    if (!userID) return resolve(false);

    // Start a connection with a transaction open, and fetch to see if there
    // is a user with that tag already. If not, then change the user's tag
    // to the requested user tag.
    let userTagHex = valueToHex(userTag, "string");
    let lockName = abs("./") + "/userTag/" + userTagHex;
    getConnection(8000, true, lockName).then(conn => {
      let options = {connection: conn};
      fetchPrivate(
        abs("./ids.ct") + "./entry/k/" + userTagHex,
        options
      ).then(existingUserID => {
        if (existingUserID) {
          conn.end(false);
          return resolve(false);
        }
        else {
          let addUserIDProm = post(
            abs("./ids.ct") + "./_insert/k/" + userTagHex +
            "/p/" + userID,
            undefined, options
          );
          let addUserTagProm = post(
            abs("./tags.bt") + "./_insert/k/" + userID +
            "/p/" + userTagHex,
            undefined, options
          );
          Promise.all([
            addUserIDProm, addUserTagProm
          ]).then(([
            userIDIsAdded, userTagIsAdded 
          ]) => {
            if (userIDIsAdded && userTagIsAdded) {
              conn.end();
              resolve(true);
            }
            else {
              conn.end(false);
              resolve(false);
            }
          });
        }
      });
    });
  });
}



// Since ids.ct and tags.bt are public tables (no underscore in front, neither
// in their own file name or in any of their ancestor directories' names),
// these two SMFs (server module functions) for fetching userTag or userID is
// not strictly necessary, but they might still be considered handy, and it's
// nice to complete the API of the SM this way. *Oh, and they can also be
// imported and used as subroutines for other SMFs or front-end modules.  

export function fetchUserTag(userID) {
  verifyType(userID, "hex-string");
  return new Promise(resolve => {
    fetch(
      abs("./tags.bt") + "./entry/k/" + userID
    ).then(userTagHex => {
      let userTag = userTagHex ?
        hexToValue(userTagHex, "string") : undefined;
      resolve(userTag);
    });
  });
}

export function fetchUserID(userTagHex) {
  return new Promise(resolve => {
    fetch(
      abs("./ids.ct") + "./entry/k/" + userTagHex
    ).then(
      userID => resolve(userID)
    );
  });
}






// A function for a user to add or edit their user bio.
export function putUserBio(text) {
  verifyType(text, "string");
  return new Promise(resolve => {
    let userID = getRequestingUserID();
    if (!userID) return resolve(false);
    post(
      abs("./bios.att") + "./_insert/k/" + userID, text
    ).then(
      wasInserted => resolve(wasInserted)
    );
  });
}

// A function to fetch user's bio.
export function fetchUserBio(userID) {
  verifyType(userID, "hex-string");
  return new Promise(resolve => {
    fetch(
      abs("./bios.att") + "./entry/k/" + userID
    ).then(
      bioText => resolve(bioText)
    );
  });
}