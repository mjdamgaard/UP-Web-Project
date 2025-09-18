
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../scores.js";
import {fetchEntityID} from "../entities.js";




export class ScoredList {
  
  constructor(ownEntPath, listTablePath, updateSMPath) {
    this.ownEntPath = ownEntPath;
    this.listTablePath = listTablePath;
    this.updateSMPath = updateSMPath;
  }

  Class = abs("../em1.js;get/scoredLists");


  fetchScoreData(subjKey) {
    return new Promise(resolve => {
      fetchEntityID(this.ownEntPath).then(ownEntID => {
        fetchScoreAndWeight(
          this.listTablePath, [ownEntID], subjKey
        ).then(
          scoreData => resolve(scoreData)
        );
      });
    });
  }

  fetchList({lo, hi, maxNum, offset, isAscending}) {
    return new Promise(resolve => {
      fetchEntityID(this.ownEntPath).then(ownEntID => {
        fetchScoreAndWeightList(
          this.listTablePath, [ownEntID], lo, hi, maxNum, offset,
          isAscending
        ).then(
          list => resolve(list)
        );
      });
    });
  }

  updateScore(subjKey) {
    return new Promise(resolve => {
      fetchEntityID(this.ownEntPath).then(ownEntID => {
        post(
          this.updateSMPath + "/callSMF/updateScore", [ownEntID, subjKey],
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }

  updateList() {
    return new Promise(resolve => {
      fetchEntityID(this.ownEntPath).then(ownEntID => {
        post(
          this.updateSMPath + "/callSMF/updateList", [ownEntID],
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }

}



