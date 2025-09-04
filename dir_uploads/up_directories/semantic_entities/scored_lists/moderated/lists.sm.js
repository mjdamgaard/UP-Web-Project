
import {postScoreAndWeight} from "../../scores.js";
import {fetchEntityDefinition, fetchEntityID} from "../../entities.sm.js";
import {noPost} from 'query';




export function updateScore(listIdent, subjIdent) {
  return new Promise(resolve => {
    fetchEntityDefinition(listIdent).then(listDef => {
      let {
        ownEntPath, userGroupIdent, qualIdent, scoreHandlerIdent, convert
      } = listDef;
      fetchEntityID(ownEntPath).then(listID => {
        fetchEntityDefinition(scoreHandlerIdent).then(scoreHandler => {
          noPost(() => scoreHandler.fetchScoreData(
            qualIdent, subjIdent, {userGroup: userGroupIdent}
          )).then(scoreData => {
            postScoreAndWeight(
              abs("./lists.bbt"), [listID], subjIdent,
              noPost(() => convert(scoreData[0])), scoreData[1]
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
  // TODO: Implement.
}


