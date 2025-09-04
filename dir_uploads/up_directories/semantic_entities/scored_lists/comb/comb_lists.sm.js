
import {postScoreAndWeight} from "../../scores.js";
import {fetchEntityDefinition, fetchEntityID} from "../../entities.sm.js";
import {map, reduce} from 'array';
import {noPost} from 'query';




export function updateScore(combListIdent, subjIdent) {
  return new Promise(resolve => {
    fetchEntityDefinition(combListIdent).then(combListDef => {
      let listIDProm = fetchEntityID(combListDef.ownEntPath);
      let listIdentArr = combListDef.listIdentArr;
      let listDefArrProm = Promise.all(
        map(listIdentArr, listIdent => fetchEntityDefinition(listIdent))
      );
      listDefArrProm.then(listDefArr => {
        let scoreDataArrProm = Promise.all(map(listDefArr, listDef => (
          noPost(() => listDef.fetchScoreData(subjIdent))
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
              abs("./comb_lists.bbt"), [listID], subjIdent,
              combinedScoreData[0], combinedScoreData[1]
            ).then(
              wasUpdated => resolve(wasUpdated)
            );
          });
        });
      });
    });
  });
}


export function updateList(combListIdent) {
  // TODO: Implement at some point.
}


