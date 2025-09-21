


import homePath from "./.id.js";
import {fetch, noPost} from 'query';
import {map, join} from 'array';
import {min} from 'math';
import {hexToArray, valueToHex, arrayToHex} from 'hex';
import {fetchEntityID, fetchEntityDefinition} from "./entities.js";



// Function to fetch user scores uploaded via ./user_scores.sm.js.
export function fetchUserScore(qualKey, subjKey, userKey) {
  return new Promise(resolve => {
    Promise.all([
      fetchUserScoreHex(qualKey, subjKey, userKey),
      fetchMetric(qualKey)
    ]).then(([userScoreHex, metric]) => {
      if (userScoreHex === undefined) return undefined;
      let userScore = getFloatScore(userScoreHex, metric);
      resolve(userScore);
    });
  });
}

// Helper function to fetch user scores uploaded via ./user_scores.sm.js, which
// we will nonetheless also export.
export function fetchUserScoreHex(qualKey, subjKey, userKey) {
  let qualIDProm = fetchEntityID(qualKey);
  let subjIDProm = fetchEntityID(subjKey);
  let userIDProm = fetchEntityID(userKey);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, userIDProm
    ]).then(([qualID, subjID, userID]) => {
      let listIDHex = valueToHex(qualID + "+" + userID, "string");
      fetch(
        homePath + "/userScores.bbt/l=" + listIDHex + "/k=" + subjID
      ).then(
        ([userScoreHex]) => resolve(userScoreHex)
      );
    });
  });
}


