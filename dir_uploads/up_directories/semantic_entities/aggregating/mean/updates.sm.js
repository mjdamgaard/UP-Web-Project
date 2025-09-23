
import {
  fetchUserWeight, fetchUserScore, fetchScoreAndWeight, postScoreAndWeight,
  deleteScore,
} from "../../scores.js";
import {fetchEntityID} from "../../entities.js";

const contributionsPath = abs("./contributions.bbt");
const aggrPath = abs("./aggregates.bbt");


// TODO: This, and other modules like it should use database transactions (by
// creating a persistent connection and passing it in the options argument of
// the post() calls) as soon as these are implemented and ready. *In fact, this
// algorithm is faulty (if several user's scores are updated at the same time),
// so implementing transactions is actually a semi-urgent todo. (And I should
// also make use of gas depositing and withdrawal for longer algorithms.)



export function updateScoreForUser(
  userGroupKey, qualKey, subjKey, userKey
) {
  return new Promise(resolve => {
    let userGroupIDProm = fetchEntityID(userGroupKey);
    let qualIDProm = fetchEntityID(qualKey);
    let subjIDProm = fetchEntityID(subjKey);
    let userIDProm = fetchEntityID(userKey);
    let userWeightProm = fetchUserWeight(userGroupKey, userKey);

    Promise.all([
      userGroupIDProm, qualIDProm, subjIDProm, userIDProm
    ]).then(([userGroupID, qualID, subjID, userID]) => {
      // Get the current user score from the userScores.bbt table, and the
      // previous score contributed to this aggregate, if any.
      let curUserScoreProm = fetchUserScore(qualID, subjID, userID, true);
      let prevUserScoreAndWeightProm = fetchScoreAndWeight(
        contributionsPath, [qualID, userGroupID, subjID], userID
      );
      let prevMeanAndCombWeightProm = fetchScoreAndWeight(
        aggrPath, [qualID, userGroupID], subjID
      );

      Promise.all([
        userWeightProm, curUserScoreProm, prevMeanAndCombWeightProm,
        prevUserScoreAndWeightProm,
      ]).then(([
        userWeight = 0, curUserScore = 0, [prevMean = 0, prevCombWeight = 0],
        [prevScore = 0, prevWeight = 0],
      ]) => {
        // If the user weight is above 0, insert the current score in the
        // contributions table, and otherwise delete any existing contribution. 
        if (userWeight > 0) {
          postScoreAndWeight(
            contributionsPath, [qualID, userGroupID, subjID], userID,
            curUserScore, userWeight
          );
        } else {
          deleteScore(
            contributionsPath, [qualID, userGroupID, subjID], userID
          );
        }

        // Then update the mean aggregate and combined weight.
        let newCombWeight = prevCombWeight + userWeight - prevWeight;
        let newMean = (newCombWeight <= 0) ? 0 : (
          prevMean * prevCombWeight +
          curUserScore * userWeight - prevScore * prevWeight
        ) / newCombWeight;
        postScoreAndWeight(
          aggrPath, [qualID, userGroupID], subjID, newMean, newCombWeight
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
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
