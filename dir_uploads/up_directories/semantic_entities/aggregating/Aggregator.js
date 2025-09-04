

import {post} from 'query';
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../../scores.js";




export class Aggregator {

  constructor(updateSMPath, aggrPath) {
    this.updateSMPath = updateSMPath;
    this.aggrPath = aggrPath;
  }


  fetchScore(userGroupIdent, qualIdent, subjIdent) {
    return new Promise(resolve => {
      fetchScoreAndWeight(
        this.aggrPath, [qualIdent, userGroupIdent], subjIdent
      ).then(
        ([score]) => resolve(score)
      );
    });
  }

  fetchScoreAndWeight(userGroupIdent, qualIdent, subjIdent) {
    return new Promise(resolve => {
      fetchScoreAndWeight(
        this.aggrPath, [qualIdent, userGroupIdent], subjIdent
      ).then(
        scoreAndWeight => resolve(scoreAndWeight)
      );
    });
  }


  fetchList(userGroupIdent, qualIdent, {lo, hi, maxNum, offset, isAscending}) {
    return new Promise(resolve => {
      fetchScoreAndWeightList(
        this.aggrPath, [qualIdent, userGroupIdent], lo, hi, maxNum, offset,
        isAscending,
      ).then(
        list => resolve(list)
      );
    });
  }




  updateScoreForUser(userGroupIdent, qualIdent, subjIdent, userID) {
    return new Promise(resolve => {
      post(
        this.updateSMPath + "/callSMF/updateScoreForUser",
        [userGroupIdent, qualIdent, subjIdent, userID],
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  }


  updateScoreForGroup(userGroupIdent, qualIdent, subjIdent) {
    return new Promise(resolve => {
      post(
        this.updateSMPath + "/callSMF/updateScoreForGroup",
        [userGroupIdent, qualIdent, subjIdent],
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  }

  updateList(userGroupIdent, qualIdent) {
    return new Promise(resolve => {
      post(
        this.updateSMPath + "/callSMF/updateList",
        [userGroupIdent, qualIdent],
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  }

}


export {Aggregator as default};
