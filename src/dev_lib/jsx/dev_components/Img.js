
import {
  DevFunction, ObjectObject, verifyTypes, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  DOMNodeObject, validateJSXInstanceAndGetDOMNode, validateJSXInstance,
  checkPathPermission,
} from "../jsx_components.js";
import {CLIENT_PERMISSIONS_FLAG} from "../../query/src/flags.js";



const URL_VALID_CHARACTERS_REGEX =
  /^https:\/(\/([.~a-zA-Z0-9_\-?=:#()\[\]]|%(2[0-9A-CF]|3[A-F]|[46]0|5[B-E]|7[B-E]))+)+\/?$/;


function getIsAllowed(src, node, env) {
  if (!src) return true;
  if (!URL_VALID_CHARACTERS_REGEX.test(src)) return false;
  let permissions = env.getFlag(CLIENT_PERMISSIONS_FLAG);
  return checkPathPermission(permissions, "imageFrom", src, node, env);
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

    // Check whether the src is allowed.
    let isAllowed = getIsAllowed(src, callerNode, execEnv);

    if (!isAllowed) className = !className ? "invalid" :
      getString(className, callerNode, execEnv) + " invalid";
    let domNode = validateJSXInstanceAndGetDOMNode(
      thisVal, "Img", "img", className, callerNode, execEnv
    );
    if (src) {
      if (isAllowed) domNode.setAttribute("src", src);
      else domNode.setAttribute("data-src", src);
    }
    if (alt !== undefined) domNode.setAttribute("alt", alt);

    return new DOMNodeObject(domNode);
  }
);



export const methods = [
  "getIsAllowed",
];

export const actions = {
  "getIsAllowed": new DevFunction(
    "getIsAllowed", {}, function({thisVal, callerNode, execEnv}, []) {
      validateJSXInstance(thisVal, "Img", callerNode, execEnv);
      let {href} = thisVal.jsxInstance.props;
      return getIsAllowed(href, callerNode, execEnv);
    }
  ),
};