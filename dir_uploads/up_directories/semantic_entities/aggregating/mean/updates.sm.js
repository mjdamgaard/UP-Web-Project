
import {getConnection} from 'connection';
import {
  fetchUserWeight, fetchUserScore, fetchScoreAndWeight, postScoreAndWeight,
  deleteScore, updateUserWeight,
} from "../../scores.js";
import {fetchEntityID, fetchOrCreateEntityID} from "../../entities.js";

const contributionsPath = abs("./contributions.bbt");
const aggrPath = abs("./aggregates.bbt");




export function updateScoreForUser(
  userGroupKey, qualKey, subjKey, userKey
) {
  return new Promise(resolve => {
    let userGroupIDProm = fetchEntityID(userGroupKey);
    let qualIDProm = fetchOrCreateEntityID(qualKey);
    let subjIDProm = fetchEntityID(subjKey);
    let userIDProm = fetchEntityID(userKey);
    updateUserWeight(userGroupKey, userKey).then(() => {
      let userWeightProm = fetchUserWeight(userGroupKey, userKey);
      Promise.all([
        userGroupIDProm, qualIDProm, subjIDProm, userIDProm
      ]).then(([userGroupID, qualID, subjID, userID]) => {
        if (!userGroupID || !qualID || !subjID || !userID) {
          throw "Missing " +(
            !userGroupID ? "userGroupID at " + userGroupKey :
            !qualID ? "qualID at " + qualKey :
            !subjID ? "subjID at " + subjKey :
            "userID at " + userKey
          );
        }

        // Get a database connection, already started, and with a lock already
        // gotten lock with a name that contains after userGroupID, qualID, and
        // subjID.
        let lockName = abs("./") + "/" + userGroupID + "/" + qualID +
          "/" + subjID;
        getConnection(10000, true, lockName).then(conn => {
          let options = {connection: conn};

          // Get the current user score from the userScores.bbt table, and the
          // previous score contributed to this aggregate, if any.
          let curUserScoreProm = fetchUserScore(
            qualID, subjID, userID, options
          );
          let prevUserScoreAndWeightProm = fetchScoreAndWeight(
            contributionsPath, [qualID, userGroupID, subjID], userID,
            undefined, undefined, options
          );
          let prevMeanAndCombWeightProm = fetchScoreAndWeight(
            aggrPath, [qualID, userGroupID], subjID,
            undefined, undefined, options
          );

          Promise.all([
            userWeightProm, curUserScoreProm, prevMeanAndCombWeightProm,
            prevUserScoreAndWeightProm,
          ]).then(([
            userWeight = 0, curUserScore, [prevMean = 0, prevCombWeight = 0],
            [prevScore = 0, prevWeight = 0],
          ]) => {
            // If the user score exists and user weight is above 0, insert the
            // current score in the contributions table, and otherwise delete
            // any existing contribution.
            if (typeof curUserScore !== "number") {
              userWeight = curUserScore = 0;
            }
            let contributionUpdateProm;
            if (userWeight > 0) {
              contributionUpdateProm = postScoreAndWeight(
                contributionsPath, [qualID, userGroupID, subjID], userID,
                curUserScore, userWeight, undefined, undefined, options
              );
            } else {
              contributionUpdateProm = deleteScore(
                contributionsPath, [qualID, userGroupID, subjID], userID,
                options
              );
            }

            // Then update the mean aggregate and combined weight.
            contributionUpdateProm.then(() => {
              let newCombWeight = prevCombWeight - prevWeight + userWeight;
              let newMean = (newCombWeight <= 0) ? 0 : (
                prevMean * prevCombWeight +
                curUserScore * userWeight - prevScore * prevWeight
              ) / newCombWeight;
              postScoreAndWeight(
                aggrPath, [qualID, userGroupID], subjID, newMean, newCombWeight,
                undefined, undefined, options
              ).then(wasUpdated => {
                conn.end();
                resolve(wasUpdated);
              });
            });
          });
        });
      });
    });
  });
}


export function updateScoreForGroup() {
  // TODO: Implement.
  return new Promise(resolve => resolve());
}

export function updateList() {
  // TODO: Implement.
  return new Promise(resolve => resolve());
}



// export function updateScoreForGroup(
//   userGroupKey, qualKey, subjKey
// ) {
//   return new Promise(resolve => {
//     let qualIDProm = fetchEntityID(qualKey);
//     let subjIDProm = fetchEntityID(subjKey);
//     let userGroupIDProm = fetchEntityID(userGroupKey);
//     let userListProm = fetchUserList(userGroupKey);

//     Promise.all([
//       qualIDProm, subjIDProm, userGroupIDProm, userListProm
//     ]).then(([qualID, subjID, userGroupID, userList]) => {
//       forEach(userList, ([userID, _]) => {
//         updateScoreForUser(user) // ...
//       });
//     });
//   });
// }
