import {
  useRef, useCallback
} from "react";





/**
  TODO: write description of useDispatch().
**/

export const useDispatch = (
  actions = {}, setState, state, props, contexts, refs
) => {
  const dataRef = useRef(null);
  dataRef.current = [actions, setState, state, props, contexts, refs];

  const dispatchListener = useCallback((event) => {
    dispatchListenerWithDataRef(event, dataRef);
  }, []);

  const refCallback = (node) => {
    if (node) {
      node.removeEventListener("dispatch", dispatchListener);
      node.addEventListener("dispatch", dispatchListener);
    }
  };

  // Return the refCallback and the (constant) dispatch function.
  return [refCallback, dispatch];
}



function dispatchListenerWithDataRef(event, dataRef) {
  const node = event.currentTarget;
  const target = event.target;
  const [actionKey, input] = event.detail;
  const [actions, setState, state, props, contexts, refs] = dataRef.current;
  if (Object.keys(actions).includes(actionKey)) {
    event.stopPropagation();
    let action = actions[actionKey].bind(actions);
    action(
      setState,
      {state: state, props: props, contexts: contexts, refs: refs},
      node, target
    )
  }
}




const dispatch = (node, actionKey, input) => {
  node.dispatchEvent(
    new CustomEvent("dispatch", {
      bubbles: true,
      detail: [actionKey, input],
    })
  );
};
