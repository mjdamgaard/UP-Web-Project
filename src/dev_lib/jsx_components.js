import {DevFunction, Immutable} from "../interpreting/ScriptInterpreter.js";
import {createAppSignal} from "./signals/fundamental_signals.js";



// Create a JSX (React-like) app and mounting it in the index HTML page, in
// the element with an id of "up-root".
export const createJSXApp = new DevFunction(createAppSignal, function(
  {callerNode, callerEnv, interpreter}, moduleObject, props
) {
  const rootInstance = new JSXComponentInstance(moduleObject, props);
  // ...
});



class JSXComponentInstance {

  constructor (moduleObject, index, moduleParent = null, key = null) {
    this.moduleObject = moduleObject;
    this.index = index;
    this.moduleParent = moduleParent;
    this.key = key;
    this.props = undefined;
    this.state = undefined;
    this.refs = undefined;
    this.moduleChildren = new Map();
    this.htmlElement = undefined;
  }

  get(key) {
    if (key === "dispatch") {
      return this.dispatch;
    }
    else if (key === "state") {
      return this.state;
    }
    else if (key === "initState") {
      return this.initState;
    }
    else if (key === "setState") {
      return this.setState;
    }
  }


  render(props = new Map(), callerNode, callerEnv) {
    if (this.props !== undefined && compareProps(props, this.props)) {
      return;
    }
    this.props = props;

    if (this.refs === undefined) {
      this.refs = props.get("refs");
    }

    let fun = this.moduleObject.members.$render;
    let inputArr = [props, new Immutable(this)];
    let jsxElement = interpreter.executeFunction(
      fun, inputArr, callerNode, callerEnv, this.moduleObject
    );

    let newHTMLElement = this.createNewHTMLElement(jsxElement);
    this.htmlElement.replaceWith(newHTMLElement);
    this.htmlElement = newHTMLElement;
  }


  // If receiverModule is undefined, dispatch to self. Else if childKey is
  // undefined, dispatch to parent. Else dispatch to the child with the key =
  // childKey.
  dispatch = new DevFunction(null, function(
    action, inputArr, receiverModule = undefined, childKey = undefined
  ) {
    // ...
  });

  initState = new DevFunction(null, function(state) {
    // ...
  });

  setState = new DevFunction(null, function(state) {
    // ...
  });
}





// TODO: Change to a deep comparison, comparing leafs of primitive, Symbol, and
// Function types.
export function compareProps(props1, props2) {
  let ret = true;
  props1.forEach((val, key) => {
    if (key !== "refs" && val !== props2[key]) {
      ret = false;
    }
  });
  if (!ret) return ret;
  props2.forEach((val, key) => {
    if (key !== "refs" && val !== props1[key]) {
      ret = false;
    }
  });
  return ret;
}
