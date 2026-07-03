
import {
  DevFunction, getAbsolutePath as _getAbsolutePath,
} from '../interpreting/ScriptInterpreter.js';


export const getAbsolutePath = new DevFunction(
  "getAbsolutePath", {typeArr: ["string", "string"]},
  ({callerNode, execEnv}, [curPath, path]) => {
    return _getAbsolutePath(curPath, path, callerNode, execEnv);
  },
);



const firstSegmentRegEx = /^\/?([^/]*)(\/|$)/;
const firstSegmentAndTailRegEx = /^\/?([^/]*)((\/[\s\S]*)?)$/;

export const getFirstSegment = new DevFunction(
  "getFirstSegment", {typeArr: ["string"]}, ({}, [path]) => {
    let [ , firstSegment] = firstSegmentRegEx.exec(firstSegmentRegEx);
    return firstSegment;
  },
);

export const getFirstSegmentAndTail = new DevFunction(
  "getFirstSegmentAndTail", {typeArr: ["string"]}, ({}, [path]) => {
    let [ , firstSegment, tail] =
      firstSegmentAndTailRegEx.exec(firstSegmentRegEx);
    return [firstSegment, tail];
  },
);