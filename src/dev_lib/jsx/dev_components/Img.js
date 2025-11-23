
import {
  DevFunction, ObjectObject, verifyTypes,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, clearAttributes, validateThisValJSXInstance,
} from "../jsx_components.js";


// TODO: Call a method from the SettingsObject instead in order to get the
// URL whitelist, which then allows it to be user-dependent.
// And in the meantime, a todo is also to expand the list below.

const URL_VALID_CHARACTERS_REGEX =
  /^https:\/(\/([.~a-zA-Z0-9_\-?=:]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+)+$/;

const urlWhitelist = [
  /^https:\/\/en\.wikipedia\.org($|\/)/,
];

function getIsWhitelisted(src) {
  return !src || (
    URL_VALID_CHARACTERS_REGEX.test(src) &&
    urlWhitelist.reduce(
      (acc, val) => acc || val.test(src),
      false
    )
  );
}



export const render = new DevFunction(
  "Img.render", {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    validateThisValJSXInstance(thisVal, callerNode, execEnv);
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {src = "", alt} = props;
    verifyTypes(
      [src, alt], ["string", "string?"], callerNode, execEnv
    );

    // Check whether the src is whitelisted.
    let isWhiteListed = getIsWhitelisted(src);

    // Create the DOM node if it has no been so already.
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode;
    if (!domNode || domNode.tagName !== "IMG") {
      domNode = document.createElement("img");
    }
    else {
      clearAttributes(domNode);
    }
    domNode.setAttribute(
      "class", "img_0" + (isWhiteListed ? "" : " invalid_0")
    );
    if (src) {
      if (isWhiteListed) domNode.setAttribute("src", src);
      else domNode.setAttribute("data-src", src);
    }
    if (alt !== undefined) domNode.setAttribute("alt", alt);

    return new DOMNodeObject(domNode, [domNode]);
  }
);

