import {
  useState, useId, useEffect, useMemo,
} from "react";



const sessionStateAuxillaryDataStore = {};
var shouldRemoveGarbage = false;


sessionStorage.getItem("_componentStateData") ||
  sessionStorage.setItem("_componentStateData", JSON.stringify({
    componentsStates: {}, componentIDs: {}, backups: {}
  }));



class SessionStatesHandler {

  static getComponentState(sKey) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    return componentStateData.componentStates[sKey];
  }

  // static getAllComponentStates() {
  //   let componentStateData = JSON.parse(
  //     sessionStorage.getItem("_componentStateData")
  //   );
  //   return componentStateData.componentStates;
  // }

  static setComponentState(sKey, state) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    componentStateData.componentStates[sKey] = state;
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }

  static deleteComponentState(sKey) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    delete componentStateData.componentStates[sKey];
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }

  // static lookUpOrCreateComponentState(sKey, state) {
  //   let componentStateData = JSON.parse(
  //     sessionStorage.getItem("_componentStateData")
  //   );
  //   let state = componentStateData.componentStates[sKey];
  //   if (state) {
  //     return state;
  //   } else {
  //     componentStateData.componentStates[sKey] = state;
  //     sessionStorage.setItem(
  //       "_componentStateData",
  //       JSON.stringify(componentStateData)
  //     );
  //     return state;
  //   }
  // }


  static nonce = 0;

  static lookUpOrCreateComponentID(componentName) {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    let componentID = componentStateData.componentIDs[componentName];
    if (componentID) {
      return componentID;
    } else {
      componentID = nonce;
      nonce++;
      componentStateData.componentIDs[componentName] = componentID;
      sessionStorage.setItem(
        "_componentStateData",
        JSON.stringify(componentStateData)
      );
      return componentID;
    }
  }



  static backUpChildStates(sKey) {
    // Get all component states.
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );
    let allStates = componentStateData.componentStates;

    // Filter out the descendant states.
    let descendantStates = Object.entries(allStates).filter(([key, ]) => {
      return key.startsWith(sKey);
    });

    // Set the backup.
    componentStateData.backups[sKey] = descendantStates;
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
    let descendantStates = componentStateData.backups[sKey];
    descendantStates.forEach((key, state) => {
      SessionStatesHandler.setComponentState(key, state);
    });

    // Delete the backup.
    delete componentStateData.backups[sKey];
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }


  static removeGarbage() {
    let componentStateData = JSON.parse(
      sessionStorage.getItem("_componentStateData")
    );

    let sKeys = Object.keys(componentStateData.componentStates);
    let len;
    do {
      len = sKeys.length;

      sKeys = sKeys.filter(sKey => {
        let pSKey = sKey.replace(/\/[^\/]+$/, "");
        return sKeys.includes(pSKey);
        // No, this doesn't work, I need to take the nearest ancestor that
        // *has a state*! ..So do I advertise that in sKey, or what..?
      });

      sKeys = Object.keys(componentStateData.componentStates);
    }
    while (sKeys.length != len);

    // Finally write the garbage-collected componentStateData back.
    sessionStorage.setItem(
      "_componentStateData",
      JSON.stringify(componentStateData)
    );
  }

}









// function getSKeysAndCIDFromProps(props) {
//   const sKey = (props.isRoot) ? props.id :
//     props._sKey;
//   const pSKey = (props.isRoot) ? undefined :
//     props._sKey.replace(/\/[^\/]+$/, "");
//   const componentID = props._sKey.match(/:[0-9]+$/g)[0].substring(1);
//   // const componentName = props._name;
//   // const componentID = SessionStatesHandler.lookUpOrCreateComponentID(
//   //   componentName
//   // );

//   return [sKey, pSKey, componentID];
// }




