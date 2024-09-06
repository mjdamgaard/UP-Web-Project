import {useState, useId, useEffect, createContext, useContext} from "react";

import {LazyDelayedPromise} from "../classes/LazyDelayedPromise";

// // TODO: Refactor whenReady() as a class in another module (and import it from
// // there).
// const DELAY = 2000;
// var isReady = false;
// var callbackArr = [];
// function whenReady(callback) {
//   callbackArr.push(callback);
//   if (isReady) {
//     isReady = false;
//     let lastCallback = callbackArr.pop()();
//     callbackArr = [];
//     lastCallback();
//     sleep(DELAY).then(() => {
//       if (!isReady) {
//         isReady = true;
//       }
//     });
//   }
//   else {
//     sleep(DELAY).then(() => {
//       if (callbackArr.length > 0 && isReady) {
//         isReady = false;
//         let lastCallback = callbackArr.pop()();
//         callbackArr = [];
//         lastCallback();
//       }
//     })
//   }
// }

export const HistoryStateContext = createContext();


export const HistoryStateProvider = ({children}) => {
  const [childStates, setChildStates] = useState([]);

  const setChildState = useMemo(() => ((key, state) => {
    setChildStates(prev => {
      let ret = {...prev};
      ret[key] = state;
      return ret;
    });
  }), []);
  const removeChildState = useMemo(() => ((key) => {
    setChildStates(prev => {
      let ret = {...prev};
      delete ret[key];
      return ret;
    });
  }), []);

  const providerID = useId();

  // Create an instance of LazyDelayedPromise(delay), which waits the delay
  // before executing only the most recently add callback (from the .then()
  // method), before resetting, ready to receive new callbacks.
  const lazyDelayedPromise = useMemo(() => {
    return new LazyDelayedPromise(2000);
  }, []);

  // When childState updates, store then lazily to the history.state object.
  useEffect(() => {
    lazyDelayedPromise.then(() => {
      let prevState = window.history.state ?? {};
      let newState = {...prevState};
      newState.componentStates ??= {};
      newState.componentStates[providerID] = childStates;
      window.history.pushState(newState);
    });
  }, [childStates]);

  // When this component dismounts, remove its data from history.state. 
  useEffect(() => {
    // Clean up after a dismount (but not when navigating to other websites).
    return () => {
      let prevState = window.history.state ?? {};
      let newState = {...prevState};
      newState.componentStates ??= {};
      delete newState.componentStates[providerID];
      window.history.pushState(newState);
    };
  }, []);

  return (
    <HistoryStateContext.Provider value={[setChildState, removeChildState]} >
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
  const [setChildState, removeChildState] = useContext(HistoryStateContext);
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
  
  const setState = useMemo(() => ((y) => {
    if (y instanceof Function) {
      window.history.state.componentStates[componentID] = y(state);
    }
    else {
      window.history.state.componentStates[componentID] = y;
    }
    internalSetState(y);
  }), []);

  return [state, setState];
};
