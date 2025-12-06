
import {
  DevFunction, getString, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, clearAttributes, validateJSXInstance,
} from "../jsx_components.js";
import {getID} from "./getID.js";


export const render = new DevFunction(
  "Textarea.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    validateJSXInstance(thisVal, "Textarea.jsx", callerNode, execEnv);
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {idKey, placeholder, children, onChange, onInput} = props;
    verifyTypes(
      [placeholder, onChange, onInput], ["string?", "function?", "function?"],
      callerNode, execEnv
    );
    let id = idKey === undefined ? undefined : getID(idKey);
    if (children !== undefined) {
      children = getString(children, execEnv);
    }

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "TEXTAREA") {
      domNode = document.createElement("textarea");
      domNode.value = children ?? "";
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

    // Set the oninput event if props.onInput is supplied.
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
      validateJSXInstance(thisVal, "Textarea.jsx", callerNode, execEnv);
      return thisVal.jsxInstance.domNode.value;
    }
  ),
  "setValue": new DevFunction(
    "setValue", {}, function({thisVal, callerNode, execEnv}, [val]) {
      validateJSXInstance(thisVal, "Textarea.jsx", callerNode, execEnv);
      val = getString(val, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      domNode.value = val;
    }
  ),
  "clear": new DevFunction(
    "clear", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "Textarea.jsx", callerNode, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      domNode.value = "";
    }
  ),
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "Textarea.jsx", callerNode, execEnv);
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
      validateJSXInstance(thisVal, "Textarea.jsx", callerNode, execEnv);
      thisVal.jsxInstance.domNode.blur();
    }
  ),
};