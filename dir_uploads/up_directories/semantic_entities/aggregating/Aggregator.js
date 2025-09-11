

import {post} from 'query';
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../../scores.js";




export class Aggregator {

  constructor(updateSMPath, aggrPath) {
    this.updateSMPath = updateSMPath;
    this.aggrPath = aggrPath;
  }


  fetchScore(userGroupKey, qualKey, subjKey) {
    return new Promise(resolve => {
      fetchScoreAndWeight(
        this.aggrPath, [qualKey, userGroupKey], subjKey
      ).then(
        ([score]) => resolve(score)
      );
    });
  }

  fetchScoreAndWeight(userGroupKey, qualKey, subjKey) {
    return new Promise(resolve => {
      fetchScoreAndWeight(
        this.aggrPath, [qualKey, userGroupKey], subjKey
      ).then(
        scoreAndWeight => resolve(scoreAndWeight)
      );
    });
  }


  fetchList(userGroupKey, qualKey, {lo, hi, maxNum, offset, isAscending}) {
    return new Promise(resolve => {
      fetchScoreAndWeightList(
        this.aggrPath, [qualKey, userGroupKey], lo, hi, maxNum, offset,
        isAscending,
      ).then(
        list => resolve(list)
      );
    });
  }




  updateScoreForUser(userGroupKey, qualKey, subjKey, userID) {
    return new Promise(resolve => {
      post(
        this.updateSMPath + "/callSMF/updateScoreForUser",
        [userGroupKey, qualKey, subjKey, userID],
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  }


  updateScoreForGroup(userGroupKey, qualKey, subjKey) {
    return new Promise(resolve => {
      post(
        this.updateSMPath + "/callSMF/updateScoreForGroup",
        [userGroupKey, qualKey, subjKey],
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  }

  updateList(userGroupKey, qualKey) {
    return new Promise(resolve => {
      post(
        this.updateSMPath + "/callSMF/updateList",
        [userGroupKey, qualKey],
      ).then(
        wasUpdated => resolve(wasUpdated)
      );
    });
  }

}


export {Aggregator as default};
