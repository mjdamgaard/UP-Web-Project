
import {FunctionObject, DevFunction} from "../../../interpreting/ScriptInterpreter.js";
import {DOMNodeObject} from "../jsx_components.js";


export const render = new DevFunction(
  {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal: jsxInstance},
    [props = {}]
  ) {
    let domNode = document.createElement("textarea");
    let onChangeFun = props.onChange;
    if (onChangeFun instanceof FunctionObject) {
      domNode.oninput = () => {
        interpreter.executeFunction(
          onChangeFun, [], callerNode, execEnv, jsxInstance,
        );
      };
    }
    return new DOMNodeObject(domNode);
  }
);


export const methods = {
  "getValue": new DevFunction(
    {},
    function({thisVal: jsxInstance}, []) {
      return jsxInstance.domNode.value;
    }
  ),
};