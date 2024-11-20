import {
  useState, useCallback, useEffect, useRef, useId,
} from "react";
import {LazyCallbackHandler} from "../classes/LazyCallbackHandler";



var nonce = 1;

const stopRestoringLCH = new LazyCallbackHandler(4000);

const dataStore = {};
const idTree    = {};
const rootIDs   = {};

var prevDataStore = JSON.parse(
  sessionStorage.getItem("_restorableDataStore") ?? "null"
);
var prevIDTree = JSON.parse(
  sessionStorage.getItem("_restorableIDTree")    ?? "null"
);
var prevRootIDs = JSON.parse(
  sessionStorage.getItem("_restorableRootIDs")   ?? "null"
);

var prevIDs = {};

var isRestoring = prevDataStore ? true : false;

if (!isRestoring) {
  setBeforeUnloadEvent();
}


function setBeforeUnloadEvent() {
  window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("_restorableDataStore", JSON.stringify(dataStore));
    sessionStorage.setItem("_restorableIDTree",    JSON.stringify(idTree));
    sessionStorage.setItem("_restorableRootIDs",   JSON.stringify(rootIDs));
  });
}






export const useRestore = (componentKey, data, callback) => {
  const isRoot = componentKey.slice(0, 4) === "root";

  const ref = (useCallback(
    (() => {
      let ret = {current: null};
      return () => {
        if (!ret.current) {
          ret.current = {
            id: nonce++,
            isReady: !isRestoring,
          }
        }
        return ret;
      };
    })(),
    []
  ))(); console.log(JSON.stringify([componentKey, ref]));


  const refCallback = useCallback((node) => {
    if (node) {
      node.setAttribute("data-restore-id", ref.current.id.toString());

      var parentID, path;
      if (isRoot) {
        rootIDs[componentKey] = id;
      }
      else {
        [parentID, path] = getParentIDAndPath(node);
        idTree[parentID][path] = id;
      }

      var prevCompKey, prevData;

      if (isRestoring) {
        let prevID = getAndUpdatePrevID(componentKey, isRoot, parentID, path);
        if (prevID) {
          [prevCompKey, prevData] = prevDataStore[prevID] || [null, null];
          if (prevCompKey === componentKey) {
            callback(prevData);
          }
        }
        ref.current.isReady = true;
        prevIDTree[id].isRestored = true;
        stopRestoringLCH.then(stopRestoringIfReadyOrTimedOut);
      }

      idTree[id] = {};
      dataStore[id] = [componentKey, prevData ?? data];
    } else {
      if (isRoot) {
        delete rootIDs[componentKey];
      }
      delete idTree[id];
      delete dataStore[id];
    }

  }, [componentKey]);


  return [ref.current.isReady, refCallback];
};





function getParentIDAndPath(node) {
  let parentNode = node.parentNode;
  let parentID = parentNode.getAttribute("data-restore-id");
  let parentPath;

  var siblingIndex = 0;
  while (node = node.previousSibling) {
    siblingIndex++;
  }

  if (parentID) {
    return [parentID, siblingIndex];
  }
  else {
    [parentID, parentPath] = getParentIDAndPath(parentNode);
    let path = parentPath + "-" + siblingIndex;
    return [parentID, path];
  }
}



function getAndUpdatePrevID(componentKey, isRoot, id, parentID, path) {
  var prevID;
  if (isRoot) {
    prevID = prevRootIDs[componentKey];
  }
  else {
    let prevParentID = prevIDs[parentID];
    prevID = prevIDTree[prevParentID][path];

  }

  prevIDs[id] = prevID;
  return prevID;
}



var isTimedOut = null;

function stopRestoringIfReadyOrTimedOut() {
  if (isTimedOut === null) {
    isTimedOut = false;
    setTimeout(
      () => {
        isTimedOut = true;
      },
      20000,
    );
  }
  let allIsRestored = Object.values(prevIDTree).reduce(
    (acc, val) => acc && val.isRestored,
    true
  );
  if (allIsRestored || isTimedOut) {
    isRestoring   = false;
    prevRootIDs   = null;
    prevIDTree    = null;
    prevDataStore = null;
    prevIDs       = null;
    setBeforeUnloadEvent();
  }
}





// class RestorableDataStore {
//   static prevDataStore = JSON.parse(
//     sessionStorage.getItem("_restorableDataStore") ?? "null"
//   );
//   static dataStore = this.prevDataStore ?? {};

//   static saveDataOnBeforeUnloadEvent() {
//     window.addEventListener("beforeunload", () => {
//       sessionStorage.setItem("_restorableDataStore", JSON.stringify(
//         this.dataStore
//       ));
//     });
//   }

//   static #getParentDataStoreAndLastKeyPart(key, delimiter) {
//     let keyParts = key.split(delimiter);
//     let len = keyParts.length;

//     var dataStore = this.dataStore;
//     for (let i = 1; dataStore && i < len - 1; i++) {
//       dataStore = dataStore[keyParts[i]][1];
//     }

//     return [dataStore, keyParts[len - 1]]
//   }

//   static getData(key, delimiter) {
//     const [dataStore, lastKeyPart] = this.#getParentDataStoreAndLastKeyPart(
//       key, delimiter
//     );
//     return dataStore || dataStore[lastKeyPart][0];
//   } 

//   static setData(key, delimiter, data) {
//     const [dataStore, lastKeyPart] = this.#getParentDataStoreAndLastKeyPart(
//       key, delimiter
//     );
//     if (!dataStore) {
//       debugger;throw (
//         "setStateData(): Parent state not set prior to setting child state."
//       );
//     }

//     let dataObj = dataStore[lastKeyPart] ?? [[], {}];
//     dataObj[0] = data;
//     dataStore[lastKeyPart] = dataObj;
//   }


//   static deleteData(key, delimiter) {
//     const [dataStore, lastKeyPart] = this.#getParentDataStoreAndLastKeyPart(
//       key, delimiter
//     );
//     if (dataStore) {
//       delete dataStore[lastKeyPart];
//     }
//   } 

// }


// RestorableDataStore.saveDataOnBeforeUnloadEvent();
