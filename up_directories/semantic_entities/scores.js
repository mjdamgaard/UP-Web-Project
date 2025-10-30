


import homePath from "./.id.js";
import {fetch, post, clearPermissions} from 'query';
import {map, join} from 'array';
import {min} from 'math';
import {hexToArray, valueToHex, arrayToHex} from 'hex';
import {fetchEntityID, fetchEntityDefinition} from "./entities.js";



// Function to fetch user scores uploaded via ./user_scores.sm.js.
export function fetchUserScore(qualKey, subjKey, userKey, options = undefined) {
  return new Promise(resolve => {
    Promise.all([
      fetchUserScoreHex(qualKey, subjKey, userKey, options),
      fetchMetric(qualKey)
    ]).then(([userScoreHex, metric]) => {
      if (!userScoreHex) {
        return resolve(undefined);
      };
      let userScore = getFloatScore(userScoreHex, metric);
      resolve(userScore);
    });
  });
}

// Helper function to fetch user scores uploaded via ./user_scores.sm.js, which
// we will nonetheless also export.
export function fetchUserScoreHex(
  qualKey, subjKey, userKey, options = undefined
) {
  let qualIDProm = fetchEntityID(qualKey);
  let subjIDProm = fetchEntityID(subjKey);
  let userIDProm = fetchEntityID(userKey);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, userIDProm
    ]).then(([qualID, subjID, userID]) => {
      let listIDHex = valueToHex(qualID + "+" + userID, "string");
      fetch(
        homePath + "/userScores.bbt/entry/l=" + listIDHex + "/k=" + subjID,
        options
      ).then(entry => {
        let [userScoreHex] = entry ?? [];
        resolve(userScoreHex ?? undefined);
      });
    });
  });
}


// TODO: At some point we probably want to query a 'Metric' relation instead of
// always just taking the 'Metric' attribute.

const relationalQualitiesPath = abs("./em1.js;get/relationalQualities");

export function fetchMetric(qualKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(qualKey).then(qualDef => {
      // If the quality is a relational one, get the metric from the relation
      // instead.
      if (qualDef["Class"] === relationalQualitiesPath) {
        fetchEntityDefinition(qualDef["Relation"]).then(relDef => {
          fetchEntityDefinition(relDef["Metric"]).then(
            metric => resolve(metric)
          );
        });
      }

      // Else get the metric from the quality.
      else {
        fetchEntityDefinition(qualDef["Metric"]).then(
          metric => resolve(metric ?? undefined)
        );
      }
    });
  });
}

export function getFloatScore(userScoreHex, metric) {
  let lo = metric["Lower limit"] ?? "";
  let hi = metric["Upper limit"] ?? "";
  let sigLen = min(6, userScoreHex.length / 2 - (lo || hi ? 0 : 1));
  let type = "float(" + lo + "," + hi + "," + sigLen + ")";
  let [[score]] = hexToArray(userScoreHex, [type], true);
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
  qualKey, userKey, loHex, hiHex, maxNum, offset, isAscending, options
) {
  return new Promise(resolve => {
    Promise.all([
      fetchUserScoreHexList(
        qualKey, userKey, loHex, hiHex, maxNum, offset, isAscending, options
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
  qualKey, userKey, loHex, hiHex, maxNum, offset, isAscending, options
) {
  let qualIDProm = fetchEntityID(qualKey);
  let userIDProm = fetchEntityID(userKey);
  return new Promise(resolve => {
    Promise.all([qualIDProm, userIDProm]).then(([qualID, userID]) => {
      let listIDHex = valueToHex(qualID + "+" + userID, "string");
      fetch(
        homePath + "/userScores.bbt/skList/l=" + listIDHex +
        (!loHex ? "" : "/lo=" + loHex) +
        (!hiHex ? "" : "/hi=" + hiHex) +
        (maxNum === undefined ? "" : "/n=" + maxNum) +
        (offset === undefined ? "" : "/o=" + offset) +
        (isAscending === undefined ? "" : "/a=" + isAscending ? "1" : "0"),
        options
      ).then(userScoreHexList => {
        userScoreHexList ??= [];
        resolve(userScoreHexList);
      });
    });
  });
}





// A function that can be used to get aggregated scores, including ones that
// are stored in foreign home directories.
export function fetchScoreAndWeight(
  tableFilePath, listIDKeyArr, subjKey, scoreSigLen = 3, weightSigLen = 3,
  options = undefined
) {
  return new Promise(resolve => {
    fetchScoreHex(
      tableFilePath, listIDKeyArr, subjKey, options
    ).then(scoreAndWeightHex => {
      if (!scoreAndWeightHex) {
        return resolve([]);
      }
      let [score, weight] = hexToArray(
        scoreAndWeightHex,
        ["float(,," + scoreSigLen + ")", "float(,," + weightSigLen + ")"]
      );
      resolve([score, weight, scoreAndWeightHex]);
    });
  });
}


// A function to fetch the hex-encoded score of any BBT table.
export function fetchScoreHex(
  tableFilePath, listIDKeyArr, subjKey, options = undefined
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
        tableFilePath + "/entry" + listIDSegment + "/k=" + keyID, options
      ).then(entry => {
        let [scoreAndWeightHex] = entry ?? [];
        resolve(scoreAndWeightHex ?? undefined);
      });
    });
  });
}



