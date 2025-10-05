
import {
  DevFunction, getString, ArgTypeError, ObjectObject, verifyTypes,
  getPropertyFromObject,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, JSXInstanceInterface, HREF_REGEX, HREF_CD_START_REGEX,
} from "../jsx_components.js";



export const render = new DevFunction(
  "ILink.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {href, pushState, children, onClick} = props;
    if (pushState === undefined) {
      let history = thisVal.jsxInstance.subscribeToContext("history");
      if (history) {
        pushState = getPropertyFromObject(history, "pushState");
      }
    }
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
    if (!domNode || domNode.tagName !== "a") {
      domNode = document.createElement("a");
      domNode.setAttribute("class", "i-link_0");
    }

    // Add the relative href if provided.
    if (href !== undefined) {
      href = getString(href, callerNode, execEnv);

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
      let childrenNodes = jsxInstance.getDOMNode(
        children, marks, interpreter, callerNode, execEnv, props,
        ownDOMNodes, false
      );
      if (childrenNodes instanceof Array) {
        domNode.append(...childrenNodes);
      } else {
        domNode.append(childrenNodes);
      }
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
        // TODO: Add event argument when implemented.
        let shouldFollowLink = interpreter.executeFunctionOffSync(
          onClick, [], callerNode, execEnv, thisVal
        ) ?? true;
        if (!shouldFollowLink) {
          return;
        }
      }

      if (pushState) {
        if (event.ctrlKey || event.which == 2) {
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

