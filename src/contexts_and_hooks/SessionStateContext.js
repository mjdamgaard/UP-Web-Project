import {
  useState, useId, useEffect, useMemo,
} from "react";



const sessionStateAuxillaryDataStore = {};


// This useSessionState() hook is a wrapper around the normal useState hook,
// which also backs up the state of the component in sessionStorage for as
// long as it is mounted, meaning that navigation to and back from another
// website will restore the state.
// useSessionState() returns an sKey (session state key) along with the usual
// state and setState returns, which is supposed to be drilled to any session-
// stateful child components, which these can then use as their psKey (parent
// session state key) input. If the psKey is undefined, then the component that
// calls this hook acts as a root for storing the session state.
export const useSessionState = (initState, psKey, contextKey) => {
  initState ??= null;
  psKey ??= "root";
  const sKey = useId();
  

  // Call the useState hook, but initialize as the stored session state
  // if any is available, instead of as initState.
  const [state, internalSetState] = useState(
    JSON.parse(sessionStorage.getItem(sKey)) ??
      sessionStorage.setItem(sKey, JSON.stringify(initState)) ?
        initState : initState
  );

  // Prepare the setState function that also stores the state in sessionStorage.
  const setState = useMemo(() => ((y) => {
    internalSetState(prev => {
      let newState = (y instanceof Function) ? y(prev) : y;
      sessionStorage.setItem(sKey, JSON.stringify(newState ?? null));
      return newState;
    });
  }), []);

  // Record psKey and setState in an auxillary data structure, and define
  // a cleanup function to both delete this auxillary data, as well as the
  // session state, but only if a parent node does not have the boolean
  // saveChildren property set as true.
  useEffect(() => {
    // We store the parent key in order to be able to set and get states from
    // a parent, as well as to check whether children states should be saved.
    // We also store setState as auxillary data in order for children to be
    // able to access it.
    sessionStateAuxillaryDataStore[sKey] = {
      psKey: psKey,
      setState: setState,
      contextKey: contextKey,
    }

    // Clean up after an unmount, but not if a parent node tells us to save
    // the children.
    return () => {
      if (!getShouldBeSaved(sKey)) {
        delete sessionStateAuxillaryDataStore[sKey];
        sessionStorage.removeItem(sKey);
      }
    };
  }, []);

  // Return the state and the expanded setState function, as well as the sKey
  // (session state key), which ought to be drilled to child components in
  // order to be used for the psKey (parent session state key) property of
  // this very hook by children components. 
  return [state, setState, sKey];
};


function getShouldBeSaved(sKey) {
  var ret = false;
  var data = sessionStateAuxillaryDataStore[sKey];
  while (data) {
    if (!data.psKey) {
      return false;
    }
    if (data.saveChildren) {
      ret = true;
      continue;
    }
    if (data.psKey === "root") {
      break;
    }
    data = sessionStateAuxillaryDataStore[data.psKey];
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
    if (data.psKey === "root") {
      return false;
    }
    sKey = data.psKey;
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
//     // localStorage.componentStates[nodeID] = removedSavedChildren;

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