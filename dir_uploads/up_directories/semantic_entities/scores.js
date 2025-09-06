


import homePath from "./.id.js";
import {fetch, noPost} from 'query';
import {map, join} from 'array';
import {min} from 'math';
import {hexToArray, valueToHex, hexFromArray} from 'hex';
import {
  fetchEntityID, fetchEntityDefinition,
} from "../../entities.sm.js";



// Function to fetch user scores uploaded via ./user_scores.sm.js.
export function fetchUserScore(qualIdent, subjIdent, userIdent) {
  return new Promise(resolve => {
    Promise.all([
      fetchUserScoreHex(qualIdent, subjIdent, userIdent),
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
export function fetchUserScoreHex(qualIdent, subjIdent, userIdent) {
  let qualIDProm = fetchEntityID(qualIdent);
  let subjIDProm = fetchEntityID(subjIdent);
  let userIDProm = fetchEntityID(userIdent);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, userIDProm
    ]).then(([qualID, subjID, userID]) => {
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




// Function to fetch a list of user-scored entities.
export function fetchUserScoreList(
  qualIdent, userIdent, lo, hi, maxNum, offset, isAscending
) {
  return new Promise(resolve => {
    Promise.all([
      fetchUserScoreHexList(
        qualIdent, userIdent, lo, hi, maxNum, offset, isAscending
      ),
      fetchMetric(qualIdent)
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
  qualIdent, userIdent, lo, hi, maxNum, offset, isAscending
) {
  let qualIDProm = fetchEntityID(qualIdent);
  let userIDProm = fetchEntityID(userIdent);
  return new Promise(resolve => {
    Promise.all([qualIDProm, userIDProm]).then(([qualID, userID]) => {
      let listID = qualID + "&" + userID;
      fetch(
        homePath + "/userScores.bbt/skList/l=" + listID +
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
  tableFilePath, listIDIdentArr, keyIdent
) {
  return new Promise(resolve => {
    fetchScoreHex(
      tableFilePath, listIDIdentArr, keyIdent
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
  tableFilePath, listIDIdentArr, keyIdent
) {
  return new Promise(resolve => {
    let keyIDProm = fetchEntityID(keyIdent);
    let listIDPartsPromArr = map(
      listIDIdentArr, entIdent => fetchEntityID(entIdent)
    );
    Promise.all([
      keyIDProm, ...listIDPartsPromArr
    ]).then(([keyID, ...listIDParts]) => {
      let listID = join(listIDParts, "&");
      let listIDSegment = listID ? "/l=" + listID : "";
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
  tableFilePath, listIDIdentArr, lo, hi, maxNum, offset,
  isAscending,
) {
  return new Promise(resolve => {
    fetchScoreHexList(
      tableFilePath, listIDIdentArr, lo, hi, maxNum, offset, isAscending,
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


// A function to fetch the hex-encoded score of any BTT table.
export function fetchScoreHexList(
  tableFilePath, listIDIdentArr, lo, hi, maxNum, offset, isAscending,
) {
  return new Promise(resolve => {
    let listIDPartsPromArr = map(
      listIDIdentArr, entIdent => fetchEntityID(entIdent)
    );
    Promise.all(
      listIDPartsPromArr
    ).then(listIDParts => {
      let listID = join(listIDParts, "&");
      let listIDSegment = listID ? "/l=" + listID : "";
      fetch(
        tableFilePath + "skList" + listIDSegment +
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
  tableFilePath, listIDIdentArr, keyIdent, score, weight
) {
  return new Promise(resolve => {
    let scoreAndWeightHex = hexFromArray(
      [score, weight], ["float(,,3)", "float(,,1)"]
    );
    postScoreAndWeightHex(
      tableFilePath, listIDIdentArr, keyIdent, scoreAndWeightHex
    ).then(
      wasUpdated => resolve(wasUpdated)
    );
  });
}

export function postScoreAndWeightHex(
  tableFilePath, listIDIdentArr, keyIdent, scoreAndWeightHex
) {
  return new Promise(resolve => {
    let keyIDProm = fetchEntityID(keyIdent);
    let listIDPartsPromArr = map(
      listIDIdentArr, entIdent => fetchEntityID(entIdent)
    );
    Promise.all([
      keyIDProm, ...listIDPartsPromArr
    ]).then(([keyID, ...listIDParts]) => {
      let listID = join(listIDParts, "&");
      let listIDSegment = listID ? "/l=" + listID : "";
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
  tableFilePath, listIDIdentArr, keyIdent
) {
  return new Promise(resolve => {
    let keyIDProm = fetchEntityID(keyIdent);
    let listIDPartsPromArr = map(
      listIDIdentArr, entIdent => fetchEntityID(entIdent)
    );
    Promise.all([
      keyIDProm, ...listIDPartsPromArr
    ]).then(([keyID, ...listIDParts]) => {
      let listID = join(listIDParts, "&");
      let listIDSegment = listID ? "/l=" + listID : "";
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
  qualIdent, subjIdent, userIdent, score, payloadHex = undefined
) {
  let qualIDProm = fetchEntityID(qualIdent);
  let subjIDProm = fetchEntityID(subjIdent);
  let userIDProm = fetchEntityID(userIdent);
  let metricProm = fetchMetric(qualIdent);
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












export function fetchUserWeight(userGroupIdent, userIdent) {
  return new Promise(resolve => {
    fetchUserWeightData(userGroupIdent, userIdent).then(
      ([weight]) => resolve(weight)
    );
  });
}

export function fetchUserWeightData(userGroupIdent, userIdent) {
  return new Promise(resolve => {
    fetchUserListIdent(userGroupIdent).then(userListIdent => {
      fetchScoreDataFromScoredList(userListIdent, userIdent).then(
        (weightData) => resolve(weightData)
      );
    });
  });
}

export function fetchUserListIdent(userGroupIdent) {
  return new Promise(resolve => {
    fetchEntityDefinition(userGroupIdent).then(userGroupDef => {
      let userListIdent = userGroupDef["User list"];
      resolve(userListIdent);
    });
  });
}

export function fetchScoreDataFromScoredList(listIdent, subjIdent) {
  return new Promise(resolve => {
    fetchEntityDefinition(listIdent).then(listDef => {
      noPost(() => {
        listDef.fetchScoreData(subjIdent).then(
          scoreData => resolve(scoreData)
        );
      });
    });
  });
}


export function fetchUserList(
  userGroupIdent, lo, hi, maxNum, offset, isAscending
) {

}
