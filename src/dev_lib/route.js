
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


export const getHomePath = new DevFunction(
  "getHomePath", {typeArr: ["string"]}, (_, [route]) => {
    let [ , homePath] = /^(\/[^/]*\/[^/]*)/.exec(route) ?? [];
  },
);

export const getHomeDirID = new DevFunction(
  "getHomeDirID", {typeArr: ["string"]}, (_, [route]) => {
    let [ , homeDirID] = /^\/[^/]*\/([^/]*)/.exec(route) ?? [];
  },
);

export const getNodeID = new DevFunction(
  "getNodeID", {typeArr: ["string"]}, (_, [route]) => {
    let [ , nodeID] = /^\/([^/]*)\/[^/]*/.exec(route) ?? [];
  },
);

export const getNodeAndHomeDirID = new DevFunction(
  "getNodeID", {typeArr: ["string"]}, (_, [route]) => {
    let [ , nodeID, homeDirID] = /^\/([^/]*)\/([^/]*)/.exec(route) ?? [];
    return [nodeID, homeDirID];
  },
);