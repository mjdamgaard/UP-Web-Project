
import {post, fetch} from 'query';
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
      let options = {connection: conn, isPrivate: true};
      fetch(
        abs("./_user_ids.ct") + "/entry/k=" + usernameHex,
        options
      ).then(existingUserID => {
        if (!existingUserID) {
          conn.end(false);
          return resolve(false);
        }
        else {
          let addUserIDProm = post(
            abs("./_user_ids.ct") + "/_insert/k=" + usernameHex +
            "/p=" + userID,
            undefined, options
          );
          let addUserNameProm = post(
            abs("./_user_names.bt") + "/_insert/k=" + userID,
            "/p=" + usernameHex,
            undefined, options
          );
          // ...
        }
      });
    });
  });
}




export function requestNewUserName(userName) {
  return requestNewUsername(userName);
}