/**
  This useSessionState() hook is a wrapper around the normal useState hook,
  which also backs up the state of the component in sessionStorage for as
  long as it is mounted, meaning that navigation to and back from another
  website will restore the state.
  useSessionState() returns an sKey (session state key) along with the usual
  state and setState returns, which is supposed to be drilled to any session-
  stateful descendant components, which these can then use as their pSKey
  (parent session state key) input. If the pSKey is undefined, then the
  component that calls this hook acts as a root for storing the session state.
**/
export const useSessionState = (
  propsOrRootID, initState, dispatchKey, reducers, backUpAndRemove
) => {
  const sKey = (typeof propsOrRootID !== "string") ? propsOrRootID._sKey :
    propsOrRootID.replaceAll("\\", "\\b")
      .replaceAll("/", "\\f")
      .replaceAll(";", "\\s")
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


  // We store the parent key in order to be able to set and get states from
  // a parent, as well as to check whether descendant states should be saved.
  // We also store setState as auxillary data in order for descendants to be
  // able to access it.
  useMemo(() => {
    sessionStateAuxillaryDataStore[sKey] = {
      key: dispatchKey,
      reducers: reducers,
      setState: setState,
      backUpAndRemove: backUpAndRemove,
    }
  }, []);


  // Get passKeys() and dispatch() with useSessionStateHelper(), which also
  // backs up or restores children when backUpAndRemove changes value, and
  // also schedules a cleanup function to remove this session state when it is
  // unmounted (but it can still be restored if it has been backed up).
  const [passKeys, dispatch] = useSessionStateHelper(
    sKey, reducers, backUpAndRemove, false, setState
  );

  // Return the state, as well as the passKeys() and dispatch() functions.   
  return [state, passKeys, dispatch];
};





export const useSessionStateless = (
  propsOrRootID, backUpAndRemove
) => {
  const sKey = (typeof propsOrRootID !== "string") ? propsOrRootID._sKey :
    propsOrRootID.replaceAll("\\", "\\b")
      .replaceAll("/", "\\f")
      .replaceAll(";", "\\s")
      .replaceAll(":", "\\c");

  // We store the parent key in order to be able to set and get states from
  // a parent, as well as to check whether descendant states should be saved.
  // We also store setState as auxillary data in order for descendants to be
  // able to access it.
  useMemo(() => {
    sessionStateAuxillaryDataStore[sKey] = {
      backUpAndRemove: backUpAndRemove,
    }
  }, []);


  // Get passKeys() and dispatch() with useSessionStateHelper(), which also
  // backs up or restores children when backUpAndRemove changes value, and
  // also schedules a cleanup function to remove this session state when it is
  // unmounted (but it can still be restored if it has been backed up).
  const [passKeys, dispatch] = useSessionStateHelper(
    sKey, reducers, backUpAndRemove, true
  );

  // Return the passKeys() and dispatch() functions.   
  return [passKeys, dispatch];
};





const useSessionStateHelper = (
  sKey, reducers, backUpAndRemove, isStateless, setState
) => {
  // Whenever backUpAndRemove changes, either back up descendant states in a
  // separate place in session storage, before they are being removed,
  // or restore them from this backup. 
  useMemo(() => {
    auxData = sessionStateAuxillaryDataStore[sKey];
    if (backUpAndRemove && !auxData.backUpAndRemove) {
      SessionStatesHandler.backUpChildStates(sKey);
    }
    else if (!backUpAndRemove && auxData.backUpAndRemove) {
      SessionStatesHandler.restoreChildStates(sKey);
      shouldRemoveGarbage = true;
    }
    auxData.backUpAndRemove = backUpAndRemove;
  }, [backUpAndRemove]);


  // Cleanup function to both delete this auxillary data, as well as the
  // session state. This cleanup function also cleans up all its children in
  // order to prevent otherwise possible memory leaks (but it is only run
  // after the component has been painted, so the increase in computation
  // time here does not really matter at all.)
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
    // If componentName = "self", call one of this state's own reducers.
    if (key === "self") {
      if (isStateless) {
        throw (
          'useSessionStateless: dispatch(): "self" is not a valid action ' +
          'for a stateless component. (Thrown from ' + sKey + '.)'
        );
      }
      if (action === "setState") {
        setState(input);
      } else {
        let reducer = reducers[action];
        setState(state => reducer(state, input));
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
    let [ancReducers, ancSetState] = getAncestorReducers(sKey, key, skip);
    if (action === "setState") {
      ancSetState(input);
    } else {
      let reducer = ancReducers[action];
      ancSetState(state => reducer(state, input));
    }
    return;
  }), []);


  // passKeys() is supposed to wrap around all returned JSX elements from the
  // component. Its task is to drill the underlying sKey-related props. It also
  // automatically returns and empty JSX fragment if backUpAndRemove is set to
  // true.
  const passKeys = useMemo(() => ((element) => (
    passKeysFromData( element, sKey, 0, backUpAndRemove)
  )), [backUpAndRemove]);


  return [passKeys, dispatch];
};









