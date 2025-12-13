
import {
  DevFunction, ArgTypeError, ObjectObject, verifyTypes, getPropertyFromObject,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, HREF_REGEX, HREF_CD_START_REGEX, clearAttributes,
  validateJSXInstance,
} from "../jsx_components.js";
import {CAN_POST_FLAG} from "../../query/src/flags.js";

// TODO: There's a vulnerability when calling pushState() here as a callback.
// So replace the current 'history' API/pattern for another API/pattern using
// events instead.


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
    let {href, pushState, children, onClick, homeURL} = props;
    if (pushState === undefined) {
      let history = thisVal.jsxInstance.subscribeToContext("history");
      if (history) {
        pushState = getPropertyFromObject(history, "pushState");
      }
    }
    homeURL ??= thisVal.jsxInstance.subscribeToContext("homeURL");
    verifyTypes(
      [href, homeURL, pushState, onClick],
      ["string?", "string?", "function?", "function?"],
      callerNode, execEnv
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
      // If href starts with "~/", interpret it as relative to the homeURL,
      // which is then parsed, and joined with href into an absolute path.
      if (href.substring(0, 2) === "~/") {
        homeURL ||= "";
        if (!HREF_REGEX.test(homeURL) || (homeURL && homeURL[0] !== "/")) {
          throw new ArgTypeError(
            "Invalid home URL: " + homeURL,
            callerNode, execEnv
          );
        }
        href = (href === "~/") ? homeURL || "/" : homeURL + href.substring(1);
      }

      // Validate href, and prepend './' to it if doesn't start with /.?.?\//.
      if (!HREF_REGEX.test(href)) throw new ArgTypeError(
        "Invalid href: " + href,
        callerNode, execEnv
      );
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

    // If pushState is defined we put an onclick event on the <a> element,
    // in order to redirect to pushState() rather than following the href
    // directly and reloading the page. (If the user control/middle-clicks the
    // link, it should still open a new tab in the browser, however.) But if
    // the onClick prop is defined, we first execute that, and if that returns
    // false, we prevent the normal behavior.
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

      if (pushState) {
        if (event.ctrlKey || event.button == 1) {
          return true;
        }
        else {
          interpreter.executeFunctionOffSync(
            pushState, [undefined, href], callerNode, execEnv, thisVal
          );
          return false; // Prevents default event propagation.
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