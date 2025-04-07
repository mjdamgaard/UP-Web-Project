import {DevFunction} from "../interpreting/ScriptInterpreter.js";
import {createAppSignal} from "./signals/fundamental_signals.js";



// Create a JSX (React-like) app and mounting it in the index HTML page, in
// the element with an id of "up-root".
export const createJSXApp = new DevFunction(createAppSignal, function(
  {callerNode, callerEnv, interpreter}, moduleObject
) {
  // ...
});



class JSXModuleInstance {

  constructor (moduleObject, parent = null, key = null, props = {}) {
    this.moduleObject = moduleObject;
    this.childModules = moduleObject.members["&childModules"]?.val;
    this.parent = parent;
    this.key = key;
    this.props = props;
    this.state = {};
    this.refs = {};
    this.children = new Map();
    this.htmlElement = undefined;
  }

  render(jsxElement) {

  }



  // If receiverModule is undefined, dispatch to self. Else if childKey is
  // undefined, dispatch to parent. Else dispatch to the child with the key =
  // childKey.
  dispatch(action, inputArr, receiverModule = undefined, childKey = undefined) {

  }


  addChildModule(moduleObject) {
    // TODO: Implement.
  }

}