
import {
  DevFunction, ObjectObject, verifyType,
} from "../../interpreting/ScriptInterpreter";




export const mergeScoredLists = new DevFunction(
  "mergeScoredLists", {typeArr: ["array", "array", "integer?"]},
  ({callerNode, execEnv, interpreter}, [listArr, weightFactorArr, maxNum]) => {
    // Turn listArr and weightFactorArr into plain JS arrays, and make sure
    // to deep-copy listArr such that it can be sorted in place with no side-
    // effects outside of this function.  
    listArr = extractArray(listArr);
    weightFactorArr = extractArray(weightFactorArr);
    listArr = listArr.map(list => {
      list = extractArray(list);
      return list.map(scoreData => {
        scoreData = extractArray(scoreData);
        return [...scoreData];
      });
    });
    
    // Then sort each array according to the entID.
    listArr.forEach(list => list.sort(scoreData => {
      // TODO: Continue.
    }));


    // TODO: Continue.
  }
);



function extractArray(arr) {
  verifyType(arr, "array");
  return (arr instanceof ObjectObject) ? arr.members : arr;
}