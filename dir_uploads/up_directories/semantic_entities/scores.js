


import homePath from "./.id.js";
import {fetch} from 'query';
import {map, join} from 'array';
import {min} from 'math';
import {hexToArray, valueToHex, hexFromArray} from 'hex';
import {
  fetchEntityIDIfPath, fetchEntityPathIfID, fetchEntityDefinition,
} from "../../entities.sm.js";



// Function to fetch the weight-ordered list of the user group.
export function fetchUserList(
  userGroupIdent, lo, hi, maxNum, numOffset, isAscending
) {
  return new Promise(resolve => {
    fetchEntityPathIfID(userGroupIdent).then(userGroupPath => {
      fetch(userGroupPath).then(userGroupDef => {
        let qualIdent = userGroupDef["Quality"];
        let evaluatorIdent = userGroupDef["Evaluator"];
        fetchList(
          evaluatorIdent, qualIdent, lo, hi, maxNum, numOffset, isAscending
        ).then(
          list => resolve(list)
        );
      });
    });
  }); 
}

// Function to fetch the user weight from a so-called "user group," which is
// an aggregator that aggregates dimensionless scores, i.e. user weights, in
// .btt tables where each entry key is the given userID.
export function fetchUserWeight(userGroupIdent, userID) {
  return new Promise(resolve => {
    fetchEntityPathIfID(userGroupIdent).then(userGroupPath => {
      fetch(userGroupPath).then(userGroupAggregator => {
        userGroupAggregator.fetchScore(userID).then(userWeight => {
          resolve(userWeight);
        });
      });
    });
  }); 
}

// Function to fetch user scores uploaded via ./user_scores.sm.js.
export function fetchUserScore(qualIdent, subjIdent, userID) {
  return new Promise(resolve => {
    Promise.all([
      fetchUserScoreHex(qualIdent, subjIdent, userID),
      fetchMetric(qualIdent)
    ]).then(([userScoreHex, metric]) => {
      if (userScoreHex === undefined) return undefined;
      let userScore = getFloatScore(userScoreHex, metric);
      resolve(userScore);
    });
  });
}

