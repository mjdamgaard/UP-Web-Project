
// An admin-only server module for uploading initial entities, as well as some
// initial scores. 

import homePath from "./.id.js";
import {checkAdminPrivileges} from 'request';
import {post} from 'query';
import {
  fetchEntityID, postAllEntitiesFromModule, postRelevancyQuality,
} from "./entities.js";

const trustedQualKey = abs("./em1.js;get/trusted");


export function uploadInitialEntities() {
  // Only the admin can call this SMF (from a program such as update.dir.js,
  // and not from an UP app).
  checkAdminPrivileges();

  return Promise.all([
    postAllEntitiesFromModule(homePath + "/em1.js"),
    postAllEntitiesFromModule(
      homePath + "/score_handling/ScoreHandler01/em.js"
    ),
  ]);
}



export function insertInitialModerators() {
  // Only the admin can call this SMF.
  checkAdminPrivileges();

  return new Promise(resolve => {
    fetchEntityID(trustedQualKey).then(qualID => {
      post(
        homePath + "/score_handling/ScoreHandler01/init_mods.bbt/_put"
      ).then(() => {
        post(
          homePath + "/score_handling/ScoreHandler01/init_mods.bbt" +
            "/_insertList/l=" + qualID,
          initialModerators
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  });
}

// A [([userEntID, weightHex],)*] array over all the initial moderators, and
// their weights. (This object can be edited.) 
export const initialModerators = [
  // Some initial "test moderators":
  ["1", hexFromArray([20, 20], ["float(,,3)", "float(,,1)"])],
  ["2", hexFromArray([15, 20], ["float(,,3)", "float(,,1)"])],
  ["3", hexFromArray([10, 20], ["float(,,3)", "float(,,1)"])],
  ["4", hexFromArray([10, 20], ["float(,,3)", "float(,,1)"])],
  ["5", hexFromArray([5, 20], ["float(,,3)", "float(,,1)"])],
  ["6", hexFromArray([5, 20], ["float(,,3)", "float(,,1)"])],
  ["7", hexFromArray([5, 20], ["float(,,3)", "float(,,1)"])],
  ["8", hexFromArray([5, 20], ["float(,,3)", "float(,,1)"])],
  // TODO: Add some actual moderators when there are some.
];






export function postScoresFromInitialModerators(step = 0) {
  // Only the admin can call this SMF.
  checkAdminPrivileges();

  // We use the step argument and step counter as a hack to be able to avoid
  // a callback hell, without having access to async functions, and also in
  // order to report back at which step the function failed, if it does so. 
  let stepCounter = 0;
  try {
    if (step === stepCounter++) {
      return new Promise(resolve => {
        // TODO: Do something.

        // Go to the next step. (This should be wrapped in a promise.)
        postScoresFromInitialModerators(stepCounter).then(
          res => resolve(res)
        );
      });
    }
    else if (step === stepCounter++) {
      return new Promise(resolve => {
        // TODO: Do something.

        // Go to the next step. (This should be wrapped in a promise.)
        postScoresFromInitialModerators(stepCounter).then(
          res => resolve(res)
        );
      });
    }
  }
  catch (err) {
    throw "Error at step = " + step + ": " + err;
  }

  // If all the step succeeded, return a promise that resolves with true.
  return new Promise(resolve => resolve(true))
}



