




import homePath from "./.id.js";
import {post} from 'query';
import {fetchEntityID} from "../../entities.sm.js";
import {getRequestingUserID} from 'request';

export function updateScore(qualIDOrPath, subjIDOrPath, userGroupID) {
  let userID = getRequestingUserID();
  return new Promise(resolve => {
    let qualIDPromise = (qualIDOrPath[0] === "/") ?
      fetchEntityID(qualIDOrPath) : new Promise(res => res(qualIDOrPath));
    let subjIDPromise = (subjIDOrPath[0] === "/") ?
      fetchEntityID(subjIDOrPath) : new Promise(res => res(subjIDOrPath));
    
    let userWeightPromise = 
    
    Promise.all([qualIDPromise, subjIDPromise]).then(([qualID, subjID]) => {
      
    });
    if (qualIDOrPath[0] === "/") {
      fetchEntityID(qualIDOrPath).then(qualID => {
        updateListHelper(qualID, resolve);
      });
    } else {
      updateListHelper(qualIDOrPath, resolve);
    }
  });
}


