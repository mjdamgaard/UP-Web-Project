
import {
  DevFunction, ArgTypeError, ObjectObject, verifyTypes, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, clearAttributes, validateJSXInstance,
} from "../jsx_components.js";
import {CAN_POST_FLAG} from "../../query/src/flags.js";



export const render = new DevFunction(
  "ILink.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    validateJSXInstance(thisVal, "ILink", callerNode, execEnv);
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {href, children, onClick, state, copyOtherStates} = props;
    verifyTypes(
      [href, onClick], ["string?", "function?"], callerNode, execEnv
    );

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "A") {
      domNode = document.createElement("a");
    }
    else {
      clearAttributes(domNode);
    }
    domNode.setAttribute("class", "i-link");

    // Add the relative href if provided.
    if (href !== undefined) {
      // Call getValidatedPathname() in order to get the absolute href.
      href = getString(href, execEnv);
      href = jsxInstance.getValidatedPathname(href, callerNode, execEnv);

      // Add the href attribute.
      domNode.setAttribute("href", href);
    }

    // If the children prop is defined, use jsxInstance.replaceChildren() to
    // render and append those children, also making sure to record the marks
    // as well (which will be attached to the returned DOMNodeObject).
    let marks = new Map();
    if (children !== undefined) {
      jsxInstance.replaceChildren(
        domNode, [children], marks, interpreter, callerNode, execEnv,
        props
      );
    }

    // Regardless of whether onClick is defined, we put an onclick event on the
    // <a> element, in order to redirect to pushState() rather than following
    // the href directly and reloading the page. (If the user control/middle-
    // clicks the link, it should still open a new tab in the browser,
    // however.) But if the onClick prop is defined, we first execute that, and
    // if that returns false, we prevent the normal behavior.
    domNode.onclick = (event) => {
      if (onClick) {
        let {
          button, offsetX, offsetY, ctrlKey, altKey, shiftKey, metaKey
        } = event;
        let e = {
          canPost: true,
          button: button, offsetX: offsetX, offsetY: offsetY,
          ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey,
          metaKey: metaKey,
        };
        let errRef = [];
        let shouldFollowLink = interpreter.executeFunctionOffSync(
          onClick, [e], callerNode, execEnv, thisVal,
          [[CAN_POST_FLAG, true]], errRef
        ) ?? true;
        if (!shouldFollowLink || errRef[0]) {
          return false; // Prevents default event propagation.
        }
      }

      if (href !== undefined) {
        if (event.ctrlKey || event.button == 1) {
          return true;
        }
        else {
          jsxInstance.pushOrReplaceURLAndState(
            href, state, copyOtherStates, false, true, undefined,
            callerNode, execEnv
          );
          return false; // Prevents default event propagation.
        }
      }

      return true;
    };

    return new DOMNodeObject(domNode, marks);
  }
);



export const methods = [
  "focus",
  "blur",
];

export const actions = {
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "ILink", callerNode, execEnv);
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
      validateJSXInstance(thisVal, "ILink", callerNode, execEnv);
      thisVal.jsxInstance.domNode.blur();
    }
  ),
};