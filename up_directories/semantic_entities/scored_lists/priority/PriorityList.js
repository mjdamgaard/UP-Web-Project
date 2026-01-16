
import {ScoredList} from "../ScoredList.js";
import {join} from 'array';




// A class to generate a list combined of several other scored lists. 
export class PriorityList extends ScoredList {
  
  constructor(ownEntPath, listKeyArr, minWeightArr = []) {
    super(ownEntPath, abs("./priority_lists.sm.js"));
    this.listKeyArr = listKeyArr;
    this.minWeightArr = minWeightArr;

    this["Description"] = <div>
      <h1>{"Priority list"}</h1>
      <p>{
        "This scored list is combined from the following lists: " +
        join(listKeyArr, ", ") + ", by taking the score and the weight from " +
        "the first list in which the given subject appears."
      }</p>
    </div>;
  }

}


export {PriorityList as default};
