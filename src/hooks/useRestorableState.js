import {
  useState, useCallback, useEffect, useRef, useId,
} from "react";
import {LazyCallbackHandler, LazyCallbackHandler} from "../classes/LazyCallbackHandler";

// TODO: Continue..

var nonce = 1;

const stopRestoringLCH = new LazyCallbackHandler(2000);

const idDataStore = {};



export const useRestore = (componentKey, data, callback) => {

  const isRestoring = getIsRestoring();
  const isRoot = componentKey.slice(0, 4) === "root";

  const nodeRef = (useCallback(
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
  ))(); console.log(JSON.stringify([componentKey, nodeRef]));


  const refCallback = useCallback((node) => {
    if (node) {
      node.setAttribute("data-restore-keys",
        componentKey + "," + nodeRef.current.id
      );
    }

    if (isRestoring) {
      fetchPrevDataAndUpdateIDTree(
        componentKey, isRoot, id, node, (prevData) => {
          nodeRef.current.isReady = true;
          callback(prevData);
          stopRestoringLCH.then(stopRestoringIfReadyOrTimedOut);
        }
      );
    }
  }, [componentKey, isRestoring]);


  useEffect(() => {
    idDataStore[id] = data;
    return () => {
      delete idDataStore[id];
    };
  }, [data]);
  
  // TODO: Return a modified setState that initiates a delayed callback to
  // store the state (including when setState is used to restore a previously
  // stored state). 
  return [nodeRef.current.isReady, refCallback];
};



function getIsRestoring() {
  return RestorableDataStore.prevDataStore ? true : false; 
}



function fetchPrevDataAndUpdateIDTree(
  componentKey, isRoot, id, node, callback
) {
  if (isRoot) {
    
  }
}


var isTimedOut = false;

function stopRestoringIfReadyOrTimedOut() {

}


class RestorableDataStore {
  static prevDataStore = JSON.parse(
    sessionStorage.getItem("_restorableDataStore") ?? "null"
  );
  static dataStore = this.prevDataStore ?? {};

  static saveDataOnBeforeUnloadEvent() {
    window.addEventListener("beforeunload", () => {
      sessionStorage.setItem("_restorableDataStore", JSON.stringify(
        this.dataStore
      ));
    });
  }

  static #getParentDataStoreAndLastKeyPart(key, delimiter) {
    let keyParts = key.split(delimiter);
    let len = keyParts.length;

    var dataStore = this.dataStore;
    for (let i = 1; dataStore && i < len - 1; i++) {
      dataStore = dataStore[keyParts[i]][1];
    }

    return [dataStore, keyParts[len - 1]]
  }

  static getData(key, delimiter) {
    const [dataStore, lastKeyPart] = this.#getParentDataStoreAndLastKeyPart(
      key, delimiter
    );
    return dataStore || dataStore[lastKeyPart][0];
  } 

  static setData(key, delimiter, data) {
    const [dataStore, lastKeyPart] = this.#getParentDataStoreAndLastKeyPart(
      key, delimiter
    );
    if (!dataStore) {
      debugger;throw (
        "setStateData(): Parent state not set prior to setting child state."
      );
    }

    let dataObj = dataStore[lastKeyPart] ?? [[], {}];
    dataObj[0] = data;
    dataStore[lastKeyPart] = dataObj;
  }


  static deleteData(key, delimiter) {
    const [dataStore, lastKeyPart] = this.#getParentDataStoreAndLastKeyPart(
      key, delimiter
    );
    if (dataStore) {
      delete dataStore[lastKeyPart];
    }
  } 

}


RestorableDataStore.saveDataOnBeforeUnloadEvent();
