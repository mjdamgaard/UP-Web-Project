
import {post, fetch, fetchPrivate} from 'query';
import {getRequestingUserID, checkRequestOrigin} from 'request';
import {getConnection} from 'connection';
import {arrayToHex, hexToArray, valueToHex, hexToValue} from 'hex';
import {verifyTypes} from 'type';
import {parseInt, isNaN} from 'number';
import {map} from 'array';



// updateUpOrDownRate(objID, relID, subjID, rateValue) adds or removes an up or
// a down rate for the given subject entity w.r.t. the object entity and the
// relation entity. The rateValue is either 1, meaning an up rate, a 0, meaning
// 'remove any existing up/down rate,' or -1, meaning a down rate. 
export async function updateUpOrDownRate(objID, relID, subjID, rateValue) {
  verifyTypes([objID, relID, subjID], ["hex", "hex", "hex"]);
  rateValue = parseInt(rateValue);
  if (isNaN(rateValue) || rateValue < - 1 || 1 < rateValue) throw (
    "Usage: rateValue argument has to be either -1, 0, or 1"
  );
  checkRequestOrigin(true, [
    abs("~/main.jsx"),
    abs("~/../app_browser/main.jsx"),
    // TODO: Add the other app browser versions, and likewise below.
  ]);

  let userID = getRequestingUserID();
  if (!userID) {
    throw "User must be logged in order to submit a like or dislike";
  }

  // Combine objID and relID into a single hexadecimal listID for all table
  // files, and compute the subjID--userID entry key for userRates.bt in
  // particular.
  let listID = arrayToHex([objID, relID], ["hex-int", "hex-int"]);
  let entryKey = arrayToHex([subjID, userID], ["hex-int", "hex-int"]);
  
  // Start a connection in order to update _userRates.bt, mixedSums.bbt, and
  // upRateSums.bbt simultaneously.
  let lockName = abs("./rates.sm.js/" + objID + "/" + relID + "/" + subjID);
  let conn = await getConnection(1000, true, lockName);
  let options = {connection: conn};

  // Get the relevant current data.
  let [prevLikeValue, prevMixedSum, prevLikeSum] = await Promise.all([
    _fetchUserLikeValue(listID, entryKey, options),
    _fetchMixedSum(listID, subjID, options),
    _fetchLikeSum(listID, subjID, options),
  ]);

  // Now compute the new sums, i.e. of the total number of up rates and the
  // total number up rates minus down rates.
  let newLikeSum = prevLikeSum - (prevLikeValue === 1 ? 1 : 0) +
    (rateValue === 1 ? 1 : 0);
  let newMixedSum = prevLikeSum - prevLikeValue + rateValue;

  // Finally update the data, and end end the connection (committing the
  // transaction and releasing the lock).
  await Promise.all([
    _postUserLikeValue(listID, entryKey, rateValue, options),
    _postLikeSum(listID, subjID, newLikeSum, options),
    _postMixedSum(listID, subjID, newMixedSum, options),
  ]);
  await conn.end();
}



/* Functions concerning _userRates.bt */ 

export function fetchUserLikeValue(objID, relID, subjID) {
  verifyTypes([objID, relID, subjID], ["hex", "hex", "hex"]);
  checkRequestOrigin(true, [
    abs("~/main.jsx"),
    abs("~/../app_browser/main.jsx"),
  ]);

  let userID = getRequestingUserID();
  if (!userID) {
    throw "User must be logged in order to fetch their like/dislike data";
  }

  let listID = arrayToHex([objID, relID], ["hex-int", "hex-int"]);
  let entryKey = arrayToHex([subjID, userID], ["hex-int", "hex-int"]);
  return _fetchUserLikeValue(listID, entryKey);
}


async function _fetchUserLikeValue(listID, entryKey, options = undefined) {
  let likePayload = await fetchPrivate(
    abs("./_userRates.bt./entry/l/" + listID + "/k/" + entryKey),
    options
  );
  let rateValue = (likePayload === undefined) ? 0 :
    (likePayload === "1") ? 1 : -1;
  return rateValue;
}


async function _postUserLikeValue(
  listID, entryKey, rateValue, options = undefined
) {
  if (rateValue === 0) {
    await post(
      abs("./_userRates.bt./_deleteEntry/l/" + listID + "/k/" + entryKey),
      undefined, options
    );
  } else {
    let likePayload = (rateValue === 1) ? "1" : "2";
    await post(
      abs("./_userRates.bt./_insert/l/" + listID + "/k/" + entryKey),
      likePayload, options
    );
  }
}


/* Functions concerning upRateSums.bbt */

export function fetchLikeSum(objID, relID, subjID) {
  verifyTypes([objID, relID, subjID], ["hex", "hex", "hex"]);
  let listID = arrayToHex([objID, relID], ["hex-int", "hex-int"]);
  return _fetchLikeSum(listID, subjID);
}

async function _fetchLikeSum(listID, subjID, options = undefined) {
  let [likeSumHex] = await fetch(
    abs("./_upRateSums.bbt./entry/l/" + listID + "/k/" + subjID),
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
  listID, subjID, likeSum, options = undefined
) {
  let likeSumHex = valueToHex(likeSum, "uint(6)");
  await post(
    abs(
      "./_upRateSums.bbt./entry/l/" + listID + "/k/" + subjID +
      "/s/" + likeSumHex
    ),
    undefined, options
  )
}


/* Functions concerning mixedSums.bbt */ 

export function fetchMixedSum(objID, subjID) {
  verifyTypes([objID, relID, subjID], ["hex", "hex", "hex"]);
  let listID = arrayToHex([objID, relID], ["hex-int", "hex-int"]);
  return _fetchMixedSum(listID, entryKey);
}

async function _fetchMixedSum(listID, subjID, options = undefined) {
  let [mixedSumHex] = await fetch(
    abs("./_mixedSums.bbt./entry/l/" + listID + "/k/" + subjID),
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
  listID, subjID, mixedSum, options = undefined
) {
  let mixedSumHex = valueToHex(mixedSum, "int(6)");
  await post(
    abs(
      "./_mixedSums.bbt./entry/l/" + listID + "/k/" + subjID +
      "/s/" + mixedSumHex
    ),
    undefined, options
  )
}



/* Function for fetching a list of the best rated subject entities */

export function fetchLikedSubApps(
  objID, relID, disregardDownRates = "0",  maxNum = "1000", offSet = "0"
) {
  verifyTypes([objID, relID], ["hex", "hex"]);
  disregardDownRates = disregardDownRates !== "0";
  maxNum = parseInt(maxNum);
  if (isNaN(maxNum) || maxNum < 0) throw (
    "Usage: maxNum, if defined, needs to be a positive integer"
  );
  offSet = parseInt(offSet);
  if (isNaN(offSet) || offSet < 0) throw (
    "Usage: offSet, if defined, needs to be a positive integer"
  );

  let listID = arrayToHex([objID, relID], ["hex-int", "hex-int"]);
  let topSubApps = await fetch(abs(
    "./" + (disregardDownRates ? "upRateSums.bbt" : "mixedSums.bbt") +
    "./skList/l/" + listID + "/n/" + maxNum + "/o/" + offSet
  )) ?? [];
  return map(topSubApps, ([subjID]) => subjID);
}
