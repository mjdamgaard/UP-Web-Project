


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
  qualIDOrPath, subjIDOrPath, userID, userGroupPath
) {
  verifyType(userID, "hex-string");

  return new Promise(resolve => {
    let qualIDProm = fetchEntityIDIfPath(qualIDOrPath);
    let subjIDProm = fetchEntityIDIfPath(subjIDOrPath);

    // Create a promise for the user wight
    let userWeightProm = new Promise(res => {
      fetch(userGroupPath).then(userGroupAggregator => {
        userGroupAggregator.fetchScore(userID).then(userWeight => {
          res(userWeight);
        });
      }); 
    });

    Promise.all([qualIDProm, subjIDProm]).then(([qualID, subjID]) => {
      updateScoreHelper(qualID, subjID, userID, userWeightProm, resolve);
    });

  });
}

function updateScoreHelper(qualID, subjID, userID, userWeightProm, resolve) {
  let curUserScoreProm = new Promise(res => {
    fetchUserScoreHexAndMetric(qualID, subjID, userID).then(
      ([userScoreHex, metric]) => {
        let userScore = getFloatScore(userScoreHex, metric);
        res(userScore);
      }
    );
  });
}


