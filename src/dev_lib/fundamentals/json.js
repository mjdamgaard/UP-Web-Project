
import {
  DevFunction, jsonStringify, ArgTypeError
} from "../../interpreting/ScriptInterpreter.js";


// TODO: Implement a receiver argument as well.

export const stringify = new DevFunction("stringify", {}, ({}, [val]) => {
    return jsonStringify(val);
  }
);

export const parse = new DevFunction(
  "parse", {typeArr: ["string"]}, ({callerNode, execEnv}, [val]) => {
    try {
      return JSON.parse(val);
    } catch (_) {
      throw new ArgTypeError(
        "Invalid JSON",
        callerNode, execEnv
      );
    }
  }
);
