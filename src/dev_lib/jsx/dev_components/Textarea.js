
import {
  DevFunction, getString, ArgTypeError, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {DOMNodeObject, JSXInstanceInterface} from "../jsx_components.js";


export const render = new DevFunction(
  "Textarea.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {placeholder, onChange} = props;
    verifyTypes(
      [placeholder, onChange], ["string?", "function?"],
      callerNode, execEnv
    );

    if (!(thisVal instanceof JSXInstanceInterface)) throw new ArgTypeError(
      "Textarea.render(): 'this' is not a JSXInstance",
      callerNode, execEnv
    );

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "textarea") {
      domNode = document.createElement("textarea");
      domNode.setAttribute("class", "textarea_0");
      if (placeholder !== undefined) {
        domNode.setAttribute("placeholder", placeholder);
      }
    }

    // Set the onChange event if props.onChange is supplied.
    if (onChange) {
      // Set an input event, but do it in a way that it is delayed for some
      // milliseconds, and where a new oninput event fired in the meantime will
      // essentially overwrite the existing one. Thus the input event will fire
      // less frequently when the user types something.
      let ref = [];
      domNode.oninput = () => {
        let eventID = ref[0] = {};
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

    // TODO: Confirm that letting the user be able to style the text field
    // directly (i.e. by letting ownDOMNodes = [domNode] here), will not let
    // them be able to trick the browser into auto-filling in text, and
    // especially not a password. 
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
      val = getString(val, callerNode, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      let prevVal = domNode.value;
      domNode.value = val;
      if (prevVal !== val) {
        domNode.dispatchEvent(new InputEvent("input"));
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