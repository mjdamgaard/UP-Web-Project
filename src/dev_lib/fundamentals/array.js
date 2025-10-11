
import {
  DevFunction, forEachValue, ObjectObject, getString, mapValues, verifyType,
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
  "map", {typeArr: ["any", "function"]},
  ({callerNode, execEnv, interpreter}, [arr, fun]) => {
    return mapValues(arr, callerNode, execEnv, (val, ind) => {
      return interpreter.executeFunction(
        fun, [val, ind], callerNode, execEnv
      );
    });
  }
);

export const reduce = new DevFunction(
  "reduce", {typeArr: ["array", "function", "any?"]},
  ({callerNode, execEnv, interpreter}, [arr, fun, initVal]) => {
    if (arr instanceof ObjectObject) arr = arr.members;
    return arr.reduce(
      (acc, val, ind) => {
        return interpreter.executeFunction(
          fun, [acc, val, ind], callerNode, execEnv
        );
      },
      initVal
    );
  }
);

export const forEach = new DevFunction(
  "forEach", {typeArr: ["any", "function"]},
  ({callerNode, execEnv, interpreter}, [arr, fun]) => {
    forEachValue(arr, callerNode, execEnv, (val, ind) => {
      interpreter.executeFunction(
        fun, [val, ind], callerNode, execEnv
      );
    });
  }
);

export const some = new DevFunction(
  "some", {typeArr: ["any", "function"]},
  ({callerNode, execEnv, interpreter}, [arr, fun]) => {
    let stop = false;
    forEachValue(arr, callerNode, execEnv, (val, ind) => {
      if (stop) return;
      stop = interpreter.executeFunction(
        fun, [val, ind], callerNode, execEnv
      );
    });
  }
);

export const join = new DevFunction(
  "join", {typeArr: ["array", "string?"]},
  ({callerNode, execEnv}, [arr, delimiter]) => {
    if (arr instanceof ObjectObject) arr = arr.members;
    return arr.map(val => getString(val, callerNode, execEnv)).join(delimiter);
  }
);

export const concat = new DevFunction(
  "concat", {typeArr: ["array"]},
  ({callerNode, execEnv}, [arr, ...arrays]) => {
    if (arr instanceof ObjectObject) arr = arr.members;
    arrays = arrays.map(arr => {
      verifyType(arr, "array", false, callerNode, execEnv);
      return (arr instanceof ObjectObject) ? arr.members : arr;
    });
    return arr.concat(...arrays);
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