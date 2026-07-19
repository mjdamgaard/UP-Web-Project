
import {post, fetch, fetchPrivate} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {getConnection} from 'connection';
import {arrayToHex, hexToArray, valueToHex, hexToValue} from 'hex';
import {verifyTypes, verifyType} from 'type';
import {parseInt, isNaN} from 'number';
import {map} from 'array';



// updateLikeValue(appDirID, subAppDirID, likeValue) adds or removes a like or
// dislike for the given sub-app w.r.t. the given app. (A good sub-app is
// either one that implements a better design of the given app without
// introducing any new significant features, or a prototype app that introduces
// some new features (but which typically ought to defer it its own sub-apps to
// further polish its design). More generally speaking, a good sub-app is one
// that introduces just a single upgrade to the given app, be it a new feature,
// a new design choice, or just a fix-up/polish of it.)
// The likeValue is either 1, meaning a like, a 0, meaning 'remove any existing
// likes/dislikes,' or -1, meaning a dislike. 
export async function updateLikeValue(appDirID, subAppDirID, likeValue) {
  verifyTypes([appDirID, subAppDirID], ["hex", "hex"]);
  likeValue = parseInt(likeValue);
  if (isNaN(likeValue) || likeValue < - 1 || 1 < likeValue) throw (
    "Usage: likeValue argument has to be either -1, 0, or 1"
  );
  checkRequestOrigin(true, [
    abs("~/main.jsx"),
  ]);

  let userID = getRequestingUserID();
  if (!userID) {
    throw "User must be logged in order to submit a like or dislike";
  }

  // Compute the hexadecimal entry key for userLikes.bt.
  let entryKey = arrayToHex([subAppDirID, userID], ["string", "string"]);
  
  // Start a connection in order to update _userLikes.bt, mixedSums.bbt, and
  // likeSums.bbt simultaneously.
  let lockName = abs("./likes.sm.js/" + appDirID + "/" + subAppDirID);
  let conn = await getConnection(1000, true, lockName);
  let options = {connection: conn};

  // Get the relevant current data.
  let [prevLikeValue, prevMixedSum, prevLikeSum] = await Promise.all([
    _fetchUserLikeValue(appDirID, entryKey, options),
    _fetchMixedSum(appDirID, subAppDirID, options),
    _fetchLikeSum(appDirID, subAppDirID, options),
  ]);

  // Now compute the new sums, i.e. of the total number of likes and the total
  // number likes minus dislikes.
  let newLikeSum = prevLikeSum - (prevLikeValue === 1 ? 1 : 0) +
    (likeValue === 1 ? 1 : 0);
  let newMixedSum = prevLikeSum - prevLikeValue + likeValue;

  // Finally update the data, and end end the connection (committing the
  // transaction and releasing the lock).
  await Promise.all([
    _postUserLikeValue(appDirID, entryKey, likeValue, options),
    _postLikeSum(appDirID, subAppDirID, newLikeSum, options),
    _postMixedSum(appDirID, subAppDirID, newMixedSum, options),
  ]);
  await conn.end();
}



/* Functions concerning _userLikes.bt */ 

export function fetchUserLikeValue(appDirID, subAppDirID) {
  verifyTypes([appDirID, subAppDirID], ["hex", "hex"]);
  checkRequestOrigin(true, [
    abs("~/main.jsx"),
  ]);

  let userID = getRequestingUserID();
  if (!userID) {
    throw "User must be logged in order to fetch their like/dislike data";
  }

  let entryKey = arrayToHex([subAppDirID, userID], ["string", "string"]);
  return _fetchUserLikeValue(appDirID, entryKey);
}


async function _fetchUserLikeValue(appDirID, entryKey, options = undefined) {
  let likePayload = await fetchPrivate(
    abs("./_userLikes.bt./entry/l/" + appDirID + "/k/" + entryKey),
    options
  );
  let likeValue = (likePayload === undefined) ? 0 :
    (likePayload === "1") ? 1 : -1;
  return likeValue;
}


async function _postUserLikeValue(
  appDirID, entryKey, likeValue, options = undefined
) {
  if (likeValue === 0) {
    await post(
      abs("./_userLikes.bt./_deleteEntry/l/" + appDirID + "/k/" + entryKey),
      undefined, options
    );
  } else {
    let likePayload = (likeValue === 1) ? "1" : "2";
    await post(
      abs("./_userLikes.bt./_insert/l/" + appDirID + "/k/" + entryKey),
      likePayload, options
    );
  }
}


/* Functions concerning likeSums.bbt */

export function fetchLikeSum(appDirID, subAppDirID) {
  verifyTypes([appDirID, subAppDirID], ["hex", "hex"]);
  return _fetchLikeSum(appDirID, entryKey);
}

async function _fetchLikeSum(appDirID, subAppDirID, options = undefined) {
  let [likeSumHex] = await fetch(
    abs("./_likeSums.bbt./entry/l/" + appDirID + "/k/" + subAppDirID),
    options
  ) ?? [];
  if (likeSumHex === undefined) {
    return 0;
  }
  else {
    return hexToValue(likeSumHex, "uint(6)");
  }
}

async function _postLikeSum(
  appDirID, subAppDirID, likeSum, options = undefined
) {
  let likeSumHex = valueToHex(likeSum, "uint(6)");
  await post(
    abs(
      "./_likeSums.bbt./entry/l/" + appDirID + "/k/" + subAppDirID +
      "/s/" + likeSumHex
    ),
    undefined, options
  )
}


/* Functions concerning mixedSums.bbt */ 

export function fetchMixedSum(appDirID, subAppDirID) {
  verifyTypes([appDirID, subAppDirID], ["hex", "hex"]);
  return _fetchMixedSum(appDirID, entryKey);
}

async function _fetchMixedSum(appDirID, subAppDirID, options = undefined) {
  let [mixedSumHex] = await fetch(
    abs("./_mixedSums.bbt./entry/l/" + appDirID + "/k/" + subAppDirID),
    options
  ) ?? [];
  if (mixedSumHex === undefined) {
    return 0;
  }
  else {
    return hexToValue(mixedSumHex, "int(6)");
  }
}

async function _postMixedSum(
  appDirID, subAppDirID, mixedSum, options = undefined
) {
  let mixedSumHex = valueToHex(mixedSum, "int(6)");
  await post(
    abs(
      "./_mixedSums.bbt./entry/l/" + appDirID + "/k/" + subAppDirID +
      "/s/" + mixedSumHex
    ),
    undefined, options
  )
}



/* Function for fetching a list of the most liked sub-apps */

export function fetchLikedSubApps(
  appDirID, disregardDislikes = "0",  maxNum = "1000", offSet = "0"
) {
  verifyType(appDirID, "hex");
  disregardDislikes = disregardDislikes !== "0";
  maxNum = parseInt(maxNum);
  if (isNaN(maxNum) || maxNum < 0) throw (
    "Usage: maxNum, if defined, needs to be a positive integer"
  );
  offSet = parseInt(offSet);
  if (isNaN(offSet) || offSet < 0) throw (
    "Usage: offSet, if defined, needs to be a positive integer"
  );
  let topSubApps = await fetch(abs(
    "./" + (disregardDislikes ? "likeSums.bbt" : "mixedSums.bbt") +
    "./skList/l/" + appDirID + "/n/" + maxNum + "/o/" + offSet
  )) ?? [];
  return map(topSubApps, ([subAppDirID]) => subAppDirID);
}
