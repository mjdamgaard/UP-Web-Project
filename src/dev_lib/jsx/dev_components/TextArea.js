
import {
  DevFunction, ObjectObject, verifyTypes, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, validateJSXInstanceAndGetDOMNode, validateJSXInstance,
} from "../jsx_components.js";
import {CLIENT_TRUST_FLAG} from "../../query/src/flags.js";
import {getID} from "./getID.js";


export const render = new DevFunction(
  "TextArea.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {
      className, idKey, placeholder, children, lockFocus = true,
      autocomplete, onChange, onInput, onKeyDown, onKeyUp,
    } = props;
    if (lockFocus) className = !className ? "lock-focus" :
      getString(className, execEnv) + " lock-focus";
    verifyTypes(
      [placeholder, onChange, onInput, onKeyDown, onKeyUp],
      ["string?", "function?", "function?", "function?", "function?"],
      callerNode, execEnv
    );
    let id = idKey === undefined ? undefined : getID(idKey);
    if (children !== undefined) {
      children = getString(children, execEnv);
    }

    let domNode = validateJSXInstanceAndGetDOMNode(
      thisVal, "TextArea", "textarea", className, callerNode, execEnv,
      domNode => domNode.setAttribute("value", children ?? ""),
    );
    if (id !== undefined) domNode.setAttribute("id", id);
    if (placeholder !== undefined) {
      domNode.setAttribute("placeholder", placeholder);
    }
    if (autocomplete === "on" && execEnv.getFlag(CLIENT_TRUST_FLAG)) {
      domNode.setAttribute("autocomplete", "on");
    } else {
      domNode.setAttribute("autocomplete", "off");
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

    // Set the oninput event if onKeyDown and/or onKeyUp is supplied.
    if (onKeyDown) {
      domNode.onkeydown = (event) => {
        let {key, repeat, ctrlKey, altKey, shiftKey, metaKey} = event;
        let e = {
          key: key, repeat: repeat, ctrlKey: ctrlKey, altKey: altKey,
          shiftKey: shiftKey, metaKey: metaKey,
        };
        let ret = interpreter.executeFunctionOffSync(
          onKeyDown, [e], callerNode, execEnv, thisVal
        );
        if (!(ret ?? true)) {
          event.stopPropagation();
        }
      };
    }
    if (onKeyUp) {
      domNode.onkeyup = (event) => {
        let {key, repeat, ctrlKey, altKey, shiftKey, metaKey} = event;
        let e = {
          key: key, repeat: repeat, ctrlKey: ctrlKey, altKey: altKey,
          shiftKey: shiftKey, metaKey: metaKey,
        };
        let ret = interpreter.executeFunctionOffSync(
          onKeyUp, [e], callerNode, execEnv, thisVal
        );
        if (!(ret ?? true)) {
          event.stopPropagation();
        }
      };
    }

    return new DOMNodeObject(domNode);
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
      validateJSXInstance(thisVal, "TextArea", callerNode, execEnv);
      return thisVal.jsxInstance.domNode.value;
    }
  ),
  "setValue": new DevFunction(
    "setValue", {}, function({thisVal, callerNode, execEnv}, [val]) {
      validateJSXInstance(thisVal, "TextArea", callerNode, execEnv);
      val = getString(val, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      domNode.value = val;
    }
  ),
  "clear": new DevFunction(
    "clear", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "TextArea", callerNode, execEnv);
      let domNode = thisVal.jsxInstance.domNode;
      domNode.value = "";
    }
  ),
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "TextArea", callerNode, execEnv);
      let {jsxInstance} = thisVal;
      if (jsxInstance.canGrabFocus()) {
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
      validateJSXInstance(thisVal, "TextArea", callerNode, execEnv);
      thisVal.jsxInstance.domNode.blur();
    }
  ),
};