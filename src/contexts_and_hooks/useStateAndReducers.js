import {
  useState, useEffect, useMemo, useId
} from "react";


// const useID = (parentSKey) => {
//   return useMemo(() => {
//     return getNonce();
//   }, [parentSKey]);
// };

// var nonce = 0;
// function getNonce() {
//   return nonce++;
// }


const auxDataStore = {}


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
export const useStateAndReducers = (
  initState, props, reducers = {}
) => {
  props ??= {};

  // If props is an array, treat it as [props, contexts] instead.
  let contexts;
  if (Array.isArray(props)) {
    [props, contexts] = props;
  }

  // Call the useState() hook on initState.
  const [state, setState] = useState(initState);


  // Get dispatch() and passData() with useStateAndReducersHelper().
  const [dispatch, passData] = useStateAndReducersHelper(
    props, contexts, reducers, setState
  );

  // Return the state, as well as the dispatch() and passData() functions.   
  return [state, dispatch, passData];
};




/**
  useSessionStateless() can be used whenever you would call useSessionState()
  but don't need for the given component to have a state itself.
  (The first 'props' input is actually not strictly needed id rootID is set.)
**/
export const useDispatch = (
  props, reducers = {}
) => {
  props ??= {};

  // If props is an array, treat it as [props, contexts] instead.
  let contexts;
  if (Array.isArray(props)) {
    [props, contexts] = props;
  }

  // Get dispatch() and passData() with useStateAndReducersHelper().
  const [dispatch, passData] = useStateAndReducersHelper(
    props, contexts, reducers, undefined
  );

  // Return the passData() and dispatch() functions.   
  return [dispatch, passData];
};







const useStateAndReducersHelper = (
  props, contexts, reducers, setState
) => {

  const parentSKey = props._pSKey;
  const sKey = useId(parentSKey);
  

  // Store some auxillary data used by dispatch().
  auxDataStore[sKey] || (auxDataStore[sKey] = {});
  auxDataStore[sKey].pSKey = parentSKey;
  auxDataStore[sKey].props = props;
  auxDataStore[sKey].contexts = contexts;
  auxDataStore[sKey].reducers = reducers;
  auxDataStore[sKey].setState = setState;

  
  // Cleanup function to delete the auxillary data.
  useEffect(() => {
    return () => {
      delete auxDataStore[sKey];
    };
  }, [sKey]);

  // Prepare the dispatch function, which is able to change the sate of the
  // component itself, or of any of its ancestors, by calling one of the
  // provided reducers, or an ancestor's reducer. We also always add the all-
  // powerful setState as a reducer, but it is recommended to only use custom
  // reducers, as these can then constitute an API of the "public methods"
  // for the component (or "protected"; you can only call them from itself
  // or its descendants).
  const dispatch = useMemo(() => ((key, action, input) => {
    // If key = "self", call one of this state's own reducers.
    if (key === "self" || key === null) {
      setState ??= y => (y instanceof Function) ? y() : null;
      if (action === "setState") {
        setState(input);
      } else {
        let thisDispatch = auxDataStore[sKey].dispatch;
        let modDispatch = getModifiedDispatch(thisDispatch);
        let reducer = reducers[action].bind(reducers);
        setState(state => (
          reducer([state, props, contexts], input, modDispatch) ?? state
        ));
      }
      return;
    }

    let skip = 0;
    // If componentKey is an array, treat it as [componentKey, skip] instead,
    // where skip is the number of ancestors to skip.
    if (Array.isArray(key)) {
      [key, skip] = key;
      skip = parseInt(skip);
    }

    // If code reaches here, then we should look up the nearest ancestor
    // of componentKey, after having skipped over skip ancestors.
    let [ancReducers, ancSetState, ancProps, ancContexts, ancDispatch] =
      getAncestorReducerData(sKey, key, skip);
    ancSetState ??= y => (y instanceof Function) ? y() : null;
    // Then use the reducers (and its setState and other data) of that ancestor.
    if (action === "setState") {
      ancSetState(input);
    } else {
      let modDispatch = getModifiedDispatch(ancDispatch);
      let reducer = ancReducers[action].bind(ancReducers);
      ancSetState(state => (
        reducer([state, ancProps, ancContexts], input, modDispatch) ?? state
      ));
    }
    return;
  }), [sKey, parentSKey]);

  // Also store the dispatch() function in the auxDataStore in order for
  // reducers to be able to access the component's dispatch() function as well.
  auxDataStore[sKey].dispatch = dispatch;


  // passData() is supposed to wrap around all returned JSX elements from the
  // component. Its task is to drill the underlying sKey-related props. It also
  // automatically returns and empty JSX fragment if backUpAndRemove is set to
  // true.
  const passData = useMemo(() => ((element) => (
    passDataHelper(element, sKey)
  )), [sKey, parentSKey]);


  return [dispatch, passData];
};




function getModifiedDispatch(dispatch) {
  return (key, action, input) => {
    if (key === "self") {
      throw (
        'useStateAndReducers: dispatch(): don\'t call "self" from ' +
        'within a reducer. Call this.MY_ACTION instead.'
      );
    }
    else return dispatch(key, action, input);
  };
}





function getAncestorReducerData(sKey, key, skip) {
  let origSkip = skip;
  let data = auxDataStore[sKey];
  while (data = auxDataStore[data.pSKey]) {
    if (data.reducers.key === key) {
      if (skip <= 0) {
        return [
          data.reducers, data.setState, data.props, data.contexts,
          data.dispatch
        ];
      } else {
        skip--;
      }
    }
  }
  // If this search fails, throw an error:
  console.trace();
  throw (
    'useStateAndReducers: dispatch(): "' + key + '" was not found ' +
    'as an ancestor of this component. (skip: ' + origSkip + ')'
  );
}




/**
  passData() is supposed to wrap around all returned JSX elements from the
  component. Its task is to drill the underlying sKey-related props.
**/
function passDataHelper(
  element, sKey
) {

  // If the element is a string, simply return that.
  if (typeof element === "string") {
    return element;
  }

  // Else if element is an array, map passDataHelper onto it, where the
  // position inside posMonad is incremented for each non-array element,
  // and increased with the array length for each nested array.
  // equal to the index, and return that.
  if (Array.isArray(element)) {
    return element.map((elem) => (
      passDataHelper(elem, sKey)
    ));
  }

  let [elemType, isReactComponent]  = getIsReactComponent(element);

  // Prepare the new JSX element to return.
  let ret = {...element};
  ret.props = {...element.props};

  // If element is a React component, add sKey as the _pSKey prop. (This is the
  // important part.)
  if (isReactComponent) {
    ret.props._pSKey = sKey;
  }
  // Else if the element is not a React component, call passDataHelper()
  // recursively on its children.
  else {
    let children = ret.props.children;
    if (children) {
      ret.props.children = passDataHelper(children, sKey);
    }
  }

  // And finally return the prepared element.
  return ret;
}



function getIsReactComponent(element) {
  let [elemType, isReactComponent] = getElementType(element);
  return [elemType, isReactComponent];
}



function getElementType(element) {
  let type = element.type;
  if (type === undefined) {
    console.log(element);
    throw "getElementType: Unhandled React element type";
  }
  if (typeof type === "string") {
    return [type, false];
  }
  if (type.name) {
    return [type.name, true];
  }
  if (type.toString() === "Symbol(react.fragment)") {
    return ["fragment", false];
  }
  if (type.$$typeof.toString() === "Symbol(react.provider)") {
    return ["provider", false];
  }
  else {
    console.log(element);
    throw "getElementType: Unhandled React element type";
  }
}


