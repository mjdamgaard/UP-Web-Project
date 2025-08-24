


import homePath from "./.id.js";
import {post, fetch} from 'query';
import {verifyType} from 'types';
import {valueFromHex} from 'hex';
import {floor} from 'math';
import {fetchEntityID} from "../../entities.sm.js";



export function fetchEntityIDIfPath(entIDOrPath) {
  return (entIDOrPath[0] === "/") ? fetchEntityID(entIDOrPath) :
    new Promise(res => res(entIDOrPath));
}

export function fetchUserWeight(userID, userGroupPath) {
  return new Promise(resolve => {
    fetch(userGroupPath).then(userGroupAggregator => {
      userGroupAggregator.fetchScore(userID).then(userWeight => {
        resolve(userWeight);
      });
    });
  }); 
}

export function fetchUserScore(qualID, subjID, userID) {
  return new Promise(resolve => {
    fetchUserScoreHexAndMetric(qualID, subjID, userID).then(
      ([userScoreHex, metric]) => {
        let userScore = getFloatScore(userScoreHex, metric);
        resolve(userScore);
      }
    );
  });
}

export function fetchUserScoreHexAndMetric(qualID, subjID, userID) {
  // TODO: Implement.
}

// export function getFloatScore(userScoreBase64, metric) {
//   let lo = metric["Lower limit"] ?? "";
//   let hi = metric["Upper limit"] ?? "";
//   let len = floor(userScoreBase64.length * 3 / 4) 
//   let type = "float(" + lo + "," + hi + ","
// }

export function getFloatScore(userScoreHex, metric) {
  let lo = metric["Lower limit"] ?? "";
  let hi = metric["Upper limit"] ?? "";
  let len = userScoreBase64.length / 2 - (lo || hi ? 1 : 0);
  let type = "float(" + lo + "," + hi + "," + len + ")";
  return valueFromHex(userScoreHex, type);
}



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


