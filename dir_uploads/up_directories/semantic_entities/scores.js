


import homePath from "./.id.js";
import {fetch} from 'query';
import {map, join} from 'array';
import {min} from 'math';
import {hexToArray, valueToHex} from 'hex';
import {
  fetchEntityIDIfPath, fetchEntityPathIfID, fetchEntityDefinition,
} from "../../entities.sm.js";



// Function to fetch the user weight from a so-called "user group," which is
// an aggregator that aggregates dimensionless scores, i.e. user weights, in
// .btt tables where each entry key is the given userID.
export function fetchUserWeight(userID, userGroupIDOrPath) {
  return new Promise(resolve => {
    fetchEntityPathIfID(userGroupIDOrPath).then(userGroupPath => {
      fetch(userGroupPath).then(userGroupAggregator => {
        userGroupAggregator.fetchScore(userID).then(userWeight => {
          resolve(userWeight);
        });
      });
    });
  }); 
}

// Function to fetch user scores uploaded via ./user_scores.sm.js.
export function fetchUserScore(qualIDOrPath, subjIDOrPath, userID) {
  return new Promise(resolve => {
    Promise.all([
      fetchUserScoreHex(qualIDOrPath, subjIDOrPath, userID),
      fetchMetric(qualIDOrPath)
    ]).then(([userScoreHex, metric]) => {
      if (userScoreHex === undefined) return undefined;
      let userScore = getFloatScore(userScoreHex, metric);
      resolve(userScore);
    });
  });
}

// Helper function to fetch user scores uploaded via ./user_scores.sm.js, which
// we will nonetheless also export.
export function fetchUserScoreHex(qualIDOrPath, subjIDOrPath, userID) {
  return new Promise(resolve => {
    Promise.all([
      fetchEntityIDIfPath(qualIDOrPath), fetchEntityIDIfPath(subjIDOrPath)
    ]).then(([qualID, subjID]) => {
      let listID = qualID + "&" + userID;
      fetch(
        homePath + "/userScores.bbt/l=" + listID + "/k=" + subjID
      ).then(
        ([userScoreHex]) => resolve(userScoreHex)
      );
    });
  });
}


// A generalized version of fetchUserScore() that can also be used to get
// aggregated scores at well, including ones that are stored in foreign home
// directories.  
export function fetchScore(
  tableFilePath, qualIDOrPath, otherListIDsOrPaths, keyIDOrPath
) {
  return new Promise(resolve => {
    Promise.all([
      fetchScoreHex(
        tableFilePath, qualIDOrPath, otherListIDsOrPaths, keyIDOrPath
      ),
      fetchMetric(qualIDOrPath)
    ]).then(([userScoreHex, metric]) => {
      if (userScoreHex === undefined) return undefined;
      let userScore = getFloatScore(userScoreHex, metric);
      resolve(userScore);
    });
  });
}

// A helper function to fetchScore(), which we will nonetheless also export.
export function fetchScoreHex(
  tableFilePath, qualIDOrPath, otherListIDsOrPaths, keyIDOrPath
) {
  return new Promise(resolve => {
  let qualIDProm = fetchEntityIDIfPath(qualIDOrPath);
  let keyIDProm = fetchEntityIDIfPath(keyIDOrPath);
  let otherListPartsPromArr = map(
    otherListIDsOrPaths, idOrPath => fetchEntityIDIfPath(idOrPath)
  );
    Promise.all([
      keyIDProm, qualIDProm, ...otherListPartsPromArr
    ]).then(([keyID, ...listParts]) => {
      let listID = join(listParts, "&");
      fetch(
        tableFilePath + "/l=" + listID + "/k=" + keyID
      ).then(
        ([userScoreHex]) => resolve(userScoreHex)
      );
    });
  });
}



export function fetchMetric(qualIDOrPath) {
  return new Promise(resolve => {
    fetchEntityDefinition(qualIDOrPath).then(
      entDef => resolve(entDef.Metric)
    );
  });
}


export function getFloatScore(userScoreHex, metric) {
  let lo = metric["Lower limit"] ?? "";
  let hi = metric["Upper limit"] ?? "";
  let sigLen = min(6, userScoreHex.length / 2 - (lo || hi ? 1 : 0));
  let type = "float(" + lo + "," + hi + "," + sigLen + ")";
  let [score] = hexToArray(userScoreHex, [type], true);
  return score;
}


export function getScoreHex(score, metric, sigLen = undefined) {
  let lo = metric["Lower limit"] ?? "";
  let hi = metric["Upper limit"] ?? "";
  sigLen = sigLen ?? 4 - (lo && hi ? 0 : 1);
  let type = "float(" + lo + "," + hi + "," + sigLen + ")";
  return valueToHex(score, type, true);
}




// This is a wrapper around posting user scores to ./user_scores.sm.js, that
// automatically convert the input floating point score to an appropriate
// hex-encoded score, looking at the quality's metric to get the right
// encoding. 
export function postUserScore(
  qualIDOrPath, subjIDOrPath, score, payloadHex = undefined
) {
  let qualIDProm = fetchEntityIDIfPath(qualIDOrPath);
  let subjIDProm = fetchEntityIDIfPath(subjIDOrPath);
  let metricProm = fetchMetric(qualIDOrPath);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, metricProm
    ]).then(([qualID, subjID, metric]) => {
      let scoreHex = getScoreHex(score, metric);
      post(
        homePath + "/user_scores.sm.js/callSMF/postUserScoreHex/" + qualID +
        "/" + subjID + "/" + scoreHex + (payloadHex  ? "/" + payloadHex : "")
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  });
}




