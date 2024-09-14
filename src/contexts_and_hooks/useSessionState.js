import {
  useState, useEffect, useMemo,
} from "react";



const sessionStateAuxillaryDataStore = {};


sessionStorage.getItem("_componentStateData") ||
  sessionStorage.setItem("_componentStateData", JSON.stringify({
    componentStates: {}, elemTypeIDs: {},
  }));



class SessionStatesHandler {

  static getComponentState(sKey) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    return (componentStateData.componentStates[sKey] ?? {}).state;
  }


  static setComponentState(sKey, state) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    componentStateData.componentStates[sKey] = {state: state};
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }


  static deleteComponentStateAndChildren(sKey) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );debugger;
    // Delete this component state, as well as any descendant state, which
    // all starts with sKey in their own sKeys.
    let sKeys = Object.keys(componentStateData.componentStates);
    let sKeysToRemove = sKeys.filter(key => key.startsWith(sKey));
    sKeysToRemove.forEach(key => {
      delete componentStateData.componentStates[key];
    });
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }
  


  static #elemTypeIDs = {};
  static #nonce = 0;

  static lookUpOrCreateElemTypeID(elemType) {
    // First look in this.#elemTypeIDs.
    let elemTypeID = this.#elemTypeIDs[elemType];
    if (elemTypeID !== undefined) {
      return elemTypeID;
    }
    // If not there, look in sessionStorage, and if not there, get a new
    // elemTypeID from nonce, then store and return that.
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    elemTypeID = componentStateData.elemTypeIDs[elemType];
    if (elemTypeID) {
      return elemTypeID;
    } else {
      elemTypeID = this.#nonce;
      this.#nonce++;
      componentStateData.elemTypeIDs[elemType] = elemTypeID;
      this.#elemTypeIDs[elemType] = elemTypeID;
      sessionStorage.setItem(
        "_componentStateData",
        JSON.stringify(componentStateData)
      );
      return elemTypeID;
    }
  }



  static backUpChildStates(sKey) {
    // Get all component states.
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    let componentStates = componentStateData.componentStates;

    // Filter out the descendant states.
    let descStateEntries = Object.entries(componentStates).filter(([key,]) => {
      return key.startsWith(sKey) && key !== sKey;
    });

    // Set the backup.
    if (!componentStates[sKey]) {
      componentStates[sKey] = {};
    }
    componentStates[sKey].backup = descStateEntries;
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
    let componentStates = componentStateData.componentStates;
    if (!componentStates[sKey]) {
      componentStates[sKey] = {};
    }
    let descStateEntries = componentStates[sKey].backup;
    // Restore the descendant states.
    descStateEntries.forEach(([key, state]) => {
      componentStateData.componentStates[key] = state;
    });
    // Then delete the backup, and store the changes.
    delete componentStates[sKey].backup;
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }

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
  Lastly, it returns a passKeys() function, which has to wrap around any
  returned (JSX) element of the component if the children includes any session-
  stateful components. passKeys() then serves to pass the keys that allows
  useSessionState() to construct its own tree of DOM nodes.
  Inputs:
  First input is the initial state, just like for useState().
  Second input is the props of the component, which is used both to get the
  relevant keys from the passKeys() called by the parent component, and is
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
  dispatch()), and returns a new state of the component.
  Access these reducers on order to change the state of this component by
  calling dispatch("self", action, input), where action is the key of the
  specific reducer in the reducers object, and input is the aforementioned
  second input that gets passed to the reducer. As mentioned, the reducers can
  also be accessed by any descendants by calling dispatch(key, action, input),
  where key is the aforementioned one defined in the reducers object.
  Fourth input, rootID, should only be set if you want the state to act as a
  root in the session state tree. Each rootID of the app must be unique (and
  also deterministic between hard refreshes/reboots of the entire app).
  And lastly, the fifth input, backUpAndRemove, is a flag that when set as
  true, removes all descendants of the component (making passKeys() return a
  React fragment for good measure), but backs them up in sessionStorage such
  that they are restored if backUpAndRemove is set as something falsy again.
