
import {
  DevFunction, getString, ArgTypeError, ObjectObject,
  verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, JSXInstanceInterface, clearAttributes
} from "../jsx_components.js";


export const render = new DevFunction(
  "InputText.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (!(thisVal instanceof JSXInstanceInterface)) throw new ArgTypeError(
      "InputText.render(): 'this' is not a JSXInstance",
      callerNode, execEnv
    );

    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {size, value, placeholder, onChange, onInput} = props;
    verifyTypes(
      [size, onChange, onInput],
      ["integer positive?", "function?", "function?"],
      callerNode, execEnv
    );
    if (placeholder !== undefined) {
      placeholder = getString(placeholder, execEnv);
    }
    if (value !== undefined) {
      value = getString(value, execEnv);
    }

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "INPUT") {
      domNode = document.createElement("input");
      domNode.value = "";
    }
    else {
      clearAttributes(domNode);
    }
    domNode.setAttribute("type", "text");
    domNode.setAttribute("class", "input-text_0");
    if (size !== undefined) domNode.setAttribute("size", size);
    if (value !== undefined) domNode.value = value;
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
  "getValue": new DevFunction("getValue", {}, function({thisVal}, []) {
    return thisVal.jsxInstance.domNode.value;
  }),
  "setValue": new DevFunction(
    "setValue", {}, function({thisVal, callerNode, execEnv}, [val]) {
      val = getString(val, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      let prevVal = domNode.value;
      let activeElement = document.activeElement;
      domNode.value = val;
      // activeElement.focus();
      if (prevVal !== val) {
        // domNode.dispatchEvent(new InputEvent("input"));
      }
    }
  ),
  "clear": new DevFunction("clear", {}, function({thisVal}, []) {
    let domNode = thisVal.jsxInstance.domNode;
    let prevVal = domNode.value;
    domNode.value = "";
    if (prevVal !== "") {
      domNode.dispatchEvent(new InputEvent("input"));
    }
  }),
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      let {jsxInstance} = thisVal;
      let canGrabFocus = !jsxInstance.settings.isOutsideFocusedStyleScope(
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
  "blur": new DevFunction("blur", {}, function({thisVal}, []) {
    thisVal.jsxInstance.domNode.blur();
  }),
};