
import {
  DevFunction, getAbsolutePath as _getAbsolutePath,
} from '../interpreting/ScriptInterpreter.js';


export const getAbsolutePath = new DevFunction(
  "getAbsolutePath", {typeArr: ["string", "string"]},
  ({callerNode, execEnv}, [curPath, path]) => {
    return _getAbsolutePath(curPath, path, callerNode, execEnv);
  },
);
