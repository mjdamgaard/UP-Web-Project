
import {
  DevFunction, ObjectObject, verifyTypes, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, validateJSXInstanceAndGetDOMNode, validateJSXInstance,
} from "../jsx_components.js";


// TODO: Call a method from the SettingsObject instead in order to get the
// URL whitelist, which then allows it to be user-dependent.
// And in the meantime, a todo is also to expand the list below.

const URL_VALID_CHARACTERS_REGEX =
  /^https:\/(\/([.~a-zA-Z0-9_\-?=:]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+)+$/;

const urlWhitelist = [
  /^https:\/\/en\.wikipedia\.org($|\/)/,
  /^\/assets\/.+$/,
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
    if (props instanceof ObjectObject) {
      props = props.members;
    }
    let {className, src = "", alt} = props;
    verifyTypes(
      [src, alt], ["string", "string?"], callerNode, execEnv
    );

    // Check whether the src is whitelisted.
    let isWhiteListed = getIsWhitelisted(src);

    if (!isWhiteListed) className = !className ? "invalid" :
      getString(className, callerNode, execEnv) + " invalid";
    let domNode = validateJSXInstanceAndGetDOMNode(
      thisVal, "Img", "img", className, callerNode, execEnv
    );
    if (src) {
      if (isWhiteListed) domNode.setAttribute("src", src);
      else domNode.setAttribute("data-src", src);
    }
    if (alt !== undefined) domNode.setAttribute("alt", alt);

    return new DOMNodeObject(domNode);
  }
);

