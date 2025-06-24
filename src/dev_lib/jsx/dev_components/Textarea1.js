
import {
  FunctionObject, DevFunction, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {DOMNodeObject} from "../jsx_components.js";


export const render = new DevFunction(
  {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode ?? document.createElement("textarea");
    let onChangeFun = props.onChange;
    if (onChangeFun instanceof FunctionObject) {
      // Set an input event, but do it in a way that it is delayed for some
      // milliseconds, and where a new oninput event fired in the meantime will
      // essentially overwrite the existing one. Thus the input event will fire
      // less frequently when the user types something.
      let ref = [];
      domNode.oninput = () => {
        let eventID = ref[0] = {};
        setTimeout(() => {
          if (ref[0] !== eventID) return;
          // TODO: Make sure that this will not cause uncaught async errors,
          // which it probably will at this point..
          interpreter.executeAsyncFunction(
            onChangeFun, [], callerNode, execEnv, thisVal,
          );
          // This prevents the loss of focus for but a brief moment if an
          // ancestor component rerenders as a consequence of the input event.
          setTimeout(() => {
            domNode.focus();
          }, 0);
        }, 50);
      };
    }
    return new DOMNodeObject(domNode);
  }
);



export const methods = {
  "getValue": new DevFunction({}, function({thisVal}, []) {
    return thisVal.jsxInstance.domNode.value;
  }),
  "setValue": new DevFunction({}, function({thisVal}, [val]) {
    val = getString(val);
    let domNode = thisVal.jsxInstance.domNode;
    let prevVal = domNode.value;
    domNode.value = val;
    if (prevVal !== val) {
      domNode.dispatchEvent(new InputEvent("input"));
    }
  }),
  "clear": new DevFunction({}, function({thisVal}, []) {
    let domNode = thisVal.jsxInstance.domNode;
    let prevVal = domNode.value;
    domNode.value = "";
    if (prevVal !== "") {
      domNode.dispatchEvent(new InputEvent("input"));
    }
  }),
  "focus": new DevFunction({}, function({thisVal}, []) {
    thisVal.jsxInstance.domNode.focus();
  }),
  "blur": new DevFunction({}, function({thisVal}, []) {
    thisVal.jsxInstance.domNode.blur();
  }),
};