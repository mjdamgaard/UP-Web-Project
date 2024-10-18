import {
  useState, useEffect, useMemo, useCallback,
} from "react";



const stateDataStore = {};

var nonce = 1;
function getNonce() {
  return nonce++;
}

function getIsRestoring() {
  // TODO: Implement.
  return false;
}


export const useManagedState = (
  initState, actions, props, key, isRoot, restore = true, closed = false
) => {
  // If props is an array, treat it as [props, contexts] instead.
  let contexts, refs;
  if (Array.isArray(props)) {
    [props, contexts, refs] = props;
  }

  // Get whether there is a restoration of an earlier state going on.
  const isRestoring = restore && getIsRestoring();

  // If the component is a state root, and isRestoring, get the old state
  // immediately.
  const oldRootState = isRoot && isRestoring && "...";

  // Get a unique and constant stateID.
  const stateID = isRoot ? "root-" + key : useCallback(() => {
    var stateID;
    return () => {
      if (!stateID) {
        stateID = getNonce();
      }
      return stateID;
    };
  })();


  // Set the initial state, unless there's a backup waiting to be restored.
  const tempState = !isRestoring ?
    initState :
    isRoot ?
      stateData.state : "";

  const [extState, setState] = useState(
    !isRestoring ?
      {status: "done", state: initState} :
      isRoot ?
        {status: "waiting-for-children", state: null} :
        {status: "waiting-for-state",    state: null}
  );

  // Store the state data in stateStore.
  const stateData = (stateDataStore[stateID] = {
    state: null,
    parentStateID: null,
    childStateIDs: null,
    childIsDoneArr: null,
    hasChanged: false,
    isRestored: !isRestoring,
    ...stateDataStore[stateID],
    methods: methods,
    props: props,
    contexts: contexts,
    refs: refs,
    key: key,
    restore: restore,
    closed: closed,
    setState: setState,
    // (The parentStateID is set on the first call to dispatch(), or on the
    // popstate event before saving the full state in sessionStorage, or
    // on backUpAndRemove. And childStateIDs is set on the latter two.)
  });

  // Schedule a cleanup function to remove the state data from stateStore.
  useEffect(() => {
    return () => {
      delete stateDataStore[stateID];
    };
  }, []);


  // TODO: Add useLayoutEffect to restore state, and make passData return an
  // empty element while restoring and not isReady..


  const passData = state.status === "done" ?
    (element => passStateID(element, stateID)) :
    state.status === "waiting-for-children" ?
      (element => passRestorationRefAndHide(passStateID(element, stateID))) :
      // And when state.status === "waiting-for-state":
      (() => <template data-state-id={stateID}></template>);

  // Return the state, as well as the passData() and dispatch() functions.   
  return [state, passData, dispatch];
};





function passStateID(element, stateID) {
  let type = element.type;
  // If element is a HTML element (like 'div' or 'span' etc.), pass it the
  // state ID.
  if (typeof type === "string") {
    let props = {...element.props, "data-state-id": stateID};
    return {...element, props: props};
  }
  // If it is a non-empty array, map passData() to all its elements.
  else if (Array.isArray(element) && element.length > 0) {
    return element.map(val => passStateID(val, stateID));
  }
  // And do the same if it is a list of children inside a React fragment or a
  // React context provider.
  else if (
    (
      type.$$typeof.toString() === "Symbol(react.fragment)" ||
      type.$$typeof.toString() === "Symbol(react.provider)"
    ) && element.props.children && element.props.children.length > 0
  ) {
    let children = element.props.children.map(val => (
      passStateID(val, stateID)
    ));
    return {...element, props: {...element.props, children: children}};
  }
  else {
    console.trace();
    console.log(element);
    debugger;throw (
      "useManagedState(): Returned JSX element can only be a single HTML " +
      "element (like a 'div' or a 'span' element), or a list of HTML " +
      "elements. " +
      "Outer React fragments or context providers are also allowed, as long " +
      "as their children are all HTML elements. " +
      "Thus, please wrap any outer child React component in such a HTML " +
      "element, or refactor by moving the state of the component up to its " +
      "parent. (Note that you can then still dispatch actions from the " +
      "child component in the same way, just as long as their are no " +
      "name collisions with the existing actions of the parent.)"
    );
  }
}



