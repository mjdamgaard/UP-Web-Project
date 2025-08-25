


import homePath from "./.id.js";
import {fetch} from 'query';
import {hexToValue} from 'hex';
import {
  fetchEntityIDIfPath, fetchEntityDefinition,
} from "../../entities.sm.js";



export function fetchUserWeight(userID, userGroupPath) {
  return new Promise(resolve => {
    fetch(userGroupPath).then(userGroupAggregator => {
      userGroupAggregator.fetchScore(userID).then(userWeight => {
        resolve(userWeight);
      });
    });
  }); 
}

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
  let sigLen = userScoreHex.length / 2 - (lo || hi ? 1 : 0);
  let type = "float(" + lo + "," + hi + "," + sigLen + ")";
  return hexToValue(userScoreHex, type);
}


