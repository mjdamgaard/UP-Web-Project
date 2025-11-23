
import {
  DevFunction, ArgTypeError, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, JSXInstanceInterface, clearAttributes,
  validateThisValJSXInstance,
} from "../jsx_components.js";
import {getID} from "./getID.js";


export const render = new DevFunction(
  "InputCheckbox.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (!(thisVal instanceof JSXInstanceInterface)) throw new ArgTypeError(
      "InputCheckbox.render(): 'this' is not a JSXInstance",
      callerNode, execEnv
    );

    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {idKey, checked, onChange, onInput} = props;
    verifyTypes(
      [onChange, onInput], ["function?", "function?"],
      callerNode, execEnv
    );
    let id = idKey === undefined ? undefined : getID(idKey);

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "INPUT") {
      domNode = document.createElement("input");
    }
    else {
      clearAttributes(domNode);
    }
    domNode.setAttribute("type", "checkbox");
    domNode.setAttribute("class", "input-checkbox_0");
    if (id !== undefined) domNode.setAttribute("id", id);
    if (checked) domNode.setAttribute("checked", true);

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

    // Set the oninput event if props.oninput is supplied.
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
      validateThisValJSXInstance(thisVal, callerNode, execEnv);
      return thisVal.jsxInstance.domNode.checked;
    }
  ),
  "setIsChecked": new DevFunction(
    "setIsChecked", {}, function({thisVal, callerNode, execEnv}, [val]) {
      validateThisValJSXInstance(thisVal, callerNode, execEnv);
      val = val ? true : false;
      let {domNode} = thisVal.jsxInstance;
      let prevVal = domNode.checked;
      domNode.checked = val;
      if (prevVal !== val) {
        domNode.dispatchEvent(new InputEvent("input"));
      }
    }
  ),
  "clear": new DevFunction(
    "clear", {}, function({thisVal, callerNode, execEnv}, []) {
      validateThisValJSXInstance(thisVal, callerNode, execEnv);
      let {domNode, props} = thisVal.jsxInstance;
      let {checked: initVal} = props;
      let prevVal = domNode.checked;
      domNode.checked = initVal ? true : false;
      if (prevVal !== initVal) {
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