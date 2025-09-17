
// An admin-only server module for uploading initial entities, as well as some
// initial scores. 

import homePath from "./.id.js";
import {checkAdminPrivileges} from 'request';
import {post, upNodeID} from 'query';
import {map} from 'array';
import {valueToHex} from 'hex';
import {getSequentialPromise} from 'promise';
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
    let transformedInitialModeratorListProm = Promise.all(
      map(initialModerators, ([userID, weight, weightWeight]) => {
        return new Promise(resolve => {
          let userEntPath = homePath + "/em1.js;call/User/" + userID +
            "/" + upNodeID;
          let scoreHex = hexFromArray(
            [weight, weightWeight], ["float(,,3)", "float(,,1)"]
          );
          post(
            homePath + "/entities.sm.js/callSMF/postEntity", userEntPath
          ).then(
            userEntID => resolve([userEntID, scoreHex])
          );
        }); 
      })
    );
    transformedInitialModeratorListProm.then(initModList => {
      fetchEntityID(trustedQualKey).then(qualID => {
        post(
          homePath + "/score_handling/ScoreHandler01/init_mods.bbt/_put"
        ).then(() => {
          post(
            homePath + "/score_handling/ScoreHandler01/init_mods.bbt" +
              "/_insertList/l=" + qualID,
            initModList
          ).then(
            wasUpdated => resolve(wasUpdated)
          );
        });
      });
    });
  });
}

// A [([userID, weight, weightWeight],)*] array over all the initial
// moderators, and their weights. (This object can be edited.) 
export const initialModerators = [
  // Some initial "test moderators":
  ["1", 20, 20],
  ["2", 15, 20],
  ["3", 10, 20],
  ["4", 10, 20],
  ["5", 5, 20],
  ["6", 5, 20],
  ["7", 5, 20],
  ["8", 5, 20],

  // TODO: Add some actual moderators when there are some.
];






export function postScoresFromInitialModerators() {
  // Only the admin can call this SMF.
  checkAdminPrivileges();

  // Fetch the moderator IDs.
  let initModeratorIDArrProm = Promise.all(
    map(initialModerators, ([userID]) => {
      return new Promise(res => {
        let userEntPath = homePath + "/em1.js;call/User/" + userID +
          "/" + upNodeID;
        fetch(
          homePath + "/entities.sm.js/callSMF/postEntity", userEntPath
        ).then(
          userEntID => res(userEntID)
        );
      }); 
    })
  );

  // We construct an array of promises to be executed in sequence, via a call
  // to getSequentialPromise() below.
  let initModArr;
  let promiseCallbackArr = [
    // First "wait for" the initial moderator array, and then store it in the
    // initModArr variable such that we don't need to carry that around. (When
    // getSequentialPromise() receives a callback that does not return a
    // promise, it just skips to the next callback (passing the return value of
    // the former as an argument to the latter).)
    () => initModeratorIDArrProm,
    (initModeratorArr) => {
      initModArr = initModeratorArr;
    },

    // Post some trust scores from the first moderator to the other ones, and
    // also themselves (which normally doesn't really make sense, but here it
    // does). TODO: Redirect to another function that also updates all user
    // groups in an array.
    () => {
      let firstModID = initModArr[0];
      let trustScoreArr = [9, 9, 9, 8, 8, 6, 6];
      return getSequentialPromise(map(initModArr, (modID, ind) => {
        let score = trustScoreArr[ind] ?? 5;
        let scoreHex = valueToHex(score, "float(-10,10,1)");
        return () => postUserScoreHex(
          trustedQualKey, modID, firstModID, scoreHex
        );
      }));
    },

    // TODO: Continue.
  ];

  return getSequentialPromise(promiseCallbackArr);

}






// This function is essentially a copy of postUserScoreHex() from
// user_scores.sm.js, only without the authentication and validation.
// (Obviously do not export this function, unless adding an
// checkAdminPrivileges() call.)
function postUserScoreHex(
  qualKey, subjKey, userKey, scoreHex, payloadHex = undefined
) {
  let qualIDProm = fetchEntityID(qualKey);
  let subjIDProm = fetchEntityID(subjKey);
  let userEntIDProm = fetchEntityID(userKey);
  return new Promise(resolve => {
    Promise.all([
      qualIDProm, subjIDProm, userEntIDProm
    ]).then(([qualID, subjID, userEntID]) => {
      let listID = qualID + "&" + userEntID;
      post(homePath + "/users.bt/_insert/k=" + userEntID);
      post(
        homePath + "/userScores.bbt/_insert/l=" + listID + "/k=" + subjID +
        "/s=" + scoreHex + (payloadHex ? "/p=" + payloadHex : "")
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  });
}




function postUserPredicateScoreAndUpdateUserGroups(
  qualKey, subjKey, userKey, score, userGroupKeyArr
) {
  let scoreHex = valueToHex(score, "float(-10,10,1)");
  postUserScoreHex(qualKey, subjKey, userKey, scoreHex).then(() => {
    
  });
}




