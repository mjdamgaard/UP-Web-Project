
import {parseRoute as _parseRoute} from './query/src/route_parsing.js';
import {DevFunction, ArgTypeError, getAbsolutePath as _getAbsolutePath} from
  '../interpreting/ScriptInterpreter.js';



export const parseRoute = new DevFunction(
  "parseRoute", {typeArr: ["string"]},
  ({callerNode, execEnv}, [route]) => {
    try {
      return _parseRoute(route);
    }
    catch (msg) {
      throw new ArgTypeError(msg, callerNode, execEnv);

    }
  },
);


export const isTextFileExtension = new DevFunction(
  "isTextFileExtension", {typeArr: ["string"]}, ({}, [fileExt]) => {
    return /^(.+\.)?(jsx?|mjs|txt|json|html|xml|svg|md|css)$/.test(fileExt);
  },
);



export const getAbsolutePath = new DevFunction(
  "getAbsolutePath", {typeArr: ["string", "string"]},
  ({callerNode, execEnv}, [curPath, path]) => {
    return _getAbsolutePath(curPath, path, callerNode, execEnv);
  },
);