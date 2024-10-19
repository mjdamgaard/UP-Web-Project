import {
  useState, useEffect,
} from "react";




export const useRestorableState = (id, initState, refs) => {
  // Get previous state from RestorableDataStore if any.
  const [prevState] = RestorableDataStore.getData(id, ">");

  // Set the initial state, unless there's a backup waiting to be restored.
  const [state, setState] = useState(prevState ?? initState);

  // Store the state and the refs in RestorableDataStore.
  RestorableDataStore.setData(id, ">", [state, refs]);

  // Schedule a cleanup function to delete the state data.
  useEffect(() => {
    return () => {
      RestorableDataStore.deleteData(id, ">");
    };
  }, []);
  
  return [state, setState];
};






class RestorableDataStore {
  static dataStore =
    JSON.parse(sessionStorage.getItem("_restorableDataStore") ?? "null") ?? {};

  static createPopStateEvent() {
    window.addEventListener("popstate", (event) => {
      sessionStorage.setItem("_restorableDataStore", JSON.stringify(
        this.dataStore
      ));
    });
  }

  static #getParentDataStoreAndLastKeyPart(key, delimiter) {
    keyParts = key.split(delimiter);
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

RestorableDataStore.createPopStateEvent();