export function fetchMetric(qualKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(qualKey).then(
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




// Function to fetch a list of user-scored entities.
export function fetchUserScoreList(
  qualKey, userKey, lo, hi, maxNum, offset, isAscending
) {
  return new Promise(resolve => {
    Promise.all([
      fetchUserScoreHexList(
        qualKey, userKey, lo, hi, maxNum, offset, isAscending
      ),
      fetchMetric(qualKey)
    ]).then(([userScoreHexList, metric]) => {
      let userScoreList = map(userScoreHexList, ([subjID, userScoreHex]) => (
        [subjID, getFloatScore(userScoreHex, metric)]
      ));
      resolve(userScoreList);
    });
  });
}

// Helper function to fetch user-scored list.
export function fetchUserScoreHexList(
  qualKey, userKey, lo, hi, maxNum, offset, isAscending
) {
  let qualIDProm = fetchEntityID(qualKey);
  let userIDProm = fetchEntityID(userKey);
  return new Promise(resolve => {
    Promise.all([qualIDProm, userIDProm]).then(([qualID, userID]) => {
      let listIDHex = valueToHex(qualID + "+" + userID, "string");
      fetch(
        homePath + "/userScores.bbt/skList/l=" + listIDHex +
        (lo === undefined ? "" : "/lo=" + lo) +
        (hi === undefined ? "" : "/hi=" + hi) +
        (maxNum === undefined ? "" : "/n=" + maxNum) +
        (offset === undefined ? "" : "/o=" + offset) +
        (isAscending === undefined ? "" : "/a=" + isAscending)
      ).then(
        (userScoreHexList = []) => resolve(userScoreHexList)
      );
    });
  });
}





// A function that can be used to get aggregated scores, including ones that
// are stored in foreign home directories. This function assumes that the score
// column is actually a float(,,3),float(,,1) array, where the first float is
// the score (ignoring bounds), and the second float is the weight of the score.
export function fetchScoreAndWeight(
  tableFilePath, listIDKeyArr, subjKey
) {
  return new Promise(resolve => {
    fetchScoreHex(
      tableFilePath, listIDKeyArr, subjKey
    ).then(scoreAndWeightHex => {
      if (scoreAndWeightHex === undefined) return [];
      let [score, weight] = arrayFromHex(
        scoreAndWeightHex, ["float(,,3)", "float(,,1)"]
      );
      resolve([score, weight, scoreAndWeightHex]);
    });
  });
}


// A function to fetch the hex-encoded score of any BBT table.
export function fetchScoreHex(
  tableFilePath, listIDKeyArr, subjKey
) {
  return new Promise(resolve => {
    let keyIDProm = fetchEntityID(subjKey);
    let listIDPartsPromArr = map(
      listIDKeyArr, entKey => fetchEntityID(entKey)
    );
    Promise.all([
      keyIDProm, ...listIDPartsPromArr
    ]).then(([keyID, ...listIDParts]) => {
      let listID = join(listIDParts, "+");
      let listIDSegment = listID ? "/l=" + valueToHex(listID, "string") : "";
      fetch(
        tableFilePath + listIDSegment + "/k=" + keyID
      ).then(
        ([scoreAndWeightHex]) => resolve(scoreAndWeightHex)
      );
    });
  });
}



// A function to fetch whole score--weight list.
export function fetchScoreAndWeightList(
  tableFilePath, listIDKeyArr, lo, hi, maxNum, offset,
  isAscending,
) {
  return new Promise(resolve => {
    fetchScoreHexList(
      tableFilePath, listIDKeyArr, lo, hi, maxNum, offset, isAscending,
    ).then(list => {
      resolve(map(list, ([subjID, scoreAndWeightHex]) => {
        let [score, weight] = arrayFromHex(
          scoreAndWeightHex, ["float(,,3)", "float(,,1)"]
        );
        return [subjID, score, weight];
      }));
    });
  });
}


// A function to fetch the hex-encoded score of any BBT table.
export function fetchScoreHexList(
  tableFilePath, listIDKeyArr, lo, hi, maxNum, offset, isAscending,
) {
  return new Promise(resolve => {
    let listIDPartsPromArr = map(
      listIDKeyArr, entKey => fetchEntityID(entKey)
    );
    Promise.all(
      listIDPartsPromArr
    ).then(listIDParts => {
      let listID = join(listIDParts, "+");
      let listIDSegment = listID ? "/l=" + valueToHex(listID, "string") : "";
      fetch(
        tableFilePath + "/skList" + listIDSegment +
        (lo === undefined ? "" : "/lo=" + lo) +
        (hi === undefined ? "" : "/hi=" + hi) +
        (maxNum === undefined ? "" : "/n=" + maxNum) +
        (offset === undefined ? "" : "/o=" + offset) +
        (isAscending === undefined ? "" : "/a=" + isAscending)
      ).then(
        list => resolve(list)
      );
    });
  });
}





// postScoreAndWeight() and postScoreHexAndWeightHex() are the reverse
// functions of the two fetch functions above. These functions can be imported
// by used SMs that want to store score tables using the float(,,3),float(,,1)
// array convention (of score and weight).
export function postScoreAndWeight(
  tableFilePath, listIDKeyArr, subjKey, score, weight
) {
  return new Promise(resolve => {
    let scoreAndWeightHex = arrayToHex(
      [score, weight], ["float(,,3)", "float(,,1)"]
    );
    postScoreAndWeightHex(
      tableFilePath, listIDKeyArr, subjKey, scoreAndWeightHex
    ).then(
      wasUpdated => resolve(wasUpdated)
    );
  });
}

export function postScoreAndWeightHex(
  tableFilePath, listIDKeyArr, subjKey, scoreAndWeightHex
) {
  return new Promise(resolve => {
    let keyIDProm = fetchEntityID(subjKey);
    let listIDPartsPromArr = map(
      listIDKeyArr, entKey => fetchEntityID(entKey)
    );
    Promise.all([
      keyIDProm, ...listIDPartsPromArr
    ]).then(([keyID, ...listIDParts]) => {
      let listID = join(listIDParts, "+");
      let listIDSegment = listID ? "/l=" + valueToHex(listID, "string") : "";
      post(
        tableFilePath + "/_insert" + listIDSegment + "/k=" + keyID +
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
  tableFilePath, listIDKeyArr, subjKey
) {
  return new Promise(resolve => {
    let keyIDProm = fetchEntityID(subjKey);
    let listIDPartsPromArr = map(
      listIDKeyArr, entKey => fetchEntityID(entKey)
    );
    Promise.all([
      keyIDProm, ...listIDPartsPromArr
    ]).then(([keyID, ...listIDParts]) => {
      let listID = join(listIDParts, "+");
      let listIDSegment = listID ? "/l=" + valueToHex(listID, "string") : "";
      post(
        tableFilePath + "/_deleteEntry" + listIDSegment + "/k=" + keyID
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
  qualKey, subjKey, userKey, score, payloadHex = undefined
) {
  let qualIDProm = fetchEntityID(qualKey);
  let subjIDProm = fetchEntityID(subjKey);
  let userIDProm = fetchEntityID(userKey);
  let metricProm = fetchMetric(qualKey);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, userIDProm, metricProm
    ]).then(([qualID, subjID, userID, metric]) => {
      let scoreHex = getScoreHex(score, metric);
      post(
        homePath + "/user_scores.sm.js/callSMF/postUserScoreHex",
        [qualID, subjID, userID, scoreHex, payloadHex]
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  });
}












export function fetchUserWeight(userGroupKey, userKey) {
  return new Promise(resolve => {
    fetchUserWeightData(userGroupKey, userKey).then(
      ([weight]) => resolve(weight)
    );
  });
}

export function fetchUserWeightData(userGroupKey, userKey) {
  return new Promise(resolve => {
    fetchUserListKey(userGroupKey).then(userListKey => {
      fetchScoreDataFromScoredList(userListKey, userKey).then(
        (weightData) => resolve(weightData)
      );
    });
  });
}

export function fetchUserListKey(userGroupKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(userGroupKey).then(userGroupDef => {
console.log(userGroupKey);console.log(userGroupDef);
      let userListKey = userGroupDef["User list"];
      if (!userListKey) throw (
        "No user list found for User group " + userGroupKey
      );
      resolve(userListKey);
    });
  });
}

export function fetchScoreDataFromScoredList(listKey, subjKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(listKey).then(listDef => {
      noPost(() => {
        listDef.fetchScoreData(subjKey).then(
          scoreData => resolve(scoreData)
        );
      });
    });
  });
}


export function fetchUserList(
  userGroupKey, lo, hi, maxNum, offset, isAscending
) {

}
