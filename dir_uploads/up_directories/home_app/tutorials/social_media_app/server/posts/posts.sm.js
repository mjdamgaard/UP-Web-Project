
import {post} from 'query';
import {getRequestingUserID} from 'request';
import {valueToHex} from 'hex';
import {now} from 'date';
import {getConnection} from 'connection';



export function createPost(text) {
  return new Promise(resolve => {
    let userID = getRequestingUserID();
    if (!userID) return resolve(false);

    // Add the post to the user's own post wall, by first inserting the text in
    // texts.att (auto-generating an ID for the text in the process), and then
    // inserting the textID into posts.btt, along with the userID and timestamp.  
    post(abs("./texts.att)") + "/_insert/l=" + userID, text).then(textID => {
      // Get the timestamp, and convert it to a hexadecimal string. (Note that
      // both userID and textID are already hexadecimal strings, so these don't
      // need to be converted for the following post route.)
      let timestamp = now();
      let timestampHex = valueToHex(timestamp, "int(6)");
      post(
        abs("./posts.bbt") + "/_insert/l=" + userID + "/k=" + textID +
        "/s=" + timestampHex
      ).then((wasUpdated) => {
        resolve(wasUpdated);
      });
    });
  });
}


export function deletePost(textID) {
  return new Promise(resolve => {
    let userID = getRequestingUserID();
    if (!userID) return resolve(false);

    // Delete the post from posts.bbt, as well as the text from texts.att, but
    // only if the first deletion succeeded. And do it all in one database
    // transaction such that we don't get dangling texts if the deletion fails
    // midway.
    let lockName = abs("./") + "/" + userID + "/" + textID;
    getConnection(5000, true, lockName).then(conn => {
      let options = {connection: conn};
      post(
        abs("./posts.bbt") + "/_deleteEntry/l=" + userID + "/k=" + textID,
        undefined,
        options
      ).then(wasDeleted => {
        if (!wasDeleted) {
          // End the connection with a 'commit' argument of false. (It doesn't
          // matter here, but it's a good habit.)
          conn.end(false);
          return resolve(false);
        }
        post(
          abs("./texts.att") + "/_deleteEntry/l=" + userID + "/k=" + textID,
          undefined,
          options
        ).then(wasDeleted => {
          if (!wasDeleted) {
            // End the connection with a 'commit' argument of false.
            conn.end(false);
            return resolve(false);
          }
          else {
            resolve(true);
          }
        });
      });
    });
  });
}