function passRestorationRefAndHide(element) {
  let type = element.type;
  // If element is a HTML element (like 'div' or 'span' etc.), give it a
  // restoration ref callback.
  if (typeof type === "string") {
    let props = {...element.props, "style": "display:none;"};
    // let ref = !element.ref ?
    //   restorationRefCallback :
    //   (element.ref instanceof Function) ?
    //     (node) => {
    //       restorationRefCallback(node);
    //       element.ref(node);
    //     } :
    //     (node) => {
    //       restorationRefCallback(node);
    //       element.ref.current = node;
    //     };
    let ref = restorationRefCallback;
    return {...element, ref: ref, props: props};
  }
  // If it is a non-empty array, pass the restorationRefCallback only to the 
  // first element, but hide all other as well.
  else if (Array.isArray(element) && element.length > 0) {
    return element.map((val, ind) => {
      if (ind === 0) {
        return passRestorationRefAndHide(val);
      } else {
        let props = {...val.props, "style": "display:none;"};
        return {...val, props: props};
      }
    });
  }
  // And do the same if it is a list of children inside a React fragment or a
  // React context provider.
  else if (
    (
      type.$$typeof.toString() === "Symbol(react.fragment)" ||
      type.$$typeof.toString() === "Symbol(react.provider)"
    ) && element.props.children && element.props.children.length > 0
  ) {
    let children = element.props.children.map(val => (
      passRestorationRefAndHide(val)
    ));
    return {...element, props: {...element.props, children: children}};
  }
}





function findAndSetParentStateID(node) {
  const stateID = node.getAttribute("data-state-id");
  let parentNode = node.parentNode;
  // Get the stateID of the first ancestor node that has the data-state-id
  // attribute.
  let parentStateID;
  do {
    if (parentNode.nodeType === Node.DOCUMENT_NODE) {
      parentStateID = null;
      break;
    }
    parentStateID = parentNode.getAttribute("data-state-id") || undefined;
    parentNode = parentNode.parentNode;
  } while (parentStateID === undefined);

  // If a parent was found, store the parentStateID...
  setParentStateIDs(statefulAncestors);
  let shouldBeRestored = statefulAncestors.reduce(
    (acc, ancNode) => acc ||
      getIsRestoring(ancNode.getAttribute("data-state-id")),
    false
  );
}


function restorationRefCallback(node) {
  let statefulAncestors = getStatefulAncestors(node);
  setParentStateIDs(statefulAncestors);
  let shouldBeRestored = statefulAncestors.reduce(
    (acc, ancNode) => acc ||
      getIsRestoring(ancNode.getAttribute("data-state-id")),
    false
  );
}

function getStatefulAncestors(node) {
  
}

function setParentStateIDs(statefulAncestors) {
  
}




export function dispatch(caller, key, action, input) {

}



/**
  useSessionStateless() can be used whenever you would call useSessionState()
  but don't need for the given component to have a state itself.
  (The first 'props' input is actually not strictly needed id rootID is set.)
**/
export const useSessionStateless = (
  props, reducers = {}, rootID = null, backUpAndRemove
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
      setState: void(0),
      backUpAndRemove: backUpAndRemove,
    }
  }, []);


  // Get dispatch() and passKeys() with useSessionStateHelper(), which also
  // backs up or restores children when backUpAndRemove changes value, and
  // also schedules a cleanup function to remove this session state when it is
  // unmounted (but it can still be restored if it has been backed up).
  const [dispatch, passKeys] = useSessionStateHelper(
    null, null, sKey, reducers, backUpAndRemove, void(0)
  );

  // Return the passKeys() and dispatch() functions.   
  return [passKeys, dispatch];
};







