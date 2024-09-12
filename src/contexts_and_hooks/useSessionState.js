import {
  useState, useId, useEffect, useMemo,
} from "react";



const sessionStateAuxillaryDataStore = {};

const COMPONENT_ID_PREFIX = "_i.";
// const ROOT_ID_PREFIX      = "r.";
// const S_KEY_PREFIX        = "s.";
sessionStorage.getItem("_componentStateData") ||
  sessionStorage.setItem("_componentStateData", JSON.stringify({
    componentsStates: {}, componentIDs: {}, backups: {}
  }));
// sessionStorage.getItem("_componentIDs") ||
//   sessionStorage.setItem("_componentIDs", JSON.stringify({}));



function getComponentState(sKey) {
  let componentStateData = JSON.parse(
    sessionStorage.getItem("_componentStateData")
  );
  return componentStateData.componentStates[sKey];
}

function getAllComponentStates() {
  let componentStateData = JSON.parse(
    sessionStorage.getItem("_componentStateData")
  );
  return componentStateData.componentStates;
}

function setComponentState(sKey, state) {
  let componentStateData = JSON.parse(
    sessionStorage.getItem("_componentStateData")
  );
  componentStateData.componentStates[sKey] = state;
  sessionStorage.setItem(
    "_componentStateData",
    JSON.stringify(componentStateData)
  );
}

function deleteComponentState(sKey) {
  let componentStateData = JSON.parse(
    sessionStorage.getItem("_componentStateData")
  );
  delete componentStateData.componentStates[sKey];
  sessionStorage.setItem(
    "_componentStateData",
    JSON.stringify(componentStateData)
  );
}

