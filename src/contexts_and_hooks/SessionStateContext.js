import {
  useState, useId, useEffect, createContext, useContext, useMemo,
} from "react";
// import {LazyDelayedPromise} from "../classes/LazyDelayedPromise";


// TODO: Change implementation to use sessionStorage instead. (In order to
// get mre space and reduce code.)


const SessionStateContext = createContext();


export const SessionStateContextProvider = ({children, initState}) => {
  const providerID = useId();

  /* Shared state getter and setter */
  var state = window.history.state; state &&
    (state = state.sharedStates) &&
    (state = state[providerID]);
  const [sharedState, setSharedState] = useState(state ?? initState ?? {});

  const getSharedSessionState = useMemo(() => (() => {
    return sharedState;
  }), []);

  const setSharedSessionState = useMemo(() => ((state) => {
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState.sharedStates ??= {};
    newState.sharedStates[providerID] = state;
    window.history.replaceState(newState, "");
    setSharedState(state);
  }), []);



  /* Child state getter, setter, and delete function */
  const getChildSessionState = useMemo(() => ((key) => {
    let state = window.history.state; state &&
      (state = state.componentStates) &&
      (state = state[providerID]) &&
      (state = state[key]);
    return state;
  }), []);

  const setChildSessionState = useMemo(() => ((key, state) => {
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState.componentStates ??= {};
    newState.componentStates[providerID] ??= {};
    newState.componentStates[providerID][key] = state;
    window.history.replaceState(newState, "");
  }), []);

  const deleteChildSessionState = useMemo(() => ((key) => {
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState.componentStates ??= {};
    newState.componentStates[providerID] ??= {};
    delete newState.componentStates[providerID][key];
    window.history.replaceState(newState, "");
  }), []);

  
  /* Global state getter and setter */
  const getGlobalSessionState = useMemo(() => (() => {
    let state = window.history.state;
    state && (state = state._globalState);
    return state;
  }), []);

  const setGlobalSessionState = useMemo(() => ((state) => {
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
      newState.componentStates ??= {};
      newState.sharedStates ??= {};
      delete newState.componentStates[providerID];
      delete newState.sharedStates[providerID];
      window.history.replaceState(newState, "");
    };
  }, []);

  return (
    <SessionStateContext.Provider value={[
      getSharedSessionState, setSharedSessionState,
      getChildSessionState, setChildSessionState, deleteChildSessionState,
      getGlobalSessionState, setGlobalSessionState,
    ]} >
      {children}
    </SessionStateContext.Provider>
  );
};




// This useSessionState() hook is a wrapper around the normal useState hook,
// which also backs up the state of the component in the global history.state
// object, under history.state.componentStates for as long as it is mounted,
// meaning that navigation to and back from another website will restore the
// state.
export const useSessionState = (initState) => {
  const componentID = useId();
  const [
    ,,
    getChildSessionState, setChildSessionState, deleteChildSessionState
  ] = useContext(SessionStateContext);

  // If the component calling this hook is unmounted, delete its history.state
  // record.
  useEffect(() => {
    // Clean up after an unmount (but not when navigating to other websites).
    return () => {
      deleteChildSessionState(componentID);
    };
  }, []);

  // Call the useState hook, but initialize as the stored history child state
  // if any is available, instead of as initState.
  const [state, internalSetState] = useState(
    getChildSessionState(componentID) ?? initState
  );

  // Prepare the setState function that also stores the state in history.state.
  const setState = useMemo(() => ((y) => {
    if (y instanceof Function) {
      setChildSessionState(componentID, y(state));
    }
    else {
      setChildSessionState(componentID, y);
    }
    internalSetState(y);
  }), []);

  return [state, setState];
};



export const useSharedSessionState = () => {
  const componentID = useId();
  const [
    getSharedSessionState, setSharedSessionState
  ] = useContext(SessionStateContext);

  return [getSharedSessionState, setSharedSessionState];
};

export const useGlobalSessionState = () => {
  const componentID = useId();
  const [
    ,,
    ,,,
    getGlobalSessionState, setGlobalSessionState
  ] = useContext(SessionStateContext);

  return [getGlobalSessionState, setGlobalSessionState];
};