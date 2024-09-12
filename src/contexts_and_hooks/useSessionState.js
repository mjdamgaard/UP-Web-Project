import {
  useState, useId, useEffect, useMemo,
} from "react";



const sessionStateAuxillaryDataStore = {};


sessionStorage.getItem("_componentStateData") ||
  sessionStorage.setItem("_componentStateData", JSON.stringify({
    componentsStates: {}, componentIDs: {}, backups: {}
  }));


class SessionStatesHandler {

  // function getComponentState(sKey) {
  //   let componentStateData = JSON.parse(
  //     sessionStorage.getItem("_componentStateData")
  //   );
  //   return componentStateData.componentStates[sKey];
  // }

  // function getAllComponentStates() {
  //   let componentStateData = JSON.parse(
  //     sessionStorage.getItem("_componentStateData")
  //   );
  //   return componentStateData.componentStates;
  // }

  static setComponentState(sKey, state) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    componentStateData.componentStates[sKey] = state;
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }

  static deleteComponentState(sKey) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    delete componentStateData.componentStates[sKey];
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }

  static lookupOrCreateComponentState(sKey, state) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    let state = componentStateData.componentStates[sKey];
    if (state) {
      return state;
    } else {
      componentStateData.componentStates[sKey] = state;
      sessionStorage.setItem(
        "_componentStateData",
        JSON.stringify(componentStateData)
      );
      return state;
    }
  }


  static nonce = -1;

  static lookupOrCreateComponentID(componentName) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    let componentID = componentStateData.componentIDs[componentName];
    if (componentID) {
      return componentID;
    } else {
      nonce++;
      componentStateData.componentIDs[componentName] = nonce;
      sessionStorage.setItem(
        "_componentStateData",
        JSON.stringify(componentStateData)
      );
      return nonce.toString();
    }
  }



  static backUpChildStates(sKey) {
    // Get all component states.
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    let allStates = componentStateData.componentStates;

    // Filter out the descendant states.
    let descendantStates = Object.entries(allStates).filter(([key, ]) => {
      return key.startsWith(sKey);
    });

    // Set the backup.
    componentStateData.backups[sKey] = descendantStates;
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }

  static restoreChildStates(sKey) {
    // Get the descendant states from backup.
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    let descendantStates = componentStateData.backups[sKey];
    descendantStates.forEach((key, state) => {
      SessionStatesHandler.setComponentState(key, state);
    });

    // Delete the backup.
    delete componentStateData.backups[sKey];
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }

}









function getSKeysAndCIDFromProps(props) {
  const sKey = (props.isRoot) ? props.id :
    props._sKey;
  const pSKey = (props.isRoot) ? undefined :
    props._sKey.replace(/\/[^\/]+$/, "");
  const componentName = props._name;
  const componentID = SessionStatesHandler.lookupOrCreateComponentID(
    componentName
  );

  return [sKey, pSKey, componentID];
}

// TODO: I might need to refactor where lookupOrCreateComponentID() is called.




// This useSessionState() hook is a wrapper around the normal useState hook,
// which also backs up the state of the component in sessionStorage for as
// long as it is mounted, meaning that navigation to and back from another
// website will restore the state.
// useSessionState() returns an sKey (session state key) along with the usual
// state and setState returns, which is supposed to be drilled to any session-
// stateful descendant components, which these can then use as their pSKey (parent
// session state key) input. If the pSKey is undefined, then the component that
// calls this hook acts as a root for storing the session state.
export const useSessionState = (
  props, initState = null, reducers, backUpAndRemove
) => {
  const [sKey, pSKey, componentID] = getSKeysAndCIDFromProps(props);
  

  // Call the useState() hook, but initialize as the stored session state
  // if any is available, instead of as initState.
  const [state, internalSetState] = useState(
    SessionStatesHandler.lookupOrCreateComponentState(sKey, initState)
  );

  // Prepare the setState() function that also stores the state in
  // sessionStorage.
  const setState = useMemo(() => ((y) => {
    internalSetState(prev => {
      let newState = (y instanceof Function) ? y(prev) : y;
      SessionStatesHandler.setComponentState(sKey, newState);
      return newState;
    });
  }), []);


  // We store the parent key in order to be able to set and get states from
  // a parent, as well as to check whether descendant states should be saved.
  // We also store setState as auxillary data in order for descendants to be
  // able to access it.
  useMemo(() => {
    sessionStateAuxillaryDataStore[sKey] = {
      pSKey: pSKey,
      componentID: componentID,
      reducers: {...reducers, setState: setState},
      backUpAndRemove: backUpAndRemove,
    }
  }, []);


  // Whenever backUpAndRemove changes, either back up descendant states in a
  // separate place in session storage, before they are being removed,
  // or restore them from this backup. 
  useMemo(() => {
    auxData = sessionStateAuxillaryDataStore[sKey];
    if (backUpAndRemove && !auxData.backUpAndRemove) {
      SessionStatesHandler.backUpChildStates(sKey);
    }
    else if (!backUpAndRemove && auxData.backUpAndRemove) {
      SessionStatesHandler.restoreChildStates(sKey);
    }
    auxData.backUpAndRemove = backUpAndRemove;
  }, [backUpAndRemove]);


  // Cleanup function to both delete this auxillary data, as well as the
  // session state.
  useEffect(() => {
    return () => {
      delete sessionStateAuxillaryDataStore[sKey];
      SessionStatesHandler.deleteComponentState(sKey);
    };
  }, []);


  // Prepare the dispatch function, which is able to change the sate of the
  // component itself, or of any of its ancestors, by calling one of the
  // provided reducers, or an ancestor's reducer. We also always add the all-
  // powerful setState as a reducer, but it is recommended to only use custom
  // reducers, as these can then constitute an API of the "public methods"
  // for the component (or "protected"; you can only call them from itself
  // or its descendants).
  const dispatch = useMemo(() => ((componentName, action, params = []) => {
    // If componentName = "self", call one of this state's own reducers.
    if (componentName === "self") {
      let reducer = reducers[action];
      setState(state => reducer(state, ...params));
      return;
    }

    let skip = 0;
    // If componentKey is an array, treat it as [componentKey, skip] instead,
    // where skip is the number of ancestors to skip.
    if (Array.isArray(componentName)) {
      [componentName, skip] = componentName;
      skip = parseInt(skip);
    }

    // If code reaches here, then we should look up the nearest ancestor
    // of componentKey, after having skipped over skip ancestors.
    let ancReducers = getAncestorReducers(sKey, componentName, skip);
    let reducer = ancReducers[action];
    setState(state => reducer(state, ...params));
    return;
  }), []);


  // prepareJSX() is supposed to wrap around all returned JSX elements from the
  // component. Its task is to drill the underlying sKey-related props. It also
  // automatically returns and empty JSX fragment if backUpAndRemove is set to
  // true.
  const prepareJSX = useMemo(() => ((element) => {
    // If backUpAndRemove, return an empty JSX fragment.
    if (backUpAndRemove) {
      return <></>;
    }
    
    // Prepare the returned JSX element.
    let ret = {...element};


  }), [backUpAndRemove]);


  // Return the state and the expanded setState function, as well as the sKey
  // (session state key), which ought to be drilled to child components in
  // order to be used for the pSKey (parent session state key) property of
  // this very hook by descendant components. 
  return [state, dispatch, prepareJSX];
};






