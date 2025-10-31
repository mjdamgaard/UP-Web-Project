
import {
  DevFunction, getString, ArgTypeError, ObjectObject, verifyTypes,
  getPropertyFromObject,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, JSXInstanceInterface, HREF_REGEX, HREF_CD_START_REGEX,
  clearAttributes,
} from "../jsx_components.js";

export const URL_REGEX = /^(\/[a-zA-Z0-9_.~!&$+=;\-]+)*$/;



export const render = new DevFunction(
  "ILink.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
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
      [pushState, onClick], ["function?", "function?"], callerNode, execEnv
    );

    if (!(thisVal instanceof JSXInstanceInterface)) throw new ArgTypeError(
      "ILink.render(): 'this' is not a JSXInstance",
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
      href = getString(href, execEnv); 

      // If href starts with "~/", interpret it as relative to the homeURL,
      // which is then parsed, and joined with href into an absolute path.
      if (href.substring(0, 2) === "~/") {
        homeURL = homeURL ? getString(homeURL, execEnv) : "";
        if (!URL_REGEX.test(homeURL)) throw new ArgTypeError(
          "Invalid home URL: " + homeURL,
          callerNode, execEnv
        );
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
        // TODO: Add event argument.
        let shouldFollowLink = interpreter.executeFunctionOffSync(
          onClick, [], callerNode, execEnv, thisVal
        ) ?? true;
        if (!shouldFollowLink) {
          return;
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

