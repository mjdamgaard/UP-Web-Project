
import {
  postScoreAndWeight, fetchScoreAndWeight, fetchScoreAndWeightList,
} from "../../scores.js";
import {fetchEntityDefinition, fetchEntityID} from "../../entities.js";
import {map, reduce} from 'array';
import {noPost, clearPrivileges} from 'query';




export function fetchScoreData(listKey, subjKey) {
  return new Promise(resolve => {
    fetchEntityID(listKey).then(listID => {
      fetchScoreAndWeight(
        abs("./comb_lists.bbt"), [listID], subjKey
      ).then(
        scoreData => resolve(scoreData)
      );
    });
  });
}


export function fetchList(listKey, loHex, hiHex, maxNum, offset, isAscending) {
  return new Promise(resolve => {
    fetchEntityID(listKey).then(listID => {
      fetchScoreAndWeightList(
        abs("./comb_lists.bbt"), [listID],
        loHex, hiHex, maxNum, offset, isAscending
      ).then(
        list => resolve(list)
      );
    });
  });
}



export function updateScore(listKey, subjKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(listKey).then(listDef => {
      let listIDProm = fetchEntityID(listDef.ownEntPath);
      let listKeyArr = listDef.listKeyArr;
      let listDefArrProm = Promise.all(
        map(listKeyArr, listKey => fetchEntityDefinition(listKey))
      );
      listDefArrProm.then(listDefArr => {
        // Update the underlying lists before fetching the scores from them.
        Promise.all(map(listDefArr, listDef => (
          clearPrivileges(() => (
            listDef.updateScore ? listDef.updateScore(subjKey) :
              new Promise(res => res())
          ))
        ))).then(() => {
          let scoreDataArrProm = Promise.all(map(listDefArr, listDef => (
            noPost(() => listDef.fetchScoreData(subjKey))
          )));
          scoreDataArrProm.then(scoreDataArr => {
            // Aggregate the score and weight into one combined pair (ignoring
            // all other score data if any).
            let combinedScoreData = reduce(
              scoreDataArr, (acc, val, ind) => {
                val ??= [0, 0];
                let factor = this.weightFactorArr[ind];
                return [
                  acc[0] + val[0] * factor,
                  acc[1] + val[1] * factor,
                ];
              },
              [0, 0],
            );

            // Then post this combined score and weight.
            listIDProm.then(listID => {
              postScoreAndWeight(
                abs("./comb_lists.bbt"), [listID], subjKey,
                combinedScoreData[0], combinedScoreData[1]
              ).then(
                wasUpdated => resolve(wasUpdated)
              );
            });
          });
        });
      });
    });
  });
}


export function updateList(listKey) {
  // TODO: Implement at some point.
  return new Promise(resolve => resolve());
}


