
import {
  DevFunction, forEachValue, mapValues, ObjectObject, verifyType,
} from "../../interpreting/ScriptInterpreter.js";



export const forEach = new DevFunction(
  "forEach", {typeArr: ["any", "function"]},
  ({callerNode, execEnv, interpreter}, [obj, callback]) => {
    forEachValue(obj, callerNode, execEnv, (val, ind) => {
      interpreter.executeFunction(
        callback, [val, ind], callerNode, execEnv
      );
    });
  }
);

export const entries = new DevFunction(
  "entries", {typeArr: ["any"]}, ({callerNode, execEnv}, [obj]) => {
    let ret = [];
    let ind = 0;
    forEachValue(obj, callerNode, execEnv, (val, key) => {
      ret[ind] = [key, val];
      ind++;
    });
    return ret;
  }
);

export const keys = new DevFunction(
  "keys", {typeArr: ["any"]}, ({callerNode, execEnv}, [obj]) => {
    let ret = [];
    let ind = 0;
    forEachValue(obj, callerNode, execEnv, (_val, key) => {
      ret[ind] = key;
      ind++;
    });
    return ret;
  }
);

export const values = new DevFunction(
  "values", {typeArr: ["any"]}, ({callerNode, execEnv}, [obj]) => {
    let ret = [];
    let ind = 0;
    forEachValue(obj, callerNode, execEnv, val => {
      ret[ind] = val;
      ind++;
    });
    return ret;
  }
);



export const fromEntries = new DevFunction(
  "fromEntries", {typeArr: ["array"]}, ({callerNode, execEnv}, [arr]) => {
    let ret = {};
    forEachValue(arr, callerNode, execEnv, (entry) => {
      verifyType(entry, "array", false, callerNode, execEnv);
      if (entry instanceof ObjectObject) entry = entry.members;
      let key = entry[0];
      verifyType(key, "object key", false, callerNode, execEnv);
      ret[key] = entry[1];
    });
    return ret;
  }
);



export const mapToArray = new DevFunction(
  "mapToArray", {typeArr: ["any", "function"]},
  ({callerNode, execEnv, interpreter}, [obj, callback]) => {
    return mapValues(obj, callerNode, execEnv, (val, key, ind) => {
      return interpreter.executeFunction(
        callback, [val, key, ind], callerNode, execEnv
      );
    });
  }
);