const useSessionStateHelper = (
  props, contexts, sKey, reducers, backUpAndRemove, setState
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
      if (action === "setState") {
        setState(input);
      } else {
        let thisDispatch = sessionStateAuxillaryDataStore[sKey].dispatch;
        let reducer = reducers[action];
        setState(state => (
          reducer([state, props, contexts], input, thisDispatch) ?? state
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
    if (action === "setState") {
      ancSetState(input);
    } else {
      let reducer = ancReducers[action];
      ancSetState(state => (
        reducer([state, ancProps, ancContexts], input, ancDispatch) ?? state
      ));
    }
    return;
  }), []);


  // passKeys() is supposed to wrap around all returned JSX elements from the
  // component. Its task is to drill the underlying sKey-related props. It also
  // automatically returns and empty JSX fragment if backUpAndRemove is set to
  // true.
  const passKeys = useMemo(() => ((elementOrKey, element) => (
    passKeysFromData(elementOrKey, element, sKey, [0], backUpAndRemove)
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
  elementOrKey, element, parentSKey, posMonad, backUpAndRemove
) {
  let customKey;
  if (element) {
    customKey = elementOrKey;
  } else {
    element = elementOrKey;
  }

  // If backUpAndRemove, return an empty JSX fragment.
  if (backUpAndRemove) {
    return <></>;
  }

  // If the element is a string, I believe that the position ought to be
  // incremented in the React tree. (TODO: Test this.) And return the same
  // string, then.
  if (typeof element === "string") {
    posMonad[0]++;
    return element;
  }

  // Else if element is an array, map passKeysFromData onto it, where the
  // position inside posMonad is incremented for each non-array element,
  // and increased with the array length for each nested array.
  // equal to the index, and return that.
  if (Array.isArray(element)) {
    return element.map((elem) => (
      passKeysFromData(null, elem, parentSKey, posMonad)
    ));
  }


  // Else get element's own nodeIdentifier, and a boolean denoting whether it
  // is a custom React Component or a normal HTML element (or a React fragment
  // or a React context provider).
  let pos = posMonad[0];
  let [nodeIdentifier, isReactComponent] =
    getNodeIdentifier(customKey, element, pos);

  // Construct the new sKey of this element.
  let sKey = parentSKey + (isReactComponent ? "/" : ">") + nodeIdentifier;

  // Prepare the new JSX element to return.
  let ret = {...element};
  ret.props = {...element.props};

  // If element is a React component, add sKey as the _sKey prop. (This is the
  // important part.)
  if (isReactComponent) {
    ret.props._sKey = sKey;
  }
  // Else if the element is not a React component, call passKeysFromData()
  // recursively on its children.
  else {
    let children = ret.props.children;
    if (children) {
      ret.props.children = passKeysFromData(null, children, sKey, [0]);
    }
  }

  // And finally increment the position inside posMonad (in case element is
  // an element of an array) and then return the prepared element.
  posMonad[0]++;
  return ret;
}



function getNodeIdentifier(customKey, element, pos) {
  let nodeIdentifier;
  // If the element has a customKey, prepend `&{customKey}`, only where all
  // special sKey symbols has been replaced, reversibly.
  if (customKey) {
    customKey = customKey.replaceAll("\\", "\\b")
      .replaceAll("/", "\\s")
      .replaceAll(">", "\\g")
      .replaceAll(":", "\\c");
    nodeIdentifier = "&" + customKey;
  }
  // If the element has a key, prepend `${key}`, only where all special sKey
  // symbols has been replaced, reversibly.
  else if (element.key !== null && element.key !== undefined) {
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
    return [type, false];
  }
  else if (type.name) {
    return [type.name, true];
  }
  if (type === Symbol("react.fragment")) {
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






function getAncestorReducerData(sKey, key, skip) {
  let ancSKey = sKey;
  let data;
  while (ancSKey = getParentSKey(ancSKey)) {
    data = sessionStateAuxillaryDataStore[ancSKey];
    if (!data) {
      continue;
    }
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
  console.log(sKey);
  throw (
    'useSessionState: dispatch(): "' + key + '" was not found ' +
    'as an ancestor of this component.'
  );
}

function getParentSKey(sKey) {
  let ancSKey = sKey.replace(/[\/>][^\/]+$/, "");
  return (ancSKey === "" || ancSKey === sKey) ? null : ancSKey;
}



















// TODO: Remake this hook without the backup-and-remove functionality (not
// needed), and without the dispatch function (use useDispatch() instead),
// following my plan (see 23-xx notes) of using a single array to store
// states rather than using a tree structure. 


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
    );
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
  The order of the returns are: [state, passKeys, dispatch].
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
  true, removes all descendants of the component (making passKeys() return a
  React fragment for good measure), but backs them up in sessionStorage such
  that they are restored if backUpAndRemove is set as something falsy again.
**/
