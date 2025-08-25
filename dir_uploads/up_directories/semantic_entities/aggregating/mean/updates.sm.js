


import homePath from "./.id.js";
import {post, fetch} from 'query';
import {verifyType} from 'types';
import {hexToValue} from 'hex';
import {floor} from 'math';
import {
  fetchEntityIDIfPath, fetchUserWeight, fetchUserScore,
  fetchUserScoreHexAndMetric, getFloatScore
} from "../../scores.js";




export function updateScore(
  qualIDOrPath, subjIDOrPath, userID, userGroupIDOrPath
) {
  verifyType(userID, "hex-string");

  return new Promise(resolve => {
    let qualIDProm = fetchEntityIDIfPath(qualIDOrPath);
    let subjIDProm = fetchEntityIDIfPath(subjIDOrPath);
    let userGroupIDProm = fetchEntityIDIfPath(subjIDOrPath);
    let userWeightProm = fetchUserWeight(userID, userGroupIDOrPath);

    Promise.all([
      qualIDProm, subjIDProm, userGroupIDProm
    ]).then(([qualID, subjID, userGroupID]) => {
      let curUserScoreProm = fetchUserScore(qualID, subjID, userID);
      let prevUserScoreProm = fetch
    });

  });
}

function updateScoreHelper(qualID, subjID, userID, userWeightProm, resolve) {
}


