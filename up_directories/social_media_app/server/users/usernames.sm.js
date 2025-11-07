
import {post, fetch, fetchPrivate} from 'query';
import {getRequestingUserID} from 'request';
import {valueToHex, hexToValue} from 'hex';
import {verifyType} from 'type';
import {now} from 'date';
import {map} from 'array';
import {getConnection} from 'connection';



export function requestNewUsername(username) {
  verifyType(username, "string");
  return new Promise(resolve => {
    let userID = getRequestingUserID();
    if (!userID) return resolve(false);

    // Start a connection with a transaction open, and fetch to see if there
    // is a user with that name already. If not, then change the user's name
    // to the requested user name.
    let usernameHex = valueToHex(username, "string");
    let lockName = abs("./") + "/username/" + usernameHex;
    getConnection(8000, true, lockName).then(conn => {
      let options = {connection: conn};
      fetchPrivate(
        abs("./user_ids.ct") + "/entry/k/" + usernameHex,
        options
      ).then(existingUserID => {
        if (existingUserID) {console.log("existingUserID=", existingUserID);
          conn.end(false);
          return resolve(false);
        }
        else {
          let addUserIDProm = post(
            abs("./user_ids.ct") + "/_insert/k/" + usernameHex +
            "/p/" + userID,
            undefined, options
          );
          let addUsernameProm = post(
            abs("./usernames.bt") + "/_insert/k/" + userID +
            "/p/" + usernameHex,
            undefined, options
          );
          Promise.all([
            addUserIDProm, addUsernameProm
          ]).then(([
            userIDIsAdded, usernameIsAdded 
          ]) => {
            if (userIDIsAdded && usernameIsAdded) {
              conn.end();
              resolve(true);
            }
            else {console.log("userIDIsAdded=", userIDIsAdded, "usernameIsAdded=", usernameIsAdded);
              conn.end(false);
              resolve(false);
            }
          });
        }
      });
    });
  });
}



// Since user_ids.ct and usernames.bt are public tables (no underscore in
// front, neither in their own file name or in any of their ancestor
// directories' names), these two SMFs (server module functions) for fetching
// username or userID is not strictly necessary, but they might still be
// considered handy, and it's nice to complete the API of the SM this way.

export function fetchUsername(userID) {
  verifyType(userID, "hex-string");
  return new Promise(resolve => {
    fetch(
      abs("./usernames.bt") + "/entry/k/" + userID
    ).then(usernameHex => {
      let username = usernameHex ?
        hexToValue(usernameHex, "string") : undefined;
      resolve(username);
    });
  });
}

export function fetchUserID(usernameHex) {
  return new Promise(resolve => {
    fetch(
      abs("./user_ids.ct") + "/entry/k/" + usernameHex
    ).then(
      userID => resolve(userID)
    );
  });
}
