import {useState, useId, useEffect} from "react";

// This useHistoryState() hook is a wrapper around the normal useState hook,
// which also backs up the state of the component in the global history.state
// object, under history.state.componentStates for as long as it is mounted,
// meaning that navigation to and back from another website will restore the
// state.
export const useHistoryState = (initState) => {
  const componentID = useId();
  
  if (!window.history.state) {
    window.history.state = {};
  }
  if (!window.history.state.componentStates) {
    window.history.state.componentStates = {};
  }
  useEffect(() => {
    if (!window.history.state.componentStates[componentID]) {
      window.history.state.componentStates[componentID] = initState;
    }
    // Cleanup function to remove the history state:
    return () => {
      delete window.history.state.componentStates[componentID];
    };
  }, []);

  const [state, internalSetState] = useState(
    window.history.state.componentStates[componentID] ?? initState
  );
  
  const setState = (y) => {
    if (y instanceof Function) {
      window.history.state.componentStates[componentID] = y(state);
    }
    else {
      window.history.state.componentStates[componentID] = y;
    }
    internalSetState(y);
  };

  return [state, setState];
};
