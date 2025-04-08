import {DevFunction, Immutable} from "../interpreting/ScriptInterpreter.js";
import {createAppSignal} from "./signals/fundamental_signals.js";



// Create a JSX (React-like) app and mounting it in the index HTML page, in
// the element with an id of "up-root".
export const createJSXApp = new DevFunction(createAppSignal, function(
  {callerNode, callerEnv, interpreter}, moduleObject, props
) {
  const rootInstance = new JSXModuleInstance(moduleObject, props);
  // ...
});



class JSXModuleInstance {

  constructor (moduleObject, moduleParent = null, key = null) {
    this.moduleObject = moduleObject;
    this.moduleParent = moduleParent;
    this.key = key;
    this.props = null;
    this.state = {};
    this.refs = {};
    this.moduleChildren = new Map();
    this.htmlElement = undefined;
  }

  render(props = Object.create(null), callerNode, callerEnv, isThisKeyword) {
    if (compareProps(props, this.props)) {
      return;
    }
    this.props = props;
    let fun = this.moduleObject.members["$render"];
    let inputArr = [props, new Immutable(this)];
    let jsxElement = interpreter.executeFunction(
      fun, inputArr, callerNode, callerEnv, this.moduleObject, isThisKeyword
    );
    // ...
  }


  $render = new DevFunction(null, (jsxElement) => {
    // ...
  });



  // If receiverModule is undefined, dispatch to self. Else if childKey is
  // undefined, dispatch to parent. Else dispatch to the child with the key =
  // childKey.
  $dispatch = new DevFunction(null, (
    action, inputArr, receiverModule = undefined, childKey = undefined
  ) => {
    // ...
  });

}






export function compareProps(props1, props2) {
  if (props1 instanceof Immutable) props1 = props1.val;
  if (props2 instanceof Immutable) props2 = props2.val;
  let ret = true;
  Object.keys(props1).some(key => {
    if (key !== "$refs" && props1[key] !== props2[key]) {
      ret = false;
      return true;
    }
  });
  if (!ret) return ret;
  Object.keys(props2).some(key => {
    if (key !== "$refs" && props1[key] !== props2[key]) {
      ret = false;
      return true;
    }
  });
  return ret;
}