export const usePassKeys = (props, backUpAndRemove) => {
  const sKey = props._sKey;
  const passKeys = useMemo(() => ((element) => {
    passKeysFromData(element, sKey, 0, backUpAndRemove)
  }), [backUpAndRemove]);

  return passKeys;
};








// passKeys() is supposed to wrap around all returned JSX elements from the
// component. Its task is to drill the underlying sKey-related props. It also
// automatically returns and empty JSX fragment if backUpAndRemove is set to
// true.
function passKeysFromData(
  element, pSKey, pos = 0, backUpAndRemove
) {
  // If backUpAndRemove, return an empty JSX fragment.
  if (backUpAndRemove) {
    return <></>;
  }
  
  // Prepare the new JSX element to return.
  let ret = {...element};
  // Construct its sKey, starting from its parent sKey.
  var sKey = pSKey + "/";
  // If the element has a key, prepend `k${key}`, only where all ':' has been
  // replaced, reversibly.
  if (ret.key !== null && ret.key !== undefined) {
    let key = ret.key.replaceAll("\\", "\\b")
      .replaceAll("/", "\\f")
      .replaceAll(";", "\\s")
      .replaceAll(":", "\\c");
    sKey += "$" + key;
  }
  // Else prepend the position of the element within the parent instead.
  else {
    sKey += pos;
  }
  // Finally prepend `:${componentID}`, where componentID is that of the
  // element itself, looked up (or created) from its componentName.
  let elemComponentName = getComponentName(ret);
  let elemComponentID = SessionStatesHandler.lookUpOrCreateComponentID(
    elemComponentName
  );
  sKey += ":" + elemComponentID;
  // Now add this as the _sKey property of ret.
  ret._sKey = sKey;

  // Then iterate through each children and do the same thing, only with pSKey
  // replaced by the current sKey, and where pos increments for each child. 
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

  // And finally return the prepared element.
  return ret;
}


function getComponentName(element) {

}






function getAncestorReducers(sKey, componentName, skip) {
  let componentID = SessionStatesHandler.lookUpOrCreateComponentID(
    componentName
  );
  var data = sessionStateAuxillaryDataStore[sKey];
  while (data) {
    if (!data.componentID === componentID) {
      if (skip <= 0) {
        return data.reducers;
      } else {
        skip--;
      }
    }
    if (!data.pSKey) {
      return false;
    }
    data = sessionStateAuxillaryDataStore[data.pSKey];
  }
}





// export const useSaveSessionChildren = (shouldBeSaved) => {
//   const sKey = useId();
//   if (!sessionStateAuxillaryDataStore[sKey]) {
//     throw "useSaveChildren(): Call useSessionState() before this hook."
//   }
//   sessionStateAuxillaryDataStore[sKey].saveChildren = shouldBeSaved;
// }



// export const useAncestorSessionState = (contextKey, skip) => {
//   skip ??= 0;
//   const sKey = useId();

//   // Get the sKey of the ancestor.
//   var ancKey =  getAncestorKey(sKey, contextKey);
//   while (skip > 0) {
//     skip = skip - 1;
//     ancKey =  getAncestorKey(ancKey, contextKey);
//   }

//   // Return the state and the setState function.
//   const state = JSON.parse(sessionStorage.getItem(ancKey));
//   const setState = sessionStateAuxillaryDataStore[ancKey].setState;
//   return [state, setState];
// }


// function getAncestorKey(sKey, contextKey) {
//   var data;
//   while (data = sessionStateAuxillaryDataStore[sKey]) {
//     if (!data) {
//       return false;
//     }
//     if (data.contextKey === contextKey) {
//       return sKey;
//     }
//     if (data.pSKey === "root") {
//       return false;
//     }
//     sKey = data.pSKey;
//   }
// }








