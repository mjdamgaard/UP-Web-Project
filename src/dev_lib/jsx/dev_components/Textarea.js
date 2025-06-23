
import {FunctionObject, DevFunction} from "../../../interpreting/ScriptInterpreter.js";
import {DOMNodeObject} from "../jsx_components.js";


export const render = new DevFunction(
  {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode ?? document.createElement("textarea");
    let onChangeFun = props.onChange;
    if (onChangeFun instanceof FunctionObject) {
      domNode.oninput = () => {
        interpreter.executeFunction(
          onChangeFun, [], callerNode, execEnv, thisVal,
        );
        domNode.focus();
        domNode.setAttribute("autofocus", "");
        setTimeout(() => {
          domNode.focus();
          domNode.removeAttribute("autofocus");
        }, 0);
      };
    }
    return new DOMNodeObject(domNode);
  }
);


// export const getInitState = new DevFunction(
//   {typeArr: ["object?"]}, function(
//     {}, [props = {}]
//   ) {
//     return {focus: props.autoFocus ? true : false}
//   }
// );


export const methods = {
  "getValue": new DevFunction(
    {},
    function({thisVal: jsxInstance}, []) {
      return jsxInstance.domNode.value;
    }
  ),
};