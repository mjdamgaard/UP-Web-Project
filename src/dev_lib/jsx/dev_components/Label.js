
import {
  DevFunction, ArgTypeError, ObjectObject,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, JSXInstanceInterface, clearAttributes
} from "../jsx_components.js";
import {getID} from "./getID.js";



export const render = new DevFunction(
  "Label.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (!(thisVal instanceof JSXInstanceInterface)) throw new ArgTypeError(
      "Label.render(): 'this' is not a JSXInstance",
      callerNode, execEnv
    );

    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {forKey, children} = props;
    let forVal = forKey === undefined ? undefined : getID(forKey);

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "LABEL") {
      domNode = document.createElement("label");
    }
    else {
      clearAttributes(domNode);
    }
    domNode.setAttribute("class", "label_0");
    if (forVal !== undefined) domNode.setAttribute("for", forVal);

    // If the children prop is defined, use thisVal.getDOMNode() to render and
    // append those children, also making sure to record the ownDOMNodes and
    // marks as well (which will be attached to the returned DOMNodeObject).
    let marks = new Map();
    let ownDOMNodes = [];
    if (children !== undefined) {
      jsxInstance.replaceChildren(
        domNode, [children], marks, interpreter, callerNode, execEnv,
        props, ownDOMNodes
      );
    }
    ownDOMNodes = [domNode, ...ownDOMNodes];

    return new DOMNodeObject(domNode, [domNode]);
  }
);