// A function to fetch whole score--weight list.
export function fetchScoreAndWeightList(
  tableFilePath, listIDKeyArr, loHex, hiHex, maxNum, offset,
  isAscending, scoreSigLen = 3, weightSigLen = 3, options = undefined
) {
  return new Promise(resolve => {
    fetchScoreHexList(
      tableFilePath, listIDKeyArr, loHex, hiHex, maxNum, offset, isAscending,
      options
    ).then(list => {
      let typeArr = [
        "float(,," + scoreSigLen + ")", "float(,," + weightSigLen + ")"
      ];
      resolve(map(list, ([subjID, scoreAndWeightHex]) => {
        let [score, weight] = hexToArray(scoreAndWeightHex, typeArr);
        return [subjID, score, weight];
      }));
    });
  });
}


// A function to fetch the hex-encoded score of any BBT table.
export function fetchScoreHexList(
  tableFilePath, listIDKeyArr, loHex, hiHex, maxNum, offset, isAscending,
  options
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
        (!loHex ? "" : "/lo=" + loHex) +
        (!hiHex ? "" : "/hi=" + hiHex) +
        (maxNum === undefined ? "" : "/n=" + maxNum) +
        (offset === undefined ? "" : "/o=" + offset) +
        (isAscending === undefined ? "" : "/a=" + isAscending ? "1" : "0"),
        options
      ).then(
        list => resolve(list)
      );
    });
  });
}





// postScoreAndWeight() and postScoreHexAndWeightHex() are the reverse
// functions of the two fetch functions above.
export function postScoreAndWeight(
  tableFilePath, listIDKeyArr, subjKey, score, weight,
  scoreSigLen = 3, weightSigLen = 3, options = undefined
) {
  return new Promise(resolve => {
    let typeArr = [
      "float(,," + scoreSigLen + ")", "float(,," + weightSigLen + ")"
    ];
    let scoreAndWeightHex = arrayToHex([score, weight], typeArr);
    postScoreAndWeightHex(
      tableFilePath, listIDKeyArr, subjKey, scoreAndWeightHex, options
    ).then(
      wasUpdated => resolve(wasUpdated)
    );
  });
}

export function postScoreAndWeightHex(
  tableFilePath, listIDKeyArr, subjKey, scoreAndWeightHex, options = undefined
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
        "/s=" + scoreAndWeightHex,
        undefined, options
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  });
}



// And deleteScore functions similarly to postScoreAndWeight, except it just
// deletes the entry.
export function deleteScore(
  tableFilePath, listIDKeyArr, subjKey, options = undefined
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
        tableFilePath + "/_deleteEntry" + listIDSegment + "/k=" + keyID,
        undefined, options
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
  qualKey, subjKey, userKey, score, payloadHex = undefined, options = undefined
) {
  let qualIDProm = fetchEntityID(qualKey);
  let subjIDProm = fetchEntityID(subjKey);
  let userIDProm = fetchEntityID(userKey);
  let metricProm = fetchMetric(qualKey);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, userIDProm, metricProm
    ]).then(([qualID, subjID, userID, metric]) => {
      // TODO: Verify hex-string types of the IDs here. 
      let scoreHex = getScoreHex(score, metric);
      post(
        homePath + "/user_scores.sm.js/callSMF/postUserScoreHex",
        [qualID, subjID, userID, scoreHex, payloadHex], options
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  });
}

export function deleteUserScore(
  qualKey, subjKey, userKey, options = undefined
) {
  let qualIDProm = fetchEntityID(qualKey);
  let subjIDProm = fetchEntityID(subjKey);
  let userIDProm = fetchEntityID(userKey);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, userIDProm
    ]).then(([qualID, subjID, userID]) => {
      // TODO: Verify hex-string types of the IDs here. 
      post(
        homePath + "/user_scores.sm.js/callSMF/deleteUserScore",
        [qualID, subjID, userID], options
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
      let userListKey = userGroupDef["User list"];
      if (!userListKey) throw (
        "No user list found for User group " + userGroupKey
      );
      resolve(userListKey);
    });
  });
}


export function updateUserWeight(userGroupKey, userKey) {
  return new Promise(resolve => {
    fetchUserListKey(userGroupKey).then(userListKey => {
      fetchEntityDefinition(userListKey).then(userListDef => {
        if (userListDef.updateScore) {
          userListDef.updateScore(userKey).then(
            wasUpdated => resolve(wasUpdated)
          );
        } else {
          resolve(true);
        }
      });
    });
  });
}



export function fetchScoreDataFromScoredList(listKey, subjKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(listKey).then(listDef => {
      clearPermissions(() => {
        listDef.fetchScoreData(subjKey).then(
          scoreData => resolve(scoreData)
        );
      });
    });
  });
}


export function fetchUserList(
  userGroupKey, loHex, hiHex, maxNum, offset, isAscending
) {

}
