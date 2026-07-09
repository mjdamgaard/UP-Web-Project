
import {
  DevFunction, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, clearAttributes, validateJSXInstance,
} from "../jsx_components.js";
import {CAN_POST_FLAG, CLIENT_TRUST_FLAG} from "../../query/src/flags.js";


// TODO: Call a method from the SettingsObject instead in order to get the
// URL whitelist, which then allows it to be user-dependent.
// And in the meantime, a todo is also to expand the list below.

const URL_VALID_CHARACTERS_REGEX =
  /^https:\/(\/([.~a-zA-Z0-9_\-?=:#()\[\]]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+)+\/?$/;

const urlWhitelist = [
  /^https:\/\/(www\.)?up-web\.org($|\/)/,
  /^https:\/\/([a-z]+\.)?wikipedia\.org($|\/)/,
  /^https:\/\/(www\.)?github\.com($|\/)/,
  /^https:\/\/(www\.)?nodejs\.org($|\/)/,
  /^https:\/\/(www\.)?w3schools\.com($|\/)/,
  /^https:\/\/developer\.mozilla\.org($|\/)/,
  /^https:\/\/(www\.)?reddit\.com($|\/)/,
  /^https:\/\/(www\.)?facebook\.com($|\/)/,
  /^https:\/\/(www\.)?linkedin\.com($|\/)/,
  /^https:\/\/(www\.)?youtube\.com($|\/)/,
  /^https:\/\/code\.visualstudio\.com($|\/)/,
];

function getIsAllowed(href, execEnv) {
  return !href || execEnv.getFlag(CLIENT_TRUST_FLAG) || (
    URL_VALID_CHARACTERS_REGEX.test(href) &&
    urlWhitelist.reduce(
      (acc, val) => acc || val.test(href),
      false
    )
  );
}



export const render = new DevFunction(
  "ELink.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    validateJSXInstance(thisVal, "ELink", callerNode, execEnv);
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {href = "", children, onClick} = props;
    verifyTypes(
      [href, onClick], ["string", "function?"], callerNode, execEnv
    );

    // Check whether the href is whitelisted.
    let isAllowed = getIsAllowed(href, execEnv);

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "A") {
      domNode = document.createElement("a");
    }
    else {
      clearAttributes(domNode);
    }
    domNode.setAttribute(
      "class", "e-link" + (isAllowed ? " allowed" : " not-allowed")
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
      jsxInstance.replaceChildren(
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
];

export const actions = {
  "getIsAllowed": new DevFunction(
    "getIsAllowed", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "ELink", callerNode, execEnv);
      let {href} = thisVal.jsxInstance.props;
      return getIsAllowed(href, execEnv);
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
};