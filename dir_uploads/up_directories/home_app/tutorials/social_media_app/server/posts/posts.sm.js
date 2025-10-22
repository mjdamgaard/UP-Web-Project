
import {post, fetch} from 'query';
import {getRequestingUserID} from 'request';
import {valueToHex, hexToValue} from 'hex';
import {now} from 'date';
import {map} from 'array';
import {getConnection} from 'connection';
import {fetchIsFriendOrSelf} from "../friends/friends.sm.js";



export function createPost(text) {
  return new Promise(resolve => {
    let userID = getRequestingUserID();
    if (!userID) return resolve(false);

    // Add the post to the user's own post wall, by first inserting the text in
    // texts.att (auto-generating an ID for the text in the process), and then
    // inserting the textID into posts.btt, along with the userID and timestamp.  
    post(abs("./_texts.att)") + "/_insert/l=" + userID, text).then(textID => {
      // Get the timestamp, and convert it to a hexadecimal string. (Note that
      // both userID and textID are already hexadecimal strings, so these don't
      // need to be converted for the following post route.)
      let timestamp = now();
      let timestampHex = valueToHex(timestamp, "uint(6)");
      post(
        abs("./_posts.bbt") + "/_insert/l=" + userID + "/k=" + textID +
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
    let lockName = abs("./") + "/deletePost/" + userID + "/" + textID;
    getConnection(5000, true, lockName).then(conn => {
      let options = {connection: conn};
      post(
        abs("./_posts.bbt") + "/_deleteEntry/l=" + userID + "/k=" + textID,
        undefined, options
      ).then(wasDeleted => {
        if (!wasDeleted) {
          // End the connection with a 'commit' argument of false. (It doesn't
          // matter here, but it's a good habit.)
          conn.end(false);
          return resolve(false);
        }
        post(
          abs("./_texts.att") + "/_deleteEntry/l=" + userID + "/k=" + textID,
          undefined, options
        ).then(wasDeleted => {
          if (!wasDeleted) {
            // End the connection with a 'commit' argument of false.
            conn.end(false);
            return resolve(false);
          }
          else {
            // End the connection with a 'commit' argument of true, which is
            // the default value.
            conn.end();
            resolve(true);
          }
        });
      });
    });
  });
}


// fetchPostList() returns false if access is denied, and else returns an
// array of [textID, timestamp] paris.
export function fetchPostList(
  userID, minTime = undefined, maxTime = undefined, maxNumber = undefined,
  offset = undefined, sortOldestToNewest = false
) {
  return new Promise(resolve => {
    // Query whether userID is a friend of the requesting user (or is the req.
    // user themselves), before granting access to the post wall.
    fetchIsFriendOrSelf(userID).then(hasAccess => {
      if (!hasAccess) return resolve(false);

      // Note that we need to add an option of isPrivate = true when fetching
      // data from a private route, which is a requirement in order to prevent
      // the accidental fetching of private data from a route coming from an
      // external source. 
      let options = {isPrivate: true};
      fetch(
        abs("./_posts.bbt") + "/skList/l=" + userID +
        (minTime ? "/lo=" + valueToHex(minTime, "uint(6)") : "") +
        (maxTime ? "/hi=" + valueToHex(maxTime, "uint(6)") : "") +
        (maxNumber ? "/n=" + maxNumber : "") +
        (offset ? "/n=" + offset : "") +
        (sortOldestToNewest ? "/a=1" : "/a=0"),
        options
      ).then(list => {
        list = map(list, ([textID, timestampHex]) => (
          [textID, hexToValue(timestampHex, "unit(6)")]
        ));
        resolve(list);
      });
    });
  });
}



export function fetchPostText(userID, textID) {
  return new Promise(resolve => {
    // Query whether userID is a friend of the requesting user (or is the req.
    // user themselves), before granting access to the post text.
    fetchIsFriendOrSelf(userID).then(hasAccess => {
      if (!hasAccess) return resolve(false);
      let options = {isPrivate: true};
      fetch(
        abs("./_texts.att") + "/entry/l=" + userID + "/k=" + textID,
        options
      ).then(
        text => resolve(text)
      );
    });
  });
}
