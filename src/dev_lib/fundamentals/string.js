
import {DevFunction} from "../../interpreting/ScriptInterpreter.js";


export const at = new DevFunction(
  "at", {typeArr: ["string", "integer"]}, ({}, [str, ind]) => {
    return str.at(ind);
  }
);

export const slice = new DevFunction(
  "slice", {typeArr: ["string", "integer", "integer?"]}, ({}, [str, start, end]) => {
    return str.slice(start, end);
  }
);

export const indexOf = new DevFunction(
  "indexOf", {typeArr: ["string", "string"]}, ({}, [str, needle]) => {
    return str.indexOf(needle);
  }
);

// TODO: Continue implementing all other standard String methods, except RegEx-
// related ones, since RegExes should only be implemented at a later point and
// in another dev lib, where we then need to make sure to prevent exponential
// runtimes (and to calculate/estimate a fitting compGas cost).