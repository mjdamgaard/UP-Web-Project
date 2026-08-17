
import {
  DevFunction, forEachValue, ObjectObject, getString, mapValues, verifyType,
  MAX_ARRAY_INDEX, RuntimeError,
} from "../../interpreting/ScriptInterpreter.js";
export {toString} from "./string.js";


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

// TODO: Decrement comp. gas according to length in map() and similar functions.

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
    let found = false;
    forEachValue(arr, callerNode, execEnv, (val, ind) => {
      if (found) return;
      found = interpreter.executeFunction(
        fun, [val, ind], callerNode, execEnv
      );
    });
    return found;
  }
);

export const every = new DevFunction(
  "every", {typeArr: ["any", "function"]},
  ({callerNode, execEnv, interpreter}, [arr, fun]) => {
    let found = false;
    forEachValue(arr, callerNode, execEnv, (val, ind) => {
      if (found) return;
      found = !interpreter.executeFunction(
        fun, [val, ind], callerNode, execEnv
      );
    });
    return !found;
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

export const includes = new DevFunction(
  "includes", {typeArr: ["array", "any?", "integer unsigned?"]},
  ({}, [arr, searchElement, fromIndex]) => {
    if (arr instanceof ObjectObject) arr = arr.members;
    return arr.includes(searchElement, fromIndex);
  }
);

export const indexOf = new DevFunction(
  "indexOf", {typeArr: ["array", "any?", "integer unsigned?"]},
  ({}, [arr, searchElement, fromIndex]) => {
    if (arr instanceof ObjectObject) arr = arr.members;
    return arr.indexOf(searchElement, fromIndex);
  }
);

export const filter = new DevFunction(
  "filter", {typeArr: ["any", "function"]},
  ({callerNode, execEnv, interpreter}, [arr, fun]) => {
    let ret = [];
    forEachValue(arr, callerNode, execEnv, (val, ind) => {
      if (
        interpreter.executeFunction(fun, [val, ind], callerNode, execEnv)
      ) {
        ret.push(val);
      }
    });
    return ret;
  }
);


export const push = new DevFunction(
  "push", {typeArr: ["array", "any?"]},
  ({callerNode, execEnv}, [arr, val]) => {
    if (arr instanceof ObjectObject && arr.isMutable) {
      if (arr.members.length - 1 >= MAX_ARRAY_INDEX) throw new RuntimeError(
        "Array.push(): Array length exceeded the maximum value",
        callerNode, execEnv
      );
      arr.members.push(val);
    }
    else throw new RuntimeError(
      "Trying to push value to an immutable array",
      callerNode, execEnv
    );
  }
);

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

// TODO: Add createMutableArray function.