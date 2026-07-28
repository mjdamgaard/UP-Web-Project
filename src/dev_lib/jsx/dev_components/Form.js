
import {
  DevFunction, ObjectObject
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, validateJSXInstanceAndGetDOMNode
} from "../jsx_components.js";
import {getID} from "./getID.js";



export const render = new DevFunction(
  "Form.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {className, children} = props;
    let domNode = validateJSXInstanceAndGetDOMNode(
      thisVal, "Form", "form", className, callerNode, execEnv
    );
    domNode.setAttribute("action", "javascript:void(0);");

    // If the children prop is defined, use jsxInstance.replaceChildren() to
    // render and append those children, also making sure to record the marks
    // as well (which will be attached to the returned DOMNodeObject).
    let marks = new Map();
    if (children !== undefined) {
      thisVal.jsxInstance.replaceChildren(
        domNode, [children], marks, interpreter, callerNode, execEnv,
        props
      );
    }

    return new DOMNodeObject(domNode, marks);
  }
);
