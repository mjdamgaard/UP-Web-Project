
import {fetchEntityDefinition} from "../../entities.js";
import {noPost} from 'query';
import {slice, map} from 'array';



export function fetchScoreData(listKey, subjKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(listKey).then(listDef => {
      let {
        userGroupKey, qualKey, scoreHandlerKey, convert
      } = listDef;
      fetchEntityDefinition(scoreHandlerKey).then(scoreHandler => {
        noPost(() => scoreHandler.fetchScoreData(
          qualKey, subjKey, {userGroup: userGroupKey}
        )).then(scoreData => {
          if (!convert) {
            resolve(scoreData);
          } else {
            let convertedScore = noPost(() => convert(scoreData[0]));
            resolve([convertedScore, ...slice(scoreData, 1)]);
          }
        });
      });
    });
  });
}


export function fetchList(listKey, loHex, hiHex, maxNum, offset, isAscending) {
  return new Promise(resolve => {
    fetchEntityDefinition(listKey).then(listDef => {
      let {
        userGroupKey, qualKey, scoreHandlerKey, convert
      } = listDef;
      fetchEntityDefinition(scoreHandlerKey).then(scoreHandler => {
        noPost(() => scoreHandler.fetchList(qualKey, {
          userGroup: userGroupKey,
          loHex: loHex,
          hiHex: hiHex,
          maxNum: maxNum,
          offset: offset,
          isAscending: isAscending,
        })).then(list => {
          if (!convert) {
            resolve(list);
          } else {
            resolve(map(list, entry => {
              let convertedScore = noPost(() => convert(entry[0]));
              resolve([convertedScore, ...slice(entry, 1)]);
            }));
          }
        });
      });
    });
  });
}


export function updateScore(listKey, subjKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(listKey).then(listDef => {
      let {
        userGroupKey, qualKey, scoreHandlerKey,
      } = listDef;
      fetchEntityDefinition(scoreHandlerKey).then(scoreHandler => {
        scoreHandler.updateScoreForGroup(
          qualKey, subjKey, {userGroup: userGroupKey}
        ).then(
          wasUpdated => resolve(wasUpdated));
      });
    });
  });
}



export function updateList(listKey) {
  return new Promise(resolve => {
    fetchEntityDefinition(listKey).then(listDef => {
      let {
        userGroupKey, qualKey, scoreHandlerKey,
      } = listDef;
      fetchEntityDefinition(scoreHandlerKey).then(scoreHandler => {
        scoreHandler.updateList(
          qualKey, {userGroup: userGroupKey}
        ).then(
          wasUpdated => resolve(wasUpdated));
      });
    });
  });
}


