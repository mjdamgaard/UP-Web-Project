import {
  useState, useId, useEffect, createContext, useContext, useMemo,
} from "react";
// import {LazyDelayedPromise} from "../classes/LazyDelayedPromise";



const HistoryStateContext = createContext();


export const HistoryStateProvider = ({children}) => {
  const providerID = useId();
  
  const getChildHistoryState = useMemo(() => ((key) => {
    // First update history.state.
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState.componentStates ??= {};
    newState.componentStates[providerID] ??= {};
    return newState.componentStates[providerID][key];
  }), []);

  const setChildHistoryState = useMemo(() => ((key, state) => {
    // First update history.state.
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState.componentStates ??= {};
    newState.componentStates[providerID] ??= {};
    newState.componentStates[providerID][key] = state;
    window.history.replaceState(newState, "");
  }), []);

  const deleteChildHistoryState = useMemo(() => ((key) => {
    // First remove the child state from history.state.
    let prevState = window.history.state ?? {};
    let newState = {...prevState};
    newState.componentStates ??= {};
    newState.componentStates[providerID] ??= {};
    delete newState.componentStates[providerID][key];
    window.history.replaceState(newState, "");
  }), []);



  // TODO: Check that pushing state frequently doesn't slow the app down.


  // When this component is unmounted, remove its data from history.state. 
  useEffect(() => {
    // Clean up after an unmount (but not when navigating to other websites).
    return () => {
      let prevState = window.history.state ?? {};
      let newState = {...prevState};
      newState.componentStates ??= {};
      delete newState.componentStates[providerID];
      window.history.replaceState(newState, "");
    };
  }, []);

  return (
    <HistoryStateContext.Provider value={
      [getChildHistoryState, setChildHistoryState, deleteChildHistoryState]
    } >
      {children}
    </HistoryStateContext.Provider>
  );
};




// This useHistoryState() hook is a wrapper around the normal useState hook,
// which also backs up the state of the component in the global history.state
// object, under history.state.componentStates for as long as it is mounted,
// meaning that navigation to and back from another website will restore the
// state.
export const useHistoryState = (initState) => {
  const componentID = useId();
  const [getChildHistoryState, setChildHistoryState, deleteChildHistoryState] =
    useContext(HistoryStateContext);

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
