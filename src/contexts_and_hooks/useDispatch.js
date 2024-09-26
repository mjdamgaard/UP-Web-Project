import {
  useState, useEffect, useLayoutEffect, useRef, useId, useMemo, useCallback
} from "react";



const auxDataStore = {};
// Using an array instead here would likely be faster, but would result in
// some memory leakage as the length of the array would grow longer and longer.

var nonce = 0;
function getNonce() {
  return ++nonce;
}

/**
  This useSessionState() hook is a wrapper around the normal useState hook,
  which also backs up the state of the component in sessionStorage for as
  long as it is mounted, meaning that navigation to and back from another
  website will restore the state.
  Returns:
  useSessionState() returns the state like normal, but returns a dispatch()
  function (with more possibilities) instead of the normal setState(). More on
  dispatch() below.
  Lastly, it returns a passData() function, which has to wrap around any
  returned (JSX) element of the component if the children includes any session-
  stateful components. passData() then serves to pass the keys that allows
  useSessionState() to construct its own tree of DOM nodes.
  The order of the returns are: [state, passData, dispatch].
  Inputs:
  First input is the initial state, just like for useState().
  Second input is the props of the component, which is used both to get the
  relevant keys from the passData() called by the parent component, and is
  also used in the dispatch() function, meaning that the outcome of dispatch()
  can depend on props. Furthermore, it can also depend on the component's
  contexts, but this require the user to pass [props, context] in place of
  the props input.
  Third input is the reducers to change the state (by calls to the dispatch()
  function). reducers, if provided, is an object always starting with a key
  property, which allows descendant components to access the components
  reducers as well. And from there, each member is of the form
  {action: reducer, ...}, where action is a unique string that selects the
  given reducer, and the reducer is a pure function that takes [state, props,
  contexts] as its first input, as well as an optional second input (passed to
  dispatch()), and returns a new state of the component. Reducers can can also
  take an optional third input, dispatch, which can be used to run other
  reducers right after execution, including those of the component's ancestors.
  If a reducer returns a nullish value, the state is unchanged.
  Access these reducers in order to change the state of this component by
  calling dispatch("self", action, input), where action is the key of the
  specific reducer in the reducers object, and input is the aforementioned
  second input that gets passed to the reducer. As mentioned, the reducers can
  also be accessed by any descendants by calling dispatch(key, action, input),
  where key is the aforementioned one defined in the reducers object.
  Fourth input, rootID, should only be set if you want the state to act as a
  root in the session state tree. Each rootID of the app must be unique (and
  also deterministic between hard refreshes/reboots of the entire app).
  And lastly, the fifth input, backUpAndRemove, is a flag that when set as
  true, removes all descendants of the component (making passData() return a
  React fragment for good measure), but backs them up in sessionStorage such
  that they are restored if backUpAndRemove is set as something falsy again.
**/


// export const useStateAndReducers = (initState, reducers, props, contexts) => {
//   // Call the useState() hook on initState.
//   const [state, setState] = useState(initState);

//   const [dispatch, ref] = useDispatch(reducers, props, contexts, null)


//   return [state, dispatch, ref];
// };


export const useDispatch = (reducers, key, setState, props, contexts) => {
  reducers ??= {};

  const dataRef = useRef([reducers, key, props, contexts, setState]);
  dataRef.current = [reducers, key, props, contexts, setState];

  const dispatchListener = useCallback((e) => {
    e.stopPropagation();
    let [key, action, input, skip=0] = e.detail;
    skip = parseSkip(skip);
    const node = e.target;
    const [reducers, nodeKey, props, contexts, setState] = dataRef.current;
    if (!nodeKey || (key && key !== "self" && key !== nodeKey)) {
      ancDispatch(node, key, action, input, skip);
    }
    else {
      if (key && key === nodeKey && skip > 0) {
        ancDispatch(node, key, action, input, skip - 1);
      }
      else {
        callReducer(reducers, action, input, props, contexts, setState, node);
      }
    }
  }, []);

  const refCallback = (node) => {
    node.removeEventListener("use-dispatch", dispatchListener);
    node.addEventListener("use-dispatch", dispatchListener);
  };
  // Add a warning that might allow us to call the returned value 'ref'
  // instead of 'refCallback.'
  refCallback.current = (
    "useDispatch(): Don't access ref.current, as the DOM node is not " +
    "kept in memory."
  );

  // Return the refCallback and the (constant) dispatch function.
  return [refCallback, dispatch];
}




function callReducer(
  reducers, key, action, input, props, contexts, setState, node
) {
  // If action === "setSate", call setState instead of a listed reducer.
  if (action === "setState") {
    if (!setState) {
      debugger;throw (
        'useDispatch(): setState of key ' + JSON.stringify(key) + 'is not ' +
        'defined.'
      );
    }
    if (input instanceof Function) {
      input.bind(reducers);
    }
    setState(input);
  }

  // Else, first get and check the reducer.
  let reducer = reducers[action];
  if (action === "setState") {
    reducer = setState;
  }
  if (!reducer) {
    debugger;throw (
      'useDispatch(): No action of ' + JSON.stringify(action) + ' was ' +
      'found in reducers of key ' + JSON.stringify(key) + '.'
    );
  }
  if (!(reducer instanceof Function)) {
    debugger;throw (
      'useDispatch(): action ' + JSON.stringify(action) + ' from key ' +
      JSON.stringify(key) + ' is not a function.'
    );
  }
  // Then bind 'this' to reducers object.
  reducer = reducers[action].bind(reducers);

  // If setState is missing, simply call the "reducer" in order to allow it
  // to signal to parents (which is allowed non-pure behavior) of the reducers.
  if (!setState) {
    reducer({props: props, contexts: contexts, node: node}, input, ancDispatch);
  }
  // Else use the reducer to set the state.
  setState(state => reducer(
    {state: state, props: props, contexts: contexts, node: node},
    input, ancDispatch
  ));
}



const dispatch = (node, key, action, input, skip = 0) => {
  skip = parseSkip(skip);
  node.dispatchEvent(
    new CustomEvent("use-dispatch", {
      bubbles: true,
      detail: [key, action, input, skip],
    })
  );
};

const ancDispatch = (node, key, action, input, skip = 0) => {
  skip = parseSkip(skip);
  if (key === "self") {
    debugger;throw (
      'useDispatch(): Don\'t call dispatch() with key == "self" from ' +
      'within a reducer. Call this.MY_ACTION instead.'
    );
  }
  node.parentElement.dispatchEvent(
    new CustomEvent("use-dispatch", {
      bubbles: true,
      detail: [key, action, input, skip],
    })
  );
};


function parseSkip(skip) {
  skip = parseInt(skip);
  if (skip === NaN) {
    debugger;throw (
      'useDispatch(): skip input to dispatch() must be an integer.'
    );
  }
  return skip;
}
