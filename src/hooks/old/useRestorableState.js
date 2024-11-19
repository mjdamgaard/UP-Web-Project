import {
  useState, useEffect,
} from "react";



// TODO: Reimplement with another idea that just uses one refCallback for each
// restorable-stateful component (and where we can just make a combined hook
// with useDispatch(), then). ..It could also be a useRestoreState() that
// doesn't initialize the state, but instead promises to change the state, and
// signal when ready, if there's a state waiting to be restored.


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






export class RestorableDataStore {
  static dataStore =
    JSON.parse(sessionStorage.getItem("_restorableDataStore") ?? "null") ?? {};

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

  static getData(key, delimiter) {debugger;
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
