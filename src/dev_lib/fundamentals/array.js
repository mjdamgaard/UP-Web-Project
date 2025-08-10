
import {
  DevFunction, forEachValue, ObjectObject,
} from "../../interpreting/ScriptInterpreter.js";


export const at = new DevFunction(
  "at", {typeArr: ["array", "integer"]}, ({}, [arr, ind]) => {
    if (arr instanceof ObjectObject) arr = arr.members;
    return arr.at(ind);
  }
);

export const slice = new DevFunction(
  "slice", {typeArr: ["array", "integer", "integer?"]},
  ({}, [arr, start, end]) => {
    if (arr instanceof ObjectObject) arr = arr.members;
    return arr.slice(start, end);
  }
);

export const map = new DevFunction(
  "map", {typeArr: ["array", "function"]},
  ({callerNode, execEnv, interpreter}, [arr, fun]) => {
    if (arr instanceof ObjectObject) arr = arr.members;
    return arr.map((val, ind) => {
      return interpreter.executeFunction(
        fun, [val, ind], callerNode, execEnv
      );
    });
  }
);

export const forEach = new DevFunction(
  "forEach", {typeArr: ["array", "function"]},
  ({callerNode, execEnv, interpreter}, [arr, fun]) => {
    forEachValue(arr, callerNode, execEnv, (val, ind) => {
      interpreter.executeFunction(
        fun, [val, ind], callerNode, execEnv
      );
    });
  }
);

// export const indexOf = new DevFunction(
//   "indexOf", {typeArr: ["string", "string"]}, ({}, [str, needle]) => {
//     return str.indexOf(needle);
//   }
// );

// TODO: Continue.




export const createArray = new DevFunction(
  "createArray", {typeArr: ["integer unsigned", "function?"]},
  ({callerNode, execEnv, interpreter}, [length, callback]) => {
    let ret = new Array(length).fill(undefined);
    return (callback) ? ret.map((_, ind, arr) => {
      return interpreter.executeFunction(
        callback, [ind, arr], callerNode, execEnv
      );
    }) : ret;
  }
);