
import {
  DevFunction, ArgTypeError, ObjectObject, verifyTypes, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, HREF_REGEX, HREF_CD_START_REGEX, clearAttributes,
  validateJSXInstance,
} from "../jsx_components.js";
import {CAN_POST_FLAG} from "../../query/src/flags.js";



export const render = new DevFunction(
  "ILink.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    validateJSXInstance(thisVal, "ILink.jsx", callerNode, execEnv);
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {href, children, onClick} = props;
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
    domNode.setAttribute("class", "i-link_0");

    // Add the relative href if provided.
    if (href !== undefined) {
      // Trigger the getURL event in order to get the absolute href. 
      href = jsxInstance.trigger(
        "getURL", href, interpreter, callerNode, execEnv
      ) ?? href;

      // Validate href, and prepend './' to it if doesn't start with /.?.?\//.
      if (!(typeof href === "string") || !HREF_REGEX.test(href)) {
        throw new ArgTypeError(
          "Invalid href: " + getString(href, execEnv),
          callerNode, execEnv
        );
      }
      if (!HREF_CD_START_REGEX.test(href)) href = './' + href;

      // Add the href attribute.
      domNode.setAttribute("href", href);
    }

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
        let shouldFollowLink = interpreter.executeFunctionOffSync(
          onClick, [e], callerNode, execEnv, thisVal, [[CAN_POST_FLAG, true]]
        ) ?? true;
        if (!shouldFollowLink) {
          return false; // Prevents default event propagation.
        }
      }

      if (href !== undefined) {
        if (event.ctrlKey || event.button == 1) {
          return true;
        }
        else {
          let triggerFun = thisVal.members.trigger;
          let errRef = [];
          let hasPushed = interpreter.executeFunctionOffSync(
            triggerFun, ["pushURL", href], callerNode, execEnv, thisVal,
            [[CAN_POST_FLAG, false]], errRef
          );
          if (hasPushed && !errRef[0]) {
            return false; // Prevents default event propagation.
          }
        }
      }

      return true;
    };

    return new DOMNodeObject(domNode, ownDOMNodes, marks);
  }
);



export const methods = [
  "focus",
  "blur",
];

export const actions = {
  "focus": new DevFunction(
    "focus", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "ILink.jsx", callerNode, execEnv);
      let {jsxInstance} = thisVal;
      let canGrabFocus = !jsxInstance.settings.isOutsideFocusedAppScope(
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
  "blur": new DevFunction(
    "blur", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "ILink.jsx", callerNode, execEnv);
      thisVal.jsxInstance.domNode.blur();
    }
  ),
};