
import {DevFunction, getString} from "../../interpreting/ScriptInterpreter.js";



export const toString = new DevFunction(
  "toString", {typeArr: ["any?"]}, ({callerNode, execEnv}, [val]) => {
    return getString(val, callerNode, execEnv);
  }
);

export const at = new DevFunction(
  "at", {typeArr: ["string", "integer"]}, ({}, [str, ind]) => {
    return str.at(ind);
  }
);

export const substring = new DevFunction(
  "substring", {typeArr: ["string", "integer", "integer?"]},
  ({}, [str, start, end]) => {
    return str.substring(start, end);
  }
);

export const slice = new DevFunction(
  "slice", {typeArr: ["string", "integer", "integer?"]},
  ({}, [str, start, end]) => {
    return str.slice(start, end);
  }
);

export const indexOf = new DevFunction(
  "indexOf", {typeArr: ["string", "string", "integer?"]},
  ({}, [str, needle, position]) => {
    return str.indexOf(needle, position);
  }
);

export const split = new DevFunction(
  "split", {typeArr: ["string", "string", "integer unsigned?"]},
  ({}, [str, separator, limit]) => {
    return str.split(separator, limit);
  }
);

// TODO: Continue implementing all other standard String methods, except RegEx-
// related ones, since RegExes should only be implemented at a later point and
// in another dev lib, where we then need to make sure to prevent exponential
// runtimes (and to calculate/estimate a fitting compGas cost).