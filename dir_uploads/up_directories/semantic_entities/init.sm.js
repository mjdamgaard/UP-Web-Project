
// An admin-only server module for uploading initial entities, as well as some
// initial scores. 

import homePath from "./.id.js";
import {checkAdminPrivileges} from 'request';
import {post, upNodeID} from 'query';
import {map} from 'array';
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

    // Post some trust scores for the first moderator.
    () => {

    },
  ];

  return getSequentialPromise(promiseCallbackArr);

}






// export function postScoresFromInitialModerators(step = 0, carry = {}) {
//   // Only the admin can call this SMF.
//   checkAdminPrivileges();

//   // We use the step argument and step counter as a hack to be able to avoid
//   // a callback hell, without having access to async functions, and also in
//   // order to report back at which step the function failed, if it does so. 
//   let stepCounter = 0;
//   try {
//     // First get an array of the (entity) IDs of the initial moderator.
//     if (step === stepCounter++) {
//       return new Promise(resolve => {
//         // Fetch the moderator IDs.
//         let initModeratorIDArrProm = Promise.all(
//           map(initialModerators, ([userID]) => {
//             return new Promise(res => {
//               let userEntPath = homePath + "/em1.js;call/User/" + userID +
//                 "/" + upNodeID;
//               fetch(
//                 homePath + "/entities.sm.js/callSMF/postEntity", userEntPath
//               ).then(
//                 userEntID => res(userEntID)
//               );
//             }); 
//           })
//         );

//         // Then go to the next step, carrying over the initModeratorIDArr.
//         initModeratorIDArrProm.then(initModeratorIDArr => {
//           let carry = {initModeratorIDArr: initModeratorIDArr};
//           postScoresFromInitialModerators(stepCounter, carry).then(
//             result => resolve(result)
//           );
//         });
//       });
//     }

//     // Then upload some trust scores among the moderators.
//     else if (step === stepCounter++) {
//       let {initModeratorIDArr} = carry;
//       return new Promise(resolve => {
//         // TODO: Do something.

//         // Go to the next step. (This should be wrapped in a promise.)
//         postScoresFromInitialModerators(stepCounter).then(
//           res => resolve(res)
//         );
//       });
//     }
//   }
//   catch (err) {
//     throw "Error at step = " + step + ": " + err;
//   }

//   // If all the step succeeded, return a promise that resolves with true.
//   return new Promise(resolve => resolve(true))
// }



