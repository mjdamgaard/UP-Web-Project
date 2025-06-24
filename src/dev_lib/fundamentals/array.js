
import {DevFunction} from "../../interpreting/ScriptInterpreter.js";


export const at = new DevFunction(
  {typeArr: ["array", "integer"]}, ({}, [arr, ind]) => {
    return arr.at(ind);
  }
);

export const slice = new DevFunction(
  {typeArr: ["array", "integer", "integer?"]}, ({}, [arr, start, end]) => {
    return arr.slice(start, end);
  }
);

export const map = new DevFunction(
  {typeArr: ["array", "function"]},
  ({callerNode, execEnv, interpreter}, [arr, fun]) => {
    return arr.map((val, ind, arr) => {
      interpreter.executeFunction(
        fun, [val, ind, arr], callerNode, execEnv
      );
    });
  }
);

export const indexOf = new DevFunction(
  {typeArr: ["string", "string"]}, ({}, [str, needle]) => {
    return str.indexOf(needle);
  }
);

// TODO: Continue.