
import {
  DevFunction, jsonStringify
} from "../../interpreting/ScriptInterpreter.js";


// TODO: Implement a receiver argument as well.

export const stringify = new DevFunction({}, ({}, [val]) => {
    return jsonStringify(val);
  }
);

export const parse = new DevFunction({}, ({}, [val]) => {
    return JSON.parse(val ?? null);
  }
);
