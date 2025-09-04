
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../../scores.js";
import {fetchEntityDefinition, fetchEntityID} from "../../entities.sm.js";
import {map, join} from 'array';




export class ScoredList {
  
  constructor(ownEntPath, listTablePath, updateSMPath) {
    this.ownEntIDProm = fetchEntityID(ownEntPath);
    this.listTablePath = listTablePath;
    this.updateSMPath = updateSMPath;
  }

  Class = abs("./em1.js;get/scoredLists");


  fetchScoreData(subjIdent) {
    return new Promise(resolve => {
      this.ownEntIDProm.then(ownEntID => {
        fetchScoreAndWeight(
          this.listTablePath, [ownEntID], subjIdent
        ).then(
          scoreData => resolve(scoreData)
        );
      });
    });
  }

  fetchList({lo, hi, maxNum, offset, isAscending}) {
    return new Promise(resolve => {
      this.ownEntIDProm.then(ownEntID => {
        fetchScoreAndWeightList(
          this.listTablePath, [ownEntID], lo, hi, maxNum, offset,
          isAscending
        ).then(
          list => resolve(list)
        );
      });
    });
  }

  updateScore(subjIdent) {
    return new Promise(resolve => {
      this.ownEntIDProm.then(ownEntID => {
        post(
          this.updateSMPath + "/callSMF/updateScore", [ownEntID, subjIdent],
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }

  updateList() {
    return new Promise(resolve => {
      this.ownEntIDProm.then(ownEntID => {
        post(
          this.updateSMPath + "/callSMF/updateList", [ownEntID],
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }

}



