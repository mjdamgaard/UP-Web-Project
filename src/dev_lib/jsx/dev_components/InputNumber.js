
import {
  DevFunction, ObjectObject, verifyTypes, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, clearAttributes, validateJSXInstance,
} from "../jsx_components.js";
import {getID} from "./getID.js";


export const render = new DevFunction(
  "InputNumber.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    validateJSXInstance(thisVal, "InputNumber.jsx", callerNode, execEnv);
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {
      // TODO: Add a Datalist dev component at some point, and add a 'list'
      // prop to all Input dev components that might use it. 
      idKey, min, max, step, value, placeholder, readonly, onChange, onInput
    } = props;
    verifyTypes(
      [min, max, step, value, onChange, onInput],
      ["number?", "number?", "number?", "number?", "function?", "function?"],
      callerNode, execEnv
    );
    let id = idKey === undefined ? undefined : getID(idKey);

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "INPUT") {
      domNode = document.createElement("input");
      if (value !== undefined) domNode.value = value;
    }
    else {
      clearAttributes(domNode);
    }
    domNode.setAttribute("type", "number");
    domNode.setAttribute("class", "input-number_0");
    if (id !== undefined) domNode.setAttribute("id", id);
    if (min !== undefined) domNode.setAttribute("min", min);
    if (max !== undefined) domNode.setAttribute("max", max);
    if (step !== undefined) domNode.setAttribute("step", step);
    if (value !== undefined) domNode.setAttribute("value", value);
    if (placeholder !== undefined) {
      domNode.setAttribute("placeholder", getString(placeholder, execEnv));
    }
    if (readonly) domNode.setAttribute("readonly", true);

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
      validateJSXInstance(thisVal, "InputNumber.jsx", callerNode, execEnv);
      return thisVal.jsxInstance.domNode.value;
    }
  ),
  "setValue": new DevFunction(
    "setValue", {typeArr: ["number"]},
    function({thisVal, callerNode, execEnv}, [val]) {
      validateJSXInstance(thisVal, "InputNumber.jsx", callerNode, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      domNode.value = val;
    }
  ),
  "clear": new DevFunction(
    "clear", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "InputNumber.jsx", callerNode, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      let initVal = parseFloat(domNode.getAttribute("value"));
      if (Number.isNaN(initVal)) return;
      domNode.value = initVal;
    }
  ),
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "InputNumber.jsx", callerNode, execEnv);
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
      validateJSXInstance(thisVal, "InputNumber.jsx", callerNode, execEnv);
      thisVal.jsxInstance.domNode.blur();
    }
  ),
};