
import {
  DevFunction, ObjectObject, verifyType,
} from "../../interpreting/ScriptInterpreter.js";




export const filterScoredListWRTWeight = new DevFunction(
  "filterScoredListWRTWeight", {typeArr: ["array", "number?"]},
  ({}, [list, minWeight = 10]) => {
    // Deep-copy list, also turning it, and its nested array objects into a
    // plain JS array if they are not already.
    list = extractArray(list);
    list = list.map(scoreData => {
      scoreData = extractArray(scoreData);
      return [...scoreData];
    });

    // Then filter the scored lists with respect to the weight and return the
    // result.
    return list.filter(([ , , weight = 0]) => weight >= minWeight);
  }
);



// TODO: Finish this function and then export it.
/*export*/ const mergeScoredLists = new DevFunction(
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