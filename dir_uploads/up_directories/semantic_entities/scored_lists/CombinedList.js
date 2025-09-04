
import {fetchScoreAndWeight, fetchScoreAndWeightList} from "../scores.js";
import {fetchEntityDefinition, fetchEntityID} from "../entities.sm.js";
import {map, join} from 'array';





// A class to generate a list combined of several other scored lists. 
export class CombinedList {
  
  constructor(ownEntPath, listIdentArr, weightFactorArr) {
    this.ownEntIDProm = fetchEntityID(ownEntPath);
    this.listDefArrProm = Promise.all(
      map(listIdentArr, listIdent => fetchEntityDefinition(listIdent))
    );
    this.weightFactorArr = weightFactorArr;

    this["Documentation"] = <div>
      <h1>{"Combined list"}</h1>
      <p>{
        "This scored list is combined from merging the lists: " +
        join(listIdentArr, ", ") + ", using the respective weight factors: " +
        join(weightFactorArr, ", ") + "."
      }</p>
    </div>;
  }

  Class = abs("./em1.js;get/scoredLists");


  fetchScoreData(subjIdent) {
    return new Promise(resolve => {
      this.ownEntIDProm.then(ownEntID => {
        fetchScoreAndWeight(
          abs("./comb_lists.bbt"), [ownEntID], subjIdent
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
          abs("./comb_lists.bbt"), [ownEntID], lo, hi, maxNum, offset,
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
          abs("./comb_lists.sm.js/callSMF/updateScore"), [ownEntID, subjIdent],
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
          abs("./comb_lists.sm.js/callSMF/updateList"), [ownEntID],
        ).then(
          wasUpdated => resolve(wasUpdated)
        );
      });
    });
  }

}



