
import {
  DevFunction, FunctionObject, ArgTypeError, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, JSXInstanceInterface, clearAttributes
} from "../jsx_components.js";


export const render = new DevFunction(
  "InputRange.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {min, max, value, step, onChange, onInput} = props;
    verifyTypes(
      [min, max, value, step, onChange],
      ["number?", "number?", "number?", "number?", "function?"],
      callerNode, execEnv
    );

    if (!(thisVal instanceof JSXInstanceInterface)) throw new ArgTypeError(
      "InputRange.render(): 'this' is not a JSXInstance",
      callerNode, execEnv
    );

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
    domNode.setAttribute("type", "range");
    domNode.setAttribute("class", "input-range_0");
    if (min !== undefined) domNode.setAttribute("min", min);
    if (max !== undefined) domNode.setAttribute("max", max);
    if (value !== undefined) domNode.setAttribute("value", value);
    if (step !== undefined) domNode.setAttribute("step", step);

    // Set the onchange event if props.onChange is supplied.
    if (onChange) {
      if (!(onChange instanceof FunctionObject)) throw new ArgTypeError(
        "onChange event received a non-function value",
        callerNode, execEnv
      );
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
      if (!(onInput instanceof FunctionObject)) throw new ArgTypeError(
        "onInput event received a non-function value",
        callerNode, execEnv
      );
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
    "setValue", {typeArr: ["number"]},
    function({thisVal}, [val]) {
      let domNode = thisVal.jsxInstance.domNode;
      let prevVal = domNode.value;
      // let activeElement = document.activeElement;
      domNode.value = val;
      // activeElement.focus();
      if (prevVal !== val) {
        domNode.dispatchEvent(new InputEvent("input"));
      }
    }
  ),
  "clear": new DevFunction("clear", {}, function({thisVal}, []) {
    let domNode = thisVal.jsxInstance.domNode;
    let prevVal = domNode.value;
    let initVal = parseFloat(domNode.getAttribute("value"));
    if (Number.isNaN(initVal)) return;
    domNode.value = initVal;
    if (prevVal !== initVal) {
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