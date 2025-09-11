
import {ScoredList} from "../ScoredList.js";
import {join} from 'array';




// A class to generate a list combined of several other scored lists. 
export class CombinedList extends ScoredList {
  
  constructor(ownEntPath, listKeyArr, weightFactorArr) {
    super(ownEntPath, abs("./comb_lists.bbt"), abs("./comb_lists.sm.js"));

    // These two attributes are used by the update SM, which also fetches the
    // combined list's entity definition in order to update the scores
    // correctly.
    this.listKeyArr = listKeyArr;
    this.weightFactorArr = weightFactorArr;

    this["Documentation"] = <div>
      <h1>{"Combined list"}</h1>
      <p>{
        "This scored list is combined from merging the lists: " +
        join(listKeyArr, ", ") + ", using the respective weight factors: " +
        join(weightFactorArr, ", ") + "."
      }</p>
    </div>;
  }

}


export {CombinedList as default};
