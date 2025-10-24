
import {post, fetch} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {valueToHex, hexToValue} from 'hex';
import {verifyType} from 'type';
import {now} from 'date';
import {map} from 'array';
import {getConnection} from 'connection';





export function requestFriend(otherUserID) {
  checkRequestOrigin(true, [
    "/1/7/main.jsx",
  ]);
  verifyType(otherUserID, "hex-string");
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);

    // Check that the user is not already a friend before inserting the new
    // friend request.
    fetchIsFriendOrSelf(otherUserID).then(isFriendOrSelf => {
      if (isFriendOrSelf) return resolve(false);
      let timestampHex = valueToHex(now(), "uint(6)");
      let isDeclinedHex = valueToHex(0, "uint(1)");
      post(
        abs("./_friend_requests.bbt") + "/_insert/l=" + otherUserID +
        "/k=" + reqUserID + "/s=" + timestampHex + "/p=" + isDeclinedHex +
        "/i=1" // Ignore if the friend request exists already. 
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  });
}


export function rescindFriendRequest(otherUserID) {
  checkRequestOrigin(true, [
    "/1/7/main.jsx",
  ]);
  verifyType(otherUserID, "hex-string");
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);

    // Delete any existing friend request from reqUser in the other users
    // friend request list.
    post(
      abs("./_friend_requests.bbt") + "/_deleteEntry/l=" + otherUserID +
      "/k=" + reqUserID
    ).then(
      wasDeleted => resolve(wasDeleted)
    );
  });
}


export function declineFriendRequest(otherUserID) {
  checkRequestOrigin(true, [
    "/1/7/main.jsx",
  ]);
  verifyType(otherUserID, "hex-string");
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);

    // Insert a declined friend request (regardless of whether there even was a
    // request there to begin with).
    let timestampHex = valueToHex(now(), "uint(6)");
    let isDeclinedHex = valueToHex(1, "uint(1)");
    post(
      abs("./_friend_requests.bbt") + "/_insert/l=" + reqUserID +
      "/k=" + otherUserID + "/s=" + timestampHex + "/p=" + isDeclinedHex
    ).then(
      wasUpdated => resolve(wasUpdated)
    );
  });
}


export function acceptFriendRequest(otherUserID) {
  checkRequestOrigin(true, [
    "/1/7/main.jsx",
  ]);
  verifyType(otherUserID, "hex-string");
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);
    
    // Look for the given friend request, and if it's there, add each of the
    // two users to the other's friend list.
    let options = {isPrivate: true};
    fetch(
      abs("./_friend_requests.bbt") + "/entry/l=" + reqUserID +
      "/k=" + otherUserID,
      options
    ).then(entry => {
      if (!entry) return resolve(false);

      let lockName = abs("./") + "/accept/" + reqUserID + "/" + otherUserID;
      getConnection(5000, true, lockName).then(conn => {
        let options = {connection: conn};
        let timestampHex = valueToHex(now(), "uint(6)");
        let addOtherUserAsFriendProm = post(
          abs("./_friends.bbt") + "/_insert/l=" + reqUserID +
          "/k=" + otherUserID + "/s=" + timestampHex,
          undefined, options
        );
        let addSelfAsOtherUsersFriendProm = post(
          abs("./_friends.bbt") + "/_insert/l=" + otherUserID +
          "/k=" + reqUserID + "/s=" + timestampHex,
          undefined, options
        );
        let removeRequestProm = post(
          abs("./_friend_requests.bbt") + "/_deleteEntry/l=" + reqUserID +
          "/k=" + otherUserID,
          undefined, options
        );
        let removeOtherUsersRequestIfAnyProm = post(
          abs("./_friend_requests.bbt") + "/_deleteEntry/l=" + otherUserID +
          "/k=" + reqUserID,
          undefined, options
        );
        Promise.all([
          addOtherUserAsFriendProm, addSelfAsOtherUsersFriendProm,
          removeRequestProm, removeOtherUsersRequestIfAnyProm
        ]).then(([
          otherUserWasAdded, selfWasAdded,
          ownRequestWasRemoved, _otherRequestWasRemoved
        ]) => {
          if (otherUserWasAdded && selfWasAdded && ownRequestWasRemoved) {
            conn.end();
            resolve(true);
          }
          else {
            conn.end(false);
            resolve(false);
          }
        });
      });
    });
  });
}