function lookupOrCreateComponentState(sKey, state) {
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


var nonce = -1;

function lookupOrCreateComponentID(componentName) {
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



function backUpChildStates(sKey) {
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

function restoreChildStates(sKey) {
  // Get the descendant states from backup.
  let componentStateData = JSON.parse(
    sessionStorage.getItem("_componentStateData")
  );
  let descendantStates = componentStateData.backups[sKey];
  descendantStates.forEach((key, state) => {
    setComponentState(key, state);
  });

  // Delete the backup.
  delete componentStateData.backups[sKey];
  sessionStorage.setItem(
    "_componentStateData",
    JSON.stringify(componentStateData)
  );
}





// export const useSessionStateRootProps = (id, name) => {
//   const rootProps = {_pSKey: id, _name: name ?? "root"};
//   return rootProps;
// };

export const getRootProps = (id, name) => {
  return {id: id, _name: name ?? "root", isRoot: true};
};


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
  props, initState, reducers, backUpAndRemove
) => {
  initState ??= null;

  const sKey = (props.isRoot) ? props.id :
    props._sKey;
  const pSKey = (props.isRoot) ? undefined :
    props._sKey.replace(/\/[^\/]+$/, "");

  const componentName = props._name;
  const componentID = lookupOrCreateComponentID(componentName);
  

  // Call the useState() hook, but initialize as the stored session state
  // if any is available, instead of as initState.
  const [state, internalSetState] = useState(
    lookupOrCreateComponentState(sKey, state)
  );

  // Prepare the setState() function that also stores the state in
  // sessionStorage.
  const setState = useMemo(() => ((y) => {
    internalSetState(prev => {
      let newState = (y instanceof Function) ? y(prev) : y;
      setComponentState(sKey, newState);
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
      backUpChildStates(sKey);
    }
    else if (!backUpAndRemove && auxData.backUpAndRemove) {
      restoreChildStates(sKey);
    }
    auxData.backUpAndRemove = backUpAndRemove;
  }, [backUpAndRemove]);


  // Cleanup function to both delete this auxillary data, as well as the
  // session state.
  useEffect(() => {
    return () => {
      delete sessionStateAuxillaryDataStore[sKey];
      sessionStorage.removeItem(S_KEY_PREFIX + sKey);
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



  const prepareJSX = useMemo(() => ((element) => {
    
  }), [backUpAndRemove]);


  // Return the state and the expanded setState function, as well as the sKey
  // (session state key), which ought to be drilled to child components in
  // order to be used for the pSKey (parent session state key) property of
  // this very hook by descendant components. 
  return [state, dispatch, prepareJSX];
};





function getAncestorReducers(sKey, componentName, skip) {
  let componentID = lookupOrCreateComponentID(componentName);
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



function getShouldBeSaved(sKey) {
  var ret = false;
  var data = sessionStateAuxillaryDataStore[sKey];
  while (data) {
    if (!data.pSKey) {
      return false;
    }
    if (data.saveChildren) {
      ret = true;
      continue;
    }
    if (data.pSKey === "root") {
      break;
    }
    data = sessionStateAuxillaryDataStore[data.pSKey];
  }
  return ret;
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



// const ParentSessionStateContext = createContext();


// export const SessionStateRoot = ({children}) => {
//   return (
//     <ParentSessionStateContext.Provider value={null} >
//       {children}
//     </ParentSessionStateContext.Provider>
//   );
// };

// export const ChildrenSessionStateSaver = ({
//   children, removedSavedChildren
// }) => {
//   const nodeID = useId();
//   const parentNodeID = useContext(ParentSessionStateContext);

//   useEffect(() => {
//     sessionStateAuxillaryDataStore[nodeID] = {
//       type: "SessionChildrenStateSaver",
//       parent: parentNodeID,
//     }
//     // sessionStorage.componentStates[nodeID] = removedSavedChildren;

//     // Clean up after an unmount (but not when navigating to other websites).
//     return () => {
//       let prevState = window.history.state ?? {};
//       let newState = {...prevState};
//       newState.componentStates ??= {};
//       newState.sharedStates ??= {};
//       delete newState.componentStates[providerID];
//       delete newState.sharedStates[providerID];
//       window.history.replaceState(newState, "");
//     };
//   }, []);

//   return (
//     <ParentSessionStateContext.Provider value={providerID} >
//       {children}
//     </ParentSessionStateContext.Provider>
//   );
// };







// // TODO: Change implementation to use sessionStorage instead. (In order to
// // get mre space and reduce code.)


// const SessionStateContext = createContext();


// export const SessionStateContextProvider = ({children, initState}) => {
//   const providerID = useId();

//   /* Shared state getter and setter */
//   var state = window.history.state; state &&
//     (state = state.sharedStates) &&
//     (state = state[providerID]);
//   const [sharedState, setSharedState] = useState(state ?? initState ?? {});

//   const getSharedSessionState = useMemo(() => (() => {
//     return sharedState;
//   }), []);

//   const setSharedSessionState = useMemo(() => ((state) => {
//     let prevState = window.history.state ?? {};
//     let newState = {...prevState};
//     newState.sharedStates ??= {};
//     newState.sharedStates[providerID] = state;
//     window.history.replaceState(newState, "");
//     setSharedState(state);
//   }), []);



//   /* Child state getter, setter, and delete function */
//   const getChildSessionState = useMemo(() => ((key) => {
//     let state = window.history.state; state &&
//       (state = state.componentStates) &&
//       (state = state[providerID]) &&
//       (state = state[key]);
//     return state;
//   }), []);

//   const setChildSessionState = useMemo(() => ((key, state) => {
//     let prevState = window.history.state ?? {};
//     let newState = {...prevState};
//     newState.componentStates ??= {};
//     newState.componentStates[providerID] ??= {};
//     newState.componentStates[providerID][key] = state;
//     window.history.replaceState(newState, "");
//   }), []);

//   const deleteChildSessionState = useMemo(() => ((key) => {
//     let prevState = window.history.state ?? {};
//     let newState = {...prevState};
//     newState.componentStates ??= {};
//     newState.componentStates[providerID] ??= {};
//     delete newState.componentStates[providerID][key];
//     window.history.replaceState(newState, "");
//   }), []);

  
//   /* Global state getter and setter */
//   const getGlobalSessionState = useMemo(() => (() => {
//     let state = window.history.state;
//     state && (state = state.globalState);
//     return state;
//   }), []);

//   const setGlobalSessionState = useMemo(() => ((state) => {
//     let prevState = window.history.state ?? {};
//     let newState = {...prevState};
//     newState.globalState ??= {};
//     newState.globalState = state;
//     window.history.replaceState(newState, "");
//   }), []);


//   // TODO: Check that replacing state frequently doesn't slow the app down.


//   // When this component is unmounted, remove its data from history.state. 
//   useEffect(() => {
//     // Clean up after an unmount (but not when navigating to other websites).
//     return () => {
//       let prevState = window.history.state ?? {};
//       let newState = {...prevState};
//       newState.componentStates ??= {};
//       newState.sharedStates ??= {};
//       delete newState.componentStates[providerID];
//       delete newState.sharedStates[providerID];
//       window.history.replaceState(newState, "");
//     };
//   }, []);

//   return (
//     <SessionStateContext.Provider value={[
//       getSharedSessionState, setSharedSessionState,
//       getChildSessionState, setChildSessionState, deleteChildSessionState,
//       getGlobalSessionState, setGlobalSessionState,
//     ]} >
//       {children}
//     </SessionStateContext.Provider>
//   );
// };




// // // This useSessionState() hook is a wrapper around the normal useState hook,
// // // which also backs up the state of the component in the global history.state
// // // object, under history.state.componentStates for as long as it is mounted,
// // // meaning that navigation to and back from another website will restore the
// // // state.
// // export const useSessionState = (initState) => {
// //   const componentID = useId();
// //   const [
// //     ,,
// //     getChildSessionState, setChildSessionState, deleteChildSessionState
// //   ] = useContext(SessionStateContext);

// //   // If the component calling this hook is unmounted, delete its history.state
// //   // record.
// //   useEffect(() => {
// //     // Clean up after an unmount (but not when navigating to other websites).
// //     return () => {
// //       deleteChildSessionState(componentID);
// //     };
// //   }, []);

// //   // Call the useState hook, but initialize as the stored history child state
// //   // if any is available, instead of as initState.
// //   const [state, internalSetState] = useState(
// //     getChildSessionState(componentID) ?? initState
// //   );

// //   // Prepare the setState function that also stores the state in history.state.
// //   const setState = useMemo(() => ((y) => {
// //     if (y instanceof Function) {
// //       setChildSessionState(componentID, y(state));
// //     }
// //     else {
// //       setChildSessionState(componentID, y);
// //     }
// //     internalSetState(y);
// //   }), []);

// //   return [state, setState];
// // };



// export const useSharedSessionState = (initState) => {
//   const [
//     getSharedSessionState, setSharedSessionState
//   ] = useContext(SessionStateContext);

//   if (initState !== undefined && getSharedSessionState() === undefined) {
//     setSharedSessionState(initState);
//   }

//   return [getSharedSessionState(), setSharedSessionState];
// };


// export const useGlobalSessionState = (initState) => {
//   const [
//     ,,
//     ,,,
//     getGlobalSessionState, setGlobalSessionState
//   ] = useContext(SessionStateContext);

//   if (initState !== undefined && getGlobalSessionState() === undefined) {
//     setGlobalSessionState(initState);
//   }

//   return [getGlobalSessionState(), setGlobalSessionState];
// };