**/
export const useSessionState = (
  initState, props, reducers = {}, rootID = null, backUpAndRemove
) => {
  // If props is an array, treat it as [props, contexts] instead.
  let contexts;
  if (Array.isArray(props)) {
    [props, contexts] = props;
  }

  // Get the sKey (session state key).
  const sKey = (rootID === null) ? props._sKey :
    "/" + rootID.replaceAll("\\", "\\b")
      .replaceAll("/", "\\s")
      .replaceAll(">", "\\g")
      .replaceAll(":", "\\c");
  

  // Call the useState() hook, but initialize as the stored session state
  // if any is available, instead of as initState.
  const [state, internalSetState] = useState(
    SessionStatesHandler.getComponentState(sKey) ?? initState
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


  // We store some auxillary data used mainly by the dispatch() functions, and
  // also for backing up descendant states.
  useMemo(() => {
    sessionStateAuxillaryDataStore[sKey] = {
      reducers: reducers,
      setState: setState,
      backUpAndRemove: backUpAndRemove,
    }
  }, []);
  sessionStateAuxillaryDataStore[sKey].props = props;
  sessionStateAuxillaryDataStore[sKey].contexts = contexts;


  // Get dispatch() and passKeys() with useSessionStateHelper(), which also
  // backs up or restores children when backUpAndRemove changes value, and
  // also schedules a cleanup function to remove this session state when it is
  // unmounted (but it can still be restored if it has been backed up).
  const [dispatch, passKeys] = useSessionStateHelper(
    props, contexts, sKey, reducers, backUpAndRemove, false, setState
  );

  // Return the state, as well as the dispatch() and passKeys() functions.   
  return [state, dispatch, passKeys];
};




/**
  useSessionStateless() can be used whenever you would call useSessionState()
  but don't need for the given component to have a state itself.
  (The first 'props' input is actually not strictly needed id rootID is set.)
**/
export const useSessionStateless = (
  props, rootID = null, backUpAndRemove
) => {
  // Get the sKey (session state key).
  const sKey = (rootID === null) ? props._sKey :
    "/" + rootID.replaceAll("\\", "\\b")
      .replaceAll("/", "\\s")
      .replaceAll(">", "\\g")
      .replaceAll(":", "\\c");

  // We store some auxillary data used for backing up descendant states.
  useMemo(() => {
    sessionStateAuxillaryDataStore[sKey] = {
      backUpAndRemove: backUpAndRemove,
    }
  }, []);


  // Get dispatch() and passKeys() with useSessionStateHelper(), which also
  // backs up or restores children when backUpAndRemove changes value, and
  // also schedules a cleanup function to remove this session state when it is
  // unmounted (but it can still be restored if it has been backed up).
  const [dispatch, passKeys] = useSessionStateHelper(
    null, null, sKey, null, backUpAndRemove, true
  );

  // Return the passKeys() and dispatch() functions.   
  return [passKeys, dispatch];
};





const useSessionStateHelper = (
  props, contexts, sKey, reducers, backUpAndRemove, isStateless, setState
) => {
  // Whenever backUpAndRemove changes, either back up descendant states in a
  // separate place in session storage, before they are being removed,
  // or restore them from this backup. 
  useMemo(() => {
    let auxData = sessionStateAuxillaryDataStore[sKey];
    if (backUpAndRemove && !auxData.backUpAndRemove) {
      SessionStatesHandler.backUpChildStates(sKey);
    }
    else if (!backUpAndRemove && auxData.backUpAndRemove) {
      SessionStatesHandler.restoreChildStates(sKey);
    }
    auxData.backUpAndRemove = backUpAndRemove;
  }, [backUpAndRemove]);


  // Cleanup function to both delete this auxillary data, as well as the
  // session state. This cleanup function also cleans up all its children in
  // order to prevent otherwise possible memory leaks (but it is only run
  // after the component has been painted, so the increase in computation
  // time here should not really matter much at all.)
  useEffect(() => {
    return () => {
      delete sessionStateAuxillaryDataStore[sKey];
      SessionStatesHandler.deleteComponentStateAndChildren(sKey);
    };
  }, []);


  // Prepare the dispatch function, which is able to change the sate of the
  // component itself, or of any of its ancestors, by calling one of the
  // provided reducers, or an ancestor's reducer. We also always add the all-
  // powerful setState as a reducer, but it is recommended to only use custom
  // reducers, as these can then constitute an API of the "public methods"
  // for the component (or "protected"; you can only call them from itself
  // or its descendants).
  const dispatch = useMemo(() => ((key, action, input = []) => {
    // If key = "self", call one of this state's own reducers.
    if (key === "self") {
      if (isStateless) {
        console.log(sKey);
        throw (
          'useSessionStateless: dispatch(): "self" is not a valid action ' +
          'for a stateless component.'
        );
      }
      if (action === "setState") {
        setState(input);
      } else {
        let reducer = reducers[action];
        setState(state => reducer([state, props, contexts], input));
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
    let [ancReducers, ancSetState, ancProps, ancContexts] =
      getAncestorReducerData(sKey, key, skip);
    if (action === "setState") {
      ancSetState(input);
    } else {
      let reducer = ancReducers[action];
      ancSetState(state => reducer([state, ancProps, ancContexts], input));
    }
    return;
  }), []);


  // passKeys() is supposed to wrap around all returned JSX elements from the
  // component. Its task is to drill the underlying sKey-related props. It also
  // automatically returns and empty JSX fragment if backUpAndRemove is set to
  // true.
  const passKeys = useMemo(() => ((element) => (
    passKeysFromData(element, sKey, 0, backUpAndRemove)
  )), [backUpAndRemove]);


  return [dispatch, passKeys];
};





/**
  passKeys() is supposed to wrap around all returned JSX elements from the
  component. Its task is to drill the underlying sKey-related props. It also
  automatically returns and empty JSX fragment if backUpAndRemove is set to
  true.

  sKey is of the form: '/Root_ID ( (/|>) ($Key|Pos) : Element_type_ID )*'
**/
function passKeysFromData(
  element, parentSKey, pos = 0, backUpAndRemove
) {
  // If backUpAndRemove, return an empty JSX fragment.
  if (backUpAndRemove) {
    return <></>;
  }
  
  // Get element's own nodeIdentifier, and a boolean denoting whether it is a
  // React Component or a normal HTML element.
  let [nodeIdentifier, isReactComponent] = getNodeIdentifier(element);

  // Prepare the new JSX element to return.
  let ret = {...element};

  // Now add this as the _sKey property of ret. (This is the important part.)
  let sKey = parentSKey + (isReactComponent ? "/" : ">") + nodeIdentifier;
  ret._sKey = sKey;

  // If the element is not a React component, iterate through each of its
  // children and do the same thing, only with parentSKey replaced by the
  // current sKey, and where pos increments for each child.
  if (!isReactComponent) {
    let children = ret.props.children;
    if (children) {
      if (Array.isArray(children)) {
        ret.props.children = children.map((child, ind) => (
          passKeysFromData(child, sKey, ind)
        ));
      }
      else {
        ret.props.children = passKeysFromData(children, sKey, 0);
      }
    }
  }

  // And finally return the prepared element.
  return ret;
}



function getNodeIdentifier(element, pos) {
  let nodeIdentifier;
  // If the element has a key, prepend `k${key}`, only where all ':' has been
  // replaced, reversibly.
  if (element.key !== null && element.key !== undefined) {
    let key = element.key.replaceAll("\\", "\\b")
      .replaceAll("/", "\\s")
      .replaceAll(">", "\\g")
      .replaceAll(":", "\\c");
    nodeIdentifier = "$" + key;
  }
  // Else prepend the position of the element within the parent instead.
  else {
    nodeIdentifier = pos;
  }
  // Finally prepend `:${elemTypeID}`, where elemTypeID is that of the
  // element itself, looked up (or created) from its elemType.
  let [elemType, isReactComponent] = getElementType(element);
  let elemTypeID = SessionStatesHandler.lookUpOrCreateElemTypeID(
    elemType
  );
  nodeIdentifier += ":" + elemTypeID;

  return [nodeIdentifier, isReactComponent];
}






function getElementType(element) {
  let type = element.type;
  if (typeof type === "string") {
    return type;
  }
  else if (type.name) {
    return type.name;
  }
  if (type === Symbol("react.fragment")) {
    return "fragment";
  }
  if (type.type && type.type.$$typeof === Symbol("react.provider")) {
    return "provider";
  }
  else {
    console.log(element);
    throw "getElementType: Unhandled React element type";
  }
}






function getAncestorReducerData(sKey, key, skip) {
  let ancSKey, data;
  while (ancSKey = getNearestReactComponentAncestorSKey(sKey)) {
    data = sessionStateAuxillaryDataStore[ancSKey];
    if (!data.reducers.key === key) {
      if (skip <= 0) {
        return [data.reducers, data.setState, data.props, data.contexts];
      } else {
        skip--;
      }
    }
  }
  // If this search fails, throw an error:
  console.log(sKey);
  throw (
    'useSessionStateless: dispatch(): "' + key + '" was not found ' +
    'as an ancestor of this component.'
  );
}

function getNearestReactComponentAncestorSKey(sKey) {
  let ancSKey = sKey.replace(/\/[^\/]+$/, "");
  return (ancSKey === "") ? null : ancSKey;
}








export function logSKey(props) {
  console.log(props._sKey);
}
