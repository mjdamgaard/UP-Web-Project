

import {post} from 'query';
import {
  fetchScoreAndWeight, fetchScoreAndWeightList,
} from "../../scores.js";


const aggrPath = abs("./aggr.btt");


// TODO: This aggregator has some faults as of yet, as stated in
// ./updates.sm.js.


export class Aggregator {

  constructor(userGroupID) {
    this.userGroupID = userGroupID;
  }


  fetchScore(qualIdent, subjIdent) {
    return new Promise(resolve => {
      fetchScoreAndWeight(
        aggrPath, qualIdent, [this.userGroupID], subjIdent
      ).then(
        ([score]) => resolve(score)
      );
    });
  }

  fetchScoreAndWeight(qualIdent, subjIdent) {
    return new Promise(resolve => {
      fetchScoreAndWeight(
        aggrPath, qualIdent, [this.userGroupID], subjIdent
      ).then(
        scoreAndWeight => resolve(scoreAndWeight)
      );
    });
  }



  fetchList(qualIdent, isAscending, maxNum, offset, hi, lo) {
    return new Promise(resolve => {
      fetchScoreAndWeightList(
        aggrPath, qualIdent, [this.userGroupID], lo, hi, maxNum, offset,
        isAscending,
      ).then(
        list => resolve(list)
      );
    });
  }




  updateScoreForUser(userGroupIdent, qualIdent, subjIdent, userID) {
    return new Promise(resolve => {
      post(
        abs("./updates.sm.js/callSMF"),
        [userGroupIdent, qualIdent, subjIdent, userID],
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  }


  updateList = undefined;

}


export {Aggregator as default};
