
import {postScoreAndWeight} from "../../scores.js";
import {fetchEntityDefinition} from "../../entities.sm.js";
import {map, reduce} from 'array';




export function updateScore(listIdent, subjIdent) {
  return new Promise(resolve => {
    fetchEntityDefinition(listIdent).then(listDef => {
      let {userGroupIdent, qualIdent, scoreHandlerIdent, convert} = listDef;
      
    });
  });
}


    // // Then post this combined score and weight.
    // postScoreAndWeight(
    //   abs("./comb_lists.bbt"), listIdent, subjIdent,
    //   ...combinedScoreData
    // ).then(
    //   wasUpdated => resolve(wasUpdated)
    // );

export function updateList(combListIdent) {
  // TODO: Implement.
}


