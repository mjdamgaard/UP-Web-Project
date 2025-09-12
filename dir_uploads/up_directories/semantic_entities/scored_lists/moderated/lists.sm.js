
import {postScoreAndWeight} from "../../scores.js";
import {fetchEntityDefinition, fetchEntityID} from "../../entities.js";
import {noPost} from 'query';




export function updateScore(listKey, subjKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(listKey).then(listDef => {
      let {
        ownEntPath, userGroupKey, qualKey, scoreHandlerKey, convert
      } = listDef;
      fetchEntityID(ownEntPath).then(listID => {
        fetchEntityDefinition(scoreHandlerKey).then(scoreHandler => {
          noPost(() => scoreHandler.fetchScoreData(
            qualKey, subjKey, {userGroup: userGroupKey}
          )).then(scoreData => {
            postScoreAndWeight(
              abs("./lists.bbt"), [listID], subjKey,
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



export function updateList(combListKey) {
  // TODO: Implement.
  return Promise(resolve => resolve());
}


