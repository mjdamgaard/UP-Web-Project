




import homePath from "./.id.js";
import {post} from 'query';
import {fetchEntityID} from "../../entities.sm.js";

export function updateList(qualIDOrPath) {
  return new Promise(resolve => {
    if (qualIDOrPath[0] === "/") {
      fetchEntityID(qualIDOrPath).then(qualID => {
        updateListHelper(qualID, resolve);
      });
    } else {
      updateListHelper(qualIDOrPath, resolve);
    }
  });
}

function updateListHelper(qualID, resolve) {
  
}

