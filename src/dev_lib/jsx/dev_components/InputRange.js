
import {
  DevFunction, ArgTypeError, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {DOMNodeObject, JSXInstanceInterface} from "../jsx_components.js";


export const render = new DevFunction(
  "InputRange.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    // TODO: Add an oninput event as well (and make it so that components like
    // InputRangeAndValue.jsx can work without changing focus at the wrong
    // times.
    let {min, max, value, step, onChange} = props;
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
    if (!domNode || domNode.tagName !== "input") {
      domNode = document.createElement("input");
      domNode.setAttribute("type", "range");
      domNode.setAttribute("class", "input-range_0");
      if (min !== undefined) domNode.setAttribute("min", min);
      if (max !== undefined) domNode.setAttribute("max", max);
      if (value !== undefined) domNode.setAttribute("value", value);
      if (step !== undefined) domNode.setAttribute("step", step);
    }

    // Set the onChange event if props.onChange is supplied.
    if (onChange) {
      // Set an input event, but do it in a way that it is delayed for some
      // milliseconds, and where a new oninput event fired in the meantime will
      // essentially overwrite the existing one. Thus the input event will fire
      // less frequently when the user types something.
      let ref = [];
      domNode.onchange = () => {
        let eventID = ref[0] = {};
        // TODO: THis setTimeout() thing might be redundant when using onchange
        // rather than oninput, so consider removing it.
        setTimeout(() => {
          if (ref[0] !== eventID) return;
          // TODO: Add event argument when implemented.
          interpreter.executeFunctionOffSync(
            onChange, [domNode.value], callerNode, execEnv, thisVal
          );
          // This prevents the loss of focus for but a brief moment if an
          // ancestor component rerenders as a consequence of the input event.
          setTimeout(() => {
            domNode.focus();
          }, 0);
        }, 50);
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
  // TODD: First check that the element is a child of the currently focused
  // element before being able to grab the focus. *(Or maybe actually just that
  // the currently focused element has the same style scope (/ component ID))
  // as this one.
  "focus": new DevFunction("focus", {}, function({thisVal}, []) {
    thisVal.jsxInstance.domNode.focus();
  }),
  "blur": new DevFunction("blur", {}, function({thisVal}, []) {
    thisVal.jsxInstance.domNode.blur();
  }),
};