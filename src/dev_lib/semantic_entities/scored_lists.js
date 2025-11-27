
import {
  DevFunction, verifyType, ObjectObject,
} from "../../interpreting/ScriptInterpreter.js";



// combineLists(listArr, factorArr) takes an array of lists and an array of
// factors, and returns a combined list that is a merger of all the lists in
// listArr, and but where the scores are multiplied with the corresponding
// factor, and where if the entity appears in several lists, the weighted
// average is taken, using the weights. The weights of the returned list is
// a sum of all the weights for the given entity, without multiplying with
// anything.
// If a factor is undefined in the array, it defaults to 1. And if factorArr
// is undefined, it defaults to [].
export const combineLists = new DevFunction(
  "combineLists", {typeArr: ["array", "array?", "any?", "any?"]},
  ({callerNode, execEnv}, [
    listArr, factorArr = [], isAscending = false, sortWRTEntID = false,
  ]) => {
    // Prepare the input by making appropriate checks and shallow copies,
    // and also multiply all scores with the appropriate factor in the process.
    if (listArr instanceof ObjectObject) listArr = listArr.members;
    if (factorArr instanceof ObjectObject) factorArr = factorArr.members;
    listArr = listArr.map((list, listInd) => {
      let factor = factorArr[listInd];
      verifyType(factor, "number", true, callerNode, execEnv);
      factor ??= 1;
      verifyType(list, "array", false, callerNode, execEnv);
      if (list instanceof ObjectObject) list = list.members;
      return list.map(entry => {
        verifyType(entry, "array", false, callerNode, execEnv);
        if (entry instanceof ObjectObject) entry = entry.members;
        let [entID, score, weight, ...rest] = entry;
        verifyType(entID, "string", false, callerNode, execEnv);
        verifyType(score, "number", false, callerNode, execEnv);
        verifyType(weight, "number", false, callerNode, execEnv);
        return [entID, score * factor, weight, ...rest];
      });
    });

    // Merge all the lists, preserving duplicates, and sort them w.r.t. the
    // entID, and then go through each element and add it to an initial, entID-
    // sorted version of the return array.
    let entIDSortedMergedList = [].concat(...listArr)
      .sort((a, b) => a[0] > b[0] ? 1 : -1);
    let len = entIDSortedMergedList.length;
    let entIDSortedRet = new Array(len);
    let nextInd = 0;
    let curEntry, curID, curScore = 0, curWeight = 0;
    for (let i = 0; i < len; i++) {
      let entry = entIDSortedMergedList[i];
      let [entID, score, weight] = entry;
      if (curID !== entID) {
        curEntry = [...entry];
        entIDSortedRet[nextInd] = curEntry;
        curID = entID;
        nextInd++;
      }
      else {
        let newWeight = curWeight + weight;
        let newScore = (newWeight <= 0) ? 0 : (
          curScore + curWeight + score * weight
        ) / newWeight;
        curScore = curEntry[1] = newScore;
        curWeight = curEntry[2] = newWeight;
      }
    }

    // If sortWRTEntID is true, return entIDSortedRet as is, or possibly
    // reversed is isAscending is false.
    if (sortWRTEntID) {
      return isAscending ? entIDSortedRet : entIDSortedRet.reverse();
    }

    // Else sort entIDSortedRet with respect to the scores once again, in the
    // order determined by isAscending, before returning it.
    else {
      return isAscending ?
        entIDSortedRet.sort((a, b) => a[1] - b[1]) :
        entIDSortedRet.sort((a, b) => b[1] - a[1]);
    }
  }
);





export const filterScoredListWRTWeight = new DevFunction(
  "filterScoredListWRTWeight", {typeArr: ["array", "number?"]},
  ({callerNode, execEnv}, [list, minWeight = 10]) => {
    // Deep-copy list, also turning it, and its nested array objects into a
    // plain JS array if they are not already.
    if (list instanceof ObjectObject) list = list.members;
    list = list.map(scoreData => {
      verifyType(scoreData, "array", false, callerNode, execEnv);
      if (scoreData instanceof ObjectObject) scoreData = scoreData.members;
      return [...scoreData];
    });

    // Then filter the scored lists with respect to the weight and return the
    // result.
    return list.filter(([ , , weight = 0]) => weight >= minWeight);
  }
);


