
import {fetchEntityID} from "../entities.js";
import {fetch, post} from 'query';




export class ScoredList {
  
  constructor(ownEntPath, smPath) {
    this.ownEntPath = ownEntPath;
    this.smPath = smPath;
  }

  Class = abs("../em1.js;get/scoredLists");


  fetchScoreData(subjKey) {
    return new Promise(resolve => {
      let onwEntIDProm = fetchEntityID(this.ownEntPath);
      let subjIDProm = fetchEntityID(subjKey);
      Promise.all([onwEntIDProm, subjIDProm]).then(([ownEntID, subjID]) => {
        fetch(
          this.smPath + "/callSMF/fetchScoreData/" + ownEntID + "/" + subjID
        ).then(
          scoreData => resolve(scoreData)
        );
      });
    });
  }

  fetchList(
    loHex = "", hiHex = "", maxNum = "", offset = 0, isAscending = 0) {
    return new Promise(resolve => {
      fetchEntityID(this.ownEntPath).then(ownEntID => {
        fetch(
          this.smPath + "/callSMF/fetchList/" + ownEntID + "/" + loHex + "/" +
          loHex + "/" + hiHex + "/" + maxNum + "/" + offset + "/" + isAscending
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
          this.smPath + "/callSMF/updateScore", [ownEntID, subjKey],
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
          this.smPath + "/callSMF/updateList", [ownEntID],
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }

}



