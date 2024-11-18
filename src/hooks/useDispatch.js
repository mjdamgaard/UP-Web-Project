import {
  useRef, useCallback
} from "react";





/**
  TODO: write description of useDispatch().
**/

export const useDispatch = (
  actions = {}, setState, state, props, contexts, refs
) => {
  const dataRef = useRef([actions, setState, state, props, contexts, refs]);
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
  return [dispatch, refCallback];
}



function dispatchListenerWithDataRef(event, dataRef) {
  const node = event.currentTarget;
  const [actionKey, input] = event.detail;
  const [actions, setState, state, props, contexts, refs] = dataRef.current;
  if (Object.keys(actions).includes(actionKey)) {
    event.stopPropagation();
    actions[actionKey](
      input,
      setState,
      {state: state, props: props, contexts: contexts, refs: refs},
      node,
      dispatch
    );
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
