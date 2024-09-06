import {
  useState, useId, useEffect, createContext, useContext, useMemo,
} from "react";
// import {LazyDelayedPromise} from "../classes/LazyDelayedPromise";



const HistoryStateContext = createContext();


export const HistoryStateContextProvider = ({children, initState}) => {
  const providerID = useId();

  /* Shared state getter and setter */
  var state = window.history.state; state &&
    (state = state._sharedStates) &&
    (state = state[providerID]);
  const [sharedState, setSharedState] = useState(state ?? initState ?? {});

  const getSharedHistoryState = useMemo(() => (() => {
    return sharedState;
  }), []);

  const setSharedHistoryState = useMemo(() => ((state) => {
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState._sharedStates ??= {};
    newState._sharedStates[providerID] = state;
    window.history.replaceState(newState, "");
    setSharedState(state);
  }), []);



  /* Child state getter, setter, and delete function */
  const getChildHistoryState = useMemo(() => ((key) => {
    let state = window.history.state; state &&
      (state = state._componentStates) &&
      (state = state[providerID]) &&
      (state = state[key]);
    return state;
  }), []);

  const setChildHistoryState = useMemo(() => ((key, state) => {
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState._componentStates ??= {};
    newState._componentStates[providerID] ??= {};
    newState._componentStates[providerID][key] = state;
    window.history.replaceState(newState, "");
  }), []);

  const deleteChildHistoryState = useMemo(() => ((key) => {
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState._componentStates ??= {};
    newState._componentStates[providerID] ??= {};
    delete newState._componentStates[providerID][key];
    window.history.replaceState(newState, "");
  }), []);

  
  /* Global state getter and setter */
  const getGlobalHistoryState = useMemo(() => (() => {
    let state = window.history.state;
    state && (state = state._globalState);
    return state;
  }), []);

  const setGlobalHistoryState = useMemo(() => ((state) => {
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState._globalState ??= {};
    newState._globalState = state;
    window.history.replaceState(newState, "");
  }), []);


  // TODO: Check that replacing state frequently doesn't slow the app down.


  // When this component is unmounted, remove its data from history.state. 
  useEffect(() => {
    // Clean up after an unmount (but not when navigating to other websites).
    return () => {
      let prevState = window.history.state ?? {};
      let newState = {...prevState};
      newState._componentStates ??= {};
      newState._sharedStates ??= {};
      delete newState._componentStates[providerID];
      delete newState._sharedStates[providerID];
      window.history.replaceState(newState, "");
    };
  }, []);

  return (
    <HistoryStateContext.Provider value={[
      getSharedHistoryState, setSharedHistoryState,
      getChildHistoryState, setChildHistoryState, deleteChildHistoryState,
      getGlobalHistoryState, setGlobalHistoryState,
    ]} >
      {children}
    </HistoryStateContext.Provider>
  );
};




// This useHistoryState() hook is a wrapper around the normal useState hook,
// which also backs up the state of the component in the global history.state
// object, under history.state._componentStates for as long as it is mounted,
// meaning that navigation to and back from another website will restore the
// state.
export const useHistoryState = (initState) => {
  const componentID = useId();
  const [
    ,,
    getChildHistoryState, setChildHistoryState, deleteChildHistoryState
  ] = useContext(HistoryStateContext);

  // If the component calling this hook is unmounted, delete its history.state
  // record.
  useEffect(() => {
    // Clean up after an unmount (but not when navigating to other websites).
    return () => {
      deleteChildHistoryState(componentID);
    };
  }, []);

  // Call the useState hook, but initialize as the stored history child state
  // if any is available, instead of as initState.
  const [state, internalSetState] = useState(
    getChildHistoryState(componentID) ?? initState
  );

  // Prepare the setState function that also stores the state in history.state.
  const setState = useMemo(() => ((y) => {
    if (y instanceof Function) {
      setChildHistoryState(componentID, y(state));
    }
    else {
      setChildHistoryState(componentID, y);
    }
    internalSetState(y);
  }), []);

  return [state, setState];
};



export const useSharedHistoryState = () => {
  const componentID = useId();
  const [
    getSharedHistoryState, setSharedHistoryState
  ] = useContext(HistoryStateContext);

  return [getSharedHistoryState, setSharedHistoryState];
};

export const useGlobalHistoryState = () => {
  const componentID = useId();
  const [
    ,,
    ,,,
    getGlobalHistoryState, setGlobalHistoryState
  ] = useContext(HistoryStateContext);

  return [getGlobalHistoryState, setGlobalHistoryState];
};