export function removeFriend(otherUserID) {
  checkRequestOrigin(true, [
    "/1/7/main.jsx",
  ]);
  verifyType(otherUserID, "hex-string");
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);
    if (otherUserID === reqUserID) return resolve(false);

    // Remove each of the two users in the other's friend list if they are
    // there.
    getConnection(5000, true).then(conn => {
      let options = {connection: conn};
      let removeOtherUserAsFriendProm = post(
        abs("./_friends.bbt") + "/_deleteEntry/l=" + reqUserID +
        "/k=" + otherUserID,
        undefined, options
      );
      let removeSelfAsOtherUsersFriendProm = post(
        abs("./_friends.bbt") + "/_deleteEntry/l=" + otherUserID +
        "/k=" + reqUserID,
        undefined, options
      );
      Promise.all([
        removeOtherUserAsFriendProm, removeSelfAsOtherUsersFriendProm
      ]).then(([
        otherUserWasRemoved, selfWasRemoved
      ]) => {
        conn.end();
        resolve([otherUserWasRemoved, selfWasRemoved]);
      });
    });
  });

}


export function fetchIsFriendOrSelf(otherUserID) {
  checkRequestOrigin(true, [
    "/1/7/main.jsx",
  ]);
  verifyType(otherUserID, "hex-string");
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);
    if (otherUserID === reqUserID) return resolve(true);

    // Fetch the relevant entry on the reqUser's friend list, and if the entry
    // is defined, resolve with true.
    let options = {isPrivate: true};
    fetch(
      abs("./_friends.bbt") + "/entry/l=" + reqUserID + "/k=" + otherUserID,
      options
    ).then(
      entry => resolve(entry ? true : false)
    );
  });
}




// fetchFriendList() returns false if access is denied, and else returns an
// array of [friendUserID, timestamp] paris.
export function fetchFriendList(
  userID = undefined, maxNumber = undefined, offset = undefined,
  sortOldestToNewest = false
) {
  checkRequestOrigin(true, [
    "/1/7/main.jsx",
  ]);
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);
    userID ??= reqUserID;

    // Query whether userID is a friend of the requesting user or is the req.
    // user themselves, before granting access to the friend list.
    fetchIsFriendOrSelf(userID).then(hasAccess => {
      if (!hasAccess) return resolve(false);
      let options = {isPrivate: true};
      fetch(
        abs("./_friends.bbt") + "/skList/l=" + userID +
        (maxNumber ? "/n=" + maxNumber : "") +
        (offset ? "/n=" + offset : "") +
        (sortOldestToNewest ? "/a=1" : "/a=0"),
        options
      ).then(list => {
        list = map(list, ([friendUserID, timestampHex]) => (
          [friendUserID, hexToValue(timestampHex, "uint(6)")]
        ));
        resolve(list);
      });
    });
  });
}

// fetchFriendRequestList() returns false if access is denied, and else returns
// an array of [otherUserID, timestamp, isDeclined] triples.
export function fetchFriendRequestList(
  maxNumber = undefined, offset = undefined, sortOldestToNewest = false
) {
  checkRequestOrigin(true, [
    "/1/7/main.jsx",
  ]);
  return new Promise(resolve => {
    let reqUserID = getRequestingUserID();
    if (!reqUserID) return resolve(false);

    // Fetch the user's incoming friend requests.
    let options = {isPrivate: true};
    fetch(
      abs("./_friend_requests.bbt") + "/skList/l=" + reqUserID +
      (maxNumber ? "/n=" + maxNumber : "") +
      (offset ? "/n=" + offset : "") +
      (sortOldestToNewest ? "/a=1" : "/a=0"),
      options
    ).then(list => {
      list = map(list, ([otherUserID, timestampHex, isDeclinedHex]) => [
        otherUserID, hexToValue(timestampHex, "uint(6)"),
        hexToValue(isDeclinedHex, "uint(1)")
      ]);
      resolve(list);
    });
  });
}