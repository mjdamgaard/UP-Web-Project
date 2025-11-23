
import {
  DevFunction, getString, ArgTypeError, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, JSXInstanceInterface, clearAttributes,
  validateThisValJSXInstance,
} from "../jsx_components.js";
import {getID} from "./getID.js";


export const render = new DevFunction(
  "Textarea.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (!(thisVal instanceof JSXInstanceInterface)) throw new ArgTypeError(
      "Textarea.render(): 'this' is not a JSXInstance",
      callerNode, execEnv
    );

    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {idKey, placeholder, onChange, onInput} = props;
    verifyTypes(
      [placeholder, onChange, onInput], ["string?", "function?", "function?"],
      callerNode, execEnv
    );
    let id = idKey === undefined ? undefined : getID(idKey);

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "TEXTAREA") {
      domNode = document.createElement("textarea");
      domNode.value = "";
    }
    else {
      clearAttributes(domNode);
    }
    domNode.setAttribute("class", "textarea_0");
    if (id !== undefined) domNode.setAttribute("id", id);
    if (placeholder !== undefined) {
      domNode.setAttribute("placeholder", placeholder);
    }

    // Set the onchange event if props.onChange is supplied.
    if (onChange) {
      domNode.onchange = (event) => {
        let {value} = event.target;
        let e = {value: value};
        interpreter.executeFunctionOffSync(
          onChange, [e], callerNode, execEnv, thisVal
        );
      };
    }

    // Set the oninput event if props.oninput is supplied.
    if (onInput) {
      domNode.oninput = (event) => {
        let {value} = event.target;
        let e = {value: value};
        interpreter.executeFunctionOffSync(
          onInput, [e], callerNode, execEnv, thisVal
        );
      };
    }

    return new DOMNodeObject(domNode, [domNode]);
  }
);



export const methods = [
  "getValue",
  "setValue",
  "clear",
  "focus",
  "blur",
];

export const actions = {
  "getValue": new DevFunction(
    "getValue", {}, function({thisVal, callerNode, execEnv}, []) {
      validateThisValJSXInstance(thisVal, callerNode, execEnv);
      return thisVal.jsxInstance.domNode.value;
    }
  ),
  "setValue": new DevFunction(
    "setValue", {}, function({thisVal, callerNode, execEnv}, [val]) {
      validateThisValJSXInstance(thisVal, callerNode, execEnv);
      val = getString(val, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      let prevVal = domNode.value;
      domNode.value = val;
      if (prevVal !== val) {
        domNode.dispatchEvent(new InputEvent("input"));
      }
    }
  ),
  "clear": new DevFunction(
    "clear", {}, function({thisVal, callerNode, execEnv}, []) {
      validateThisValJSXInstance(thisVal, callerNode, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      let prevVal = domNode.value;
      domNode.value = "";
      if (prevVal !== "") {
        domNode.dispatchEvent(new InputEvent("input"));
      }
    }
  ),
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      validateThisValJSXInstance(thisVal, callerNode, execEnv);
      let {jsxInstance} = thisVal;
      let canGrabFocus = !jsxInstance.settings.isOutsideFocusedAppScope(
        jsxInstance, callerNode, execEnv
      );
      if (canGrabFocus) {
        thisVal.jsxInstance.domNode.focus();
        return true;
      }
      else {
        return false;
      }
    }
  ),
  "blur": new DevFunction(
    "blur", {}, function({thisVal, callerNode, execEnv}, []) {
      validateThisValJSXInstance(thisVal, callerNode, execEnv);
      thisVal.jsxInstance.domNode.blur();
    }
  ),
};