
import {
  FunctionObject, DevFunction, getString,
} from "../../../interpreting/ScriptInterpreter.js";
import {DOMNodeObject} from "../jsx_components.js";


export const render = new DevFunction(
  {typeArr: ["object?"]},
  function(
    {callerNode, execEnv, interpreter, thisVal},
    [props = {}]
  ) {
    let jsxInstance = thisVal.jsxInstance;
    let domNode = jsxInstance.domNode ?? document.createElement("div");

    // Add URL-related data to props in a 'location' prop, and also add a
    // callback function to props.refs to push an entry to the browser session
    // history stack.
    let {hostname, pathname, search, hash} = window.location;
    props = {
      location: {
        hostname: hostname, pathname: pathname, search: search, hash: hash,
        state: history.state,
      },
      ...props
    };
    let pushState = new DevFunction(
      {typeArr:["string", "object?"]},
      ({callerNode, execEnv}, [path, state]) => {
        let {protocol, host, pathname} = window.location;
        let newPath = getFullPath(pathname, path, callerNode, execEnv);
        // TODO: Validate newPath!
        let newFullURL = protocol + '//' + host + newPath;
        history.pushState(state, undefined, newFullURL);
        rootInstance.changePropsAndRerender()
      }
    );
    let refs = props.refs;
    refs = getPrototypeOf(refs) === OBJECT_PROTOTYPE ? refs : {};
    props.refs = {pushState, ...refs};
  }
);



export const methods = {
  "getValue": new DevFunction({}, function({thisVal}, []) {
    return thisVal.jsxInstance.domNode.value;
  }),
};