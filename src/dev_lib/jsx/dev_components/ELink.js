
import {
  DevFunction, ObjectObject, verifyTypes, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, validateJSXInstanceAndGetDOMNode, validateJSXInstance,
  checkPathPermission,
} from "../jsx_components.js";
import {CAN_POST_FLAG, CLIENT_PERMISSIONS_FLAG} from "../../query/src/flags.js";



const URL_VALID_CHARACTERS_REGEX =
  /^https:\/(\/([.~a-zA-Z0-9_\-?=:#()\[\]]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+)+\/?$/;


function getIsAllowed(href, node, env) {
  if (!href) return true;
  if (!URL_VALID_CHARACTERS_REGEX.test(href)) return false;
  let permissions = env.getFlag(CLIENT_PERMISSIONS_FLAG);
  return checkPathPermission(permissions, "linkTo", href, node, env);
}



export const render = new DevFunction(
  "ELink.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {className = "e-link", href = "", children, onClick} = props;
    verifyTypes(
      [href, onClick], ["string", "function?"], callerNode, execEnv
    );

    // Check whether the href is allowed.
    let isAllowed = getIsAllowed(href, callerNode, execEnv);

    if (!isAllowed) className = !className ? "not-allowed" :
      getString(className, callerNode, execEnv) + " not-allowed";
    let domNode = validateJSXInstanceAndGetDOMNode(
      thisVal, "ELink", "a", className, callerNode, execEnv
    );
    if (href) {
      if (isAllowed) domNode.setAttribute("href", href);
      else domNode.setAttribute("data-href", href);
    }

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

    if (onClick) {
      domNode.onclick = (event) => {
        let {
          button, offsetX, offsetY, ctrlKey, altKey, shiftKey, metaKey
        } = event;
        let e = {
          canPost: true,
          button: button, offsetX: offsetX, offsetY: offsetY,
          ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey,
          metaKey: metaKey,
        };
        let shouldFollowLink = interpreter.executeFunctionOffSync(
          onClick, [e], callerNode, execEnv, thisVal, [[CAN_POST_FLAG, true]]
        ) ?? true;
        return shouldFollowLink; // Prevents default event propagation if false.
      };
    }

    return new DOMNodeObject(domNode, marks);
  }
);




export const methods = [
  "getIsAllowed",
  "focus",
  "blur",
  "call",
];

export const actions = {
  "getIsAllowed": new DevFunction(
    "getIsAllowed", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "ELink", callerNode, execEnv);
      let {href} = thisVal.jsxInstance.props;
      return getIsAllowed(href, callerNode, execEnv);
    }
  ),
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "ELink", callerNode, execEnv);
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
      validateJSXInstance(thisVal, "ELink", callerNode, execEnv);
      thisVal.jsxInstance.domNode.blur();
    }
  ),
  "call": new DevFunction(
    "call", {}, function(
      {thisVal, callerNode, execEnv, interpreter},
      [childKey, methodKey, ...inputArr]
    ) {
      validateJSXInstance(thisVal, "ELink", callerNode, execEnv);
      return thisVal.jsxInstance.call(
        childKey, methodKey, inputArr, interpreter, callerNode, execEnv
      );
    }
  ),
};