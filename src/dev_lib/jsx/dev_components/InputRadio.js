
import {
  DevFunction, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, clearAttributes, validateJSXInstance,
} from "../jsx_components.js";
import {getID} from "./getID.js";


export const render = new DevFunction(
  "InputRadio.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    validateJSXInstance(thisVal, "InputRadio.jsx", callerNode, execEnv);
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {idKey, name, checked, onChange, onInput} = props;
    verifyTypes(
      [name, onChange, onInput], ["string?", "function?", "function?"],
      callerNode, execEnv
    );
    let id = idKey === undefined ? undefined : getID(idKey);

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "INPUT") {
      domNode = document.createElement("input");
      if (checked) domNode.setAttribute("checked", true);
    }
    else {
      clearAttributes(domNode, ["type", "checked"]);
    }
    domNode.setAttribute("type", "radio");
    domNode.setAttribute("class", "input-radio_0");
    if (id !== undefined) domNode.setAttribute("id", id);
    if (name !== undefined) domNode.setAttribute("name", name);

    // Set the onchange event if props.onChange is supplied.
    if (onChange) {
      domNode.onchange = (event) => {
        let {checked} = event.target;
        let e = {value: checked};
        interpreter.executeFunctionOffSync(
          onChange, [e], callerNode, execEnv, thisVal
        );
      };
    }

    // Set the oninput event if props.onInput is supplied.
    if (onInput) {
      domNode.oninput = (event) => {
        let {checked} = event.target;
        let e = {value: checked};
        interpreter.executeFunctionOffSync(
          onInput, [e], callerNode, execEnv, thisVal
        );
      };
    }

    return new DOMNodeObject(domNode, [domNode]);
  }
);


export const methods = [
  "getIsChecked",
  "setIsChecked",
  "clear",
  "focus",
  "blur",
];

export const actions = {
  "getIsChecked": new DevFunction(
    "getIsChecked", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "InputRadio.jsx", callerNode, execEnv);
      return thisVal.jsxInstance.domNode.checked;
    }
  ),
  "setIsChecked": new DevFunction(
    "setIsChecked", {}, function({thisVal, callerNode, execEnv}, [val]) {
      validateJSXInstance(thisVal, "InputRadio.jsx", callerNode, execEnv);
      val = val ? true : false;
      let {domNode} = thisVal.jsxInstance;
      domNode.checked = val;
    }
  ),
  "clear": new DevFunction(
    "clear", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "InputRadio.jsx", callerNode, execEnv);
      let {domNode, props} = thisVal.jsxInstance;
      let {checked: initVal} = props;
      domNode.checked = initVal ? true : false;
    }
  ),
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "InputRadio.jsx", callerNode, execEnv);
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
      validateJSXInstance(thisVal, "InputRadio.jsx", callerNode, execEnv);
      thisVal.jsxInstance.domNode.blur();
    }
  ),
};