export function logSKey(props) {
  console.log(props._sKey);
}





















  // const sKey = (typeof propsOrRootID !== "string") ? propsOrRootID._sKey :
  //   propsOrRootID.replaceAll("\\", "\\b")
  //     .replaceAll("/", "\\f")
  //     .replaceAll(";", "\\s")
  //     .replaceAll(":", "\\c");
  

  // // Call the useState() hook, but initialize as the stored session state
  // // if any is available, instead of as initState.
  // const [state, internalSetState] = useState(
  //   SessionStatesHandler.getComponentState(sKey) ?? initState
  // );

  // // Prepare the setState() function that also stores the state in
  // // sessionStorage.
  // const setState = useMemo(() => ((y) => {
  //   internalSetState(prev => {
  //     let newState = (y instanceof Function) ? y(prev) : y;
  //     SessionStatesHandler.setComponentState(sKey, newState);
  //     return newState;
  //   });
  // }), []);


  // // We store the parent key in order to be able to set and get states from
  // // a parent, as well as to check whether descendant states should be saved.
  // // We also store setState as auxillary data in order for descendants to be
  // // able to access it.
  // useMemo(() => {
  //   sessionStateAuxillaryDataStore[sKey] = {
  //     key: dispatchKey,
  //     reducers: {...reducers, setState: setState},
  //     backUpAndRemove: backUpAndRemove,
  //   }
  // }, []);



  // // Whenever backUpAndRemove changes, either back up descendant states in a
  // // separate place in session storage, before they are being removed,
  // // or restore them from this backup. 
  // useMemo(() => {
  //   auxData = sessionStateAuxillaryDataStore[sKey];
  //   if (backUpAndRemove && !auxData.backUpAndRemove) {
  //     SessionStatesHandler.backUpChildStates(sKey);
  //   }
  //   else if (!backUpAndRemove && auxData.backUpAndRemove) {
  //     SessionStatesHandler.restoreChildStates(sKey);
  //     shouldRemoveGarbage = true;
  //   }
  //   auxData.backUpAndRemove = backUpAndRemove;
  // }, [backUpAndRemove]);

  // // If the component has just been restored from a backup, schedule a garbage
  // // collector to run if the component is unmounted or if backUpAndRemove
  // // changes to remove any memory leaks if the state is changed by the user,
  // // and some of the descendants are not re-mounted. 
  // useEffect(() => {
  //   return () => {
  //     if (shouldRemoveGarbage) {
  //       shouldRemoveGarbage = false;
  //       SessionStatesHandler.removeGarbage();
  //     }
  //   };
  // }, [backUpAndRemove]);


  // // Cleanup function to both delete this auxillary data, as well as the
  // // session state.
  // useEffect(() => {
  //   return () => {
  //     delete sessionStateAuxillaryDataStore[sKey];
  //     SessionStatesHandler.deleteComponentState(sKey);
  //   };
  // }, []);


  // // Prepare the dispatch function, which is able to change the sate of the
  // // component itself, or of any of its ancestors, by calling one of the
  // // provided reducers, or an ancestor's reducer. We also always add the all-
  // // powerful setState as a reducer, but it is recommended to only use custom
  // // reducers, as these can then constitute an API of the "public methods"
  // // for the component (or "protected"; you can only call them from itself
  // // or its descendants).
  // const dispatch = useMemo(() => ((componentName, action, params = []) => {
  //   // If componentName = "self", call one of this state's own reducers.
  //   if (componentName === "self") {
  //     let reducer = reducers[action];
  //     setState(state => reducer(state, ...params));
  //     return;
  //   }

  //   let skip = 0;
  //   // If componentKey is an array, treat it as [componentKey, skip] instead,
  //   // where skip is the number of ancestors to skip.
  //   if (Array.isArray(componentName)) {
  //     [componentName, skip] = componentName;
  //     skip = parseInt(skip);
  //   }

  //   // If code reaches here, then we should look up the nearest ancestor
  //   // of componentKey, after having skipped over skip ancestors.
  //   let ancReducers = getAncestorReducers(sKey, componentName, skip);
  //   let reducer = ancReducers[action];
  //   setState(state => reducer(state, ...params));
  //   return;
  // }), []);


  // // passKeys() is supposed to wrap around all returned JSX elements from the
  // // component. Its task is to drill the underlying sKey-related props. It also
  // // automatically returns and empty JSX fragment if backUpAndRemove is set to
  // // true.
  // const passKeys = useMemo(() => ((element) => (
  //   passKeysFromData( element, sKey, 0, backUpAndRemove)
  // )), [backUpAndRemove]);


  // // Return the state and the expanded setState function, as well as the sKey
  // // (session state key), which ought to be drilled to child components in
  // // order to be used for the pSKey (parent session state key) property of
  // // this very hook by descendant components. 
  // return [state, dispatch, passKeys];