// Helper function to fetch user scores uploaded via ./user_scores.sm.js, which
// we will nonetheless also export.
export function fetchUserScoreHex(qualIdent, subjIdent, userID) {
  return new Promise(resolve => {
    Promise.all([
      fetchEntityIDIfPath(qualIdent), fetchEntityIDIfPath(subjIdent)
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


export function fetchMetric(qualIdent) {
  return new Promise(resolve => {
    fetchEntityDefinition(qualIdent).then(
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



// A function that can be used to get aggregated scores, including ones that
// are stored in foreign home directories. This function assumes that the score
// column is actually a float(,,3),float(,,1) array, where the first float is
// the score (ignoring bounds), and the second float is the weight of the score
// (possibly a combined one).
export function fetchScoreAndWeight(
  tableFilePath, qualIdent, otherListIDsOrPaths, keyIdent
) {
  return new Promise(resolve => {
    fetchScoreHex(
      tableFilePath, qualIdent, otherListIDsOrPaths, keyIdent
    ).then(scoreAndWeightHex => {
      if (scoreAndWeightHex === undefined) return [];
      let [score, weight] = arrayFromHex(
        scoreAndWeightHex, ["float(,,3)", "float(,,1)"]
      );
      resolve([score, weight, scoreAndWeightHex]);
    });
  });
}


// A function to fetch the hex-encoded score of any BTT table.
export function fetchScoreHex(
  tableFilePath, qualIdent, otherListIDsOrPaths, keyIdent
) {
  return new Promise(resolve => {
    let qualIDProm = fetchEntityIDIfPath(qualIdent);
    let keyIDProm = fetchEntityIDIfPath(keyIdent);
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
        ([scoreAndWeightHex]) => resolve(scoreAndWeightHex)
      );
    });
  });
}


// postScoreAndWeight() and postScoreHexAndWeightHex() are the reverse
// functions of the two fetch functions above. These functions can be imported
// by used SMs that want to store score tables using the float(,,3),float(,,1)
// array convention (of score and weight).
export function postScoreAndWeight(
  tableFilePath, qualIdent, otherListIDsOrPaths, keyIdent, score, weight
) {
  return new Promise(resolve => {
    let scoreAndWeightHex = hexFromArray(
      [score, weight], ["float(,,3)", "float(,,1)"]
    );
    postScoreAndWeightHex(
      tableFilePath, qualIdent, otherListIDsOrPaths, keyIdent,
      scoreAndWeightHex
    ).then(
      wasUpdated => resolve(wasUpdated)
    );
  });
}

export function postScoreAndWeightHex(
  tableFilePath, qualIdent, otherListIDsOrPaths, keyIdent,
  scoreAndWeightHex
) {
  return new Promise(resolve => {
    let qualIDProm = fetchEntityIDIfPath(qualIdent);
    let keyIDProm = fetchEntityIDIfPath(keyIdent);
    let otherListPartsPromArr = map(
      otherListIDsOrPaths, idOrPath => fetchEntityIDIfPath(idOrPath)
    );
    Promise.all([
      keyIDProm, qualIDProm, ...otherListPartsPromArr
    ]).then(([keyID, ...listParts]) => {
      let listID = join(listParts, "&");
      post(
        tableFilePath + "/_insert/l=" + listID + "/k=" + keyID +
        "/s=" + scoreAndWeightHex
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  });
}



// And deleteScore functions similarly to postScoreAndWeight, except it just
// deletes the entry (and doesn't require anything about the
// float(,,3),float(,,1) format).
export function deleteScore(
  tableFilePath, qualIdent, otherListIDsOrPaths, keyIdent
) {
  return new Promise(resolve => {
    let qualIDProm = fetchEntityIDIfPath(qualIdent);
    let keyIDProm = fetchEntityIDIfPath(keyIdent);
    let otherListPartsPromArr = map(
      otherListIDsOrPaths, ident => fetchEntityIDIfPath(ident)
    );
    Promise.all([
      keyIDProm, qualIDProm, ...otherListPartsPromArr
    ]).then(([keyID, ...listParts]) => {
      let listID = join(listParts, "&");
      post(
        tableFilePath + "/_deleteEntry/l=" + listID + "/k=" + keyID
      ).then(
        wasDeleted => resolve(wasDeleted)
      );
    });
  });
}





// This is a wrapper around posting user scores to ./user_scores.sm.js, that
// automatically convert the input floating point score to an appropriate
// hex-encoded score, looking at the quality's metric to get the right
// encoding. 
export function postUserScore(
  qualIdent, subjIdent, score, payloadHex = undefined
) {
  let qualIDProm = fetchEntityIDIfPath(qualIdent);
  let subjIDProm = fetchEntityIDIfPath(subjIdent);
  let metricProm = fetchMetric(qualIdent);
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










// A function to fetch whole score--weight list.
export function fetchScoreAndWeightList(
  tableFilePath, qualIdent, otherListIDsOrPaths, lo, hi, maxNum, numOffset,
  isAscending,
) {
  return new Promise(resolve => {
    fetchScoreHexList(
      tableFilePath, qualIdent, otherListIDsOrPaths, lo, hi, maxNum, numOffset,
      isAscending,
    ).then(list => {
      resolve(map(list, ([entID, scoreAndWeightHex]) => {
        let [score, weight] = arrayFromHex(
          scoreAndWeightHex, ["float(,,3)", "float(,,1)"]
        );
        return [entID, score, weight];
      }));
    });
  });
}


// A function to fetch the hex-encoded score of any BTT table.
export function fetchScoreHexList(
  tableFilePath, qualIdent, otherListIDsOrPaths, lo, hi, maxNum, numOffset,
  isAscending,
) {
  return new Promise(resolve => {
    let qualIDProm = fetchEntityIDIfPath(qualIdent);
    let otherListPartsPromArr = map(
      otherListIDsOrPaths, idOrPath => fetchEntityIDIfPath(idOrPath)
    );
    Promise.all([
      qualIDProm, ...otherListPartsPromArr
    ]).then(([...listParts]) => {
      let listID = join(listParts, "&");
      fetch(
        tableFilePath + "skList/l=" + listID +
        (lo === undefined ? "" : "/lo=" + lo) +
        (hi === undefined ? "" : "/hi=" + hi) +
        (maxNum === undefined ? "" : "/n=" + maxNum) +
        (numOffset === undefined ? "" : "/o=" + numOffset) +
        (isAscending === undefined ? "" : "/a=" + isAscending)
      ).then(
        list => resolve(list)
      );
    });
  });
}
