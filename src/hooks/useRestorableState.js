import {
  useState, useCallback, useEffect, useRef, useId,
} from "react";

// TODO: Continue..

const callbackStore = {};


export const useRestore = (componentKey, data, callback) => {

  const prevDataStore = RestorableDataStore.prevDataStore;

  var _id = useId();
  const nodeRef = (useCallback(
    (() => {
      let id = _id;
      let ref = {
        id: id,
        node: null,
      };
      return () => ref;
    })(),
    []
  ))(); console.log([componentKey, nodeRef]);

  const refCallback = useCallback((node) => {
    if (node) {
      node.setAttribute("data-restore-status",
        componentKey + "," + nodeRef.id + "," + (prevDataStore ? "0" : "1")
      );
      nodeRef.node = node;
      callbackStore[nodeRef.id] = () => {
        if (componentKey.slice(0, 4) === "root") {
  
        }
      };
    }
  }, [componentKey]);

  // If the app is restoring...
  useEffect(() => {
    if (prevDataStore) {

    }
  }, []);

  useEffect(() => {
    // TODO: Look at parents data-state-id's and use them to get and set
    // any stored states (using setState()).
  }, []);
  
  var isRestoring = prevDataStore;
  // TODO: Return a modified setState that initiates a delayed callback to
  // store the state (including when setState is used to restore a previously
  // stored state). 
  return [isRestoring, refCallback];
};






class RestorableDataStore {
  static prevDataStore =JSON.parse(
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
