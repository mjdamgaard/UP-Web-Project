


import homePath from "./.id.js";
import {post} from 'query';
import {verifyType} from 'types';
import {fetchEntityID} from "../../entities.sm.js";



export function fetchEntityIDIfPath(entIDOrPath) {
  return (entIDOrPath[0] === "/") ? fetchEntityID(entIDOrPath) :
    new Promise(res => res(entIDOrPath));
}

export function getFloatScore(userScoreBase64, metric) {
  // TODO: Implement.
}




export function updateScore(
  qualIDOrPath, subjIDOrPath, userID, userGroupPath
) {
  verifyType(userID, "hex-string");

  return new Promise(resolve => {
    let qualIDPromise = fetchEntityIDIfPath(qualIDOrPath);
    let subjIDPromise = fetchEntityIDIfPath(subjIDOrPath);
    
    let curUserScorePromise = new Promise(res => {
      Promise.all(
        [qualIDPromise, subjIDPromise]
      ).then(([qualID, subjID]) => {
        fetchUserScoreAndMetric(qualID, subjID, userID).then(
          ([userScoreBase64, metric]) => {
            let userScore = getFloatScore(userScoreBase64, metric);
            resolve(userScore);
          }
        );
      });
    });

    let userWeightPromise = "...";

  });
}



export function fetchUserScoreAndMetric(qualID, subjID, userID) {
  // TODO: Implement.
}