export const useRootSessionState = (
  id, name, initState, reducers, backUpAndRemove
) => {
  let props = getRootProps(id, name);
  return useSessionState(props, initState, reducers, backUpAndRemove);
};




function getRootProps(id, name) {
  return {id: id, _name: name ?? "root", isRoot: true};
}





export const usePrepareJSX = (props, backUpAndRemove) => {
  const [sKey, pSKey, componentID] = getSKeysAndCIDFromProps(props);
  const prepareJSX = useMemo(() => ((element) => {
    prepareJSXFromData(element, sKey, pSKey, componentID, backUpAndRemove)
  }), [backUpAndRemove]);
  return prepareJSX;
};


export const useRootPrepareJSX = (id, name, backUpAndRemove) => {
  let props = getRootProps(id, name);
  return usePrepareJSX(props, backUpAndRemove);
};







// prepareJSX() is supposed to wrap around all returned JSX elements from the
// component. Its task is to drill the underlying sKey-related props. It also
// automatically returns and empty JSX fragment if backUpAndRemove is set to
// true.
function prepareJSXFromData(
  element, sKey, pSKey, componentID, backUpAndRemove
) {
  // If backUpAndRemove, return an empty JSX fragment.
  if (backUpAndRemove) {
    return <></>;
  }
  
  // Prepare the new JSX element to return.
  let ret = {...element};

  
}


function getPreparedJSX(pSKey, element) {
  let ret = {...element};
  if (ret.key !== null && ret.key !== undefined) {
    ret._key = ret.key;
    ret._pSKey = pSKey;
  }
  let children = ret.props.children;
  if (children) {
    if (Array.isArray(children)) {
      ret.props.children = children.map(child => getPreparedJSX(pSKey, child));
    }
    else {
      ret.props.children = getPreparedJSX(pSKey, children);
    }
  }
  return ret;
}




function getAncestorReducers(sKey, componentName, skip) {
  let componentID = SessionStatesHandler.lookupOrCreateComponentID(
    componentName
  );
  var data = sessionStateAuxillaryDataStore[sKey];
  while (data) {
    if (!data.componentID === componentID) {
      if (skip <= 0) {
        return data.reducers;
      } else {
        skip--;
      }
    }
    if (!data.pSKey) {
      return false;
    }
    data = sessionStateAuxillaryDataStore[data.pSKey];
  }
}





export const useSaveSessionChildren = (shouldBeSaved) => {
  const sKey = useId();
  if (!sessionStateAuxillaryDataStore[sKey]) {
    throw "useSaveChildren(): Call useSessionState() before this hook."
  }
  sessionStateAuxillaryDataStore[sKey].saveChildren = shouldBeSaved;
}



export const useAncestorSessionState = (contextKey, skip) => {
  skip ??= 0;
  const sKey = useId();

  // Get the sKey of the ancestor.
  var ancKey =  getAncestorKey(sKey, contextKey);
  while (skip > 0) {
    skip = skip - 1;
    ancKey =  getAncestorKey(ancKey, contextKey);
  }

  // Return the state and the setState function.
  const state = JSON.parse(sessionStorage.getItem(ancKey));
  const setState = sessionStateAuxillaryDataStore[ancKey].setState;
  return [state, setState];
}


function getAncestorKey(sKey, contextKey) {
  var data;
  while (data = sessionStateAuxillaryDataStore[sKey]) {
    if (!data) {
      return false;
    }
    if (data.contextKey === contextKey) {
      return sKey;
    }
    if (data.pSKey === "root") {
      return false;
    }
    sKey = data.pSKey;
  }
}
