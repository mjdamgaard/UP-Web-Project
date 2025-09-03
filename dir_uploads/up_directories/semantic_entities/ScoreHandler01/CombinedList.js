
import {initialModerators} from "./init.sm.js";
import {MeanAggregator} from "../aggregating/mean/MeanAggregator.js";
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../scores.js";
import {fetchEntityDefinition, fetchEntityID} from "../entities.sm.js";
import {map, reduce} from 'array';
import {noPost} from 'query';

const trustedQualIdent = abs("./../em1.js;get/trusted");





// A class to generate a list combined of several other scored lists. 
export class CombinedList {
  
  constructor(listIdentArr, weightFactorArr) {
    this.listDefArrProm = Promise.all(
      map(listIdentArr, listIdent => fetchEntityDefinition(listIdent))
    );
    this.weightFactorArr = weightFactorArr;
  }

  Class = abs("./em1.js;get/scoredLists");

  fetchScoreData(subjIdent) {
    return new Promise(resolve => {
      this.listDefArrProm.then(listDefArr => noPost(() => {
        let scoreDataArrProm = Promise.all(map(listDefArr, listDef => (
          listDef.fetchScoreData(subjIdent)
        )));
        scoreDataArrProm.then(scoreDataArr => {
          resolve(reduce(
            scoreDataArr, (acc, val, ind) => {
              let factor = this.weightFactorArr[ind];
              return [acc[0] + val[0] * factor, acc[1] + val[1] * factor];
            },
            [0, 0],
          ));
        });
      }));
    });
  }

  fetchList(options) {
    return new Promise(resolve => {
      this.listDefArrProm.then(listDefArr => noPost(() => {
        let listArrProm = Promise.all(map(listDefArr, listDef => (
          listDef.fetchList(options)
        )));
        listArrProm.then(listArr => {
          // resolve(reduce(
          //   scoreDataArr, (acc, val, ind) => {
          //     let factor = this.weightFactorArr[ind];
          //     return [acc[0] + val[0] * factor, acc[1] + val[1] * factor];
          //   },
          //   [0, 0],
          // ));
        });
      }));
    });
  }
}



