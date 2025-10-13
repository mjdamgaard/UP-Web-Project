
import {
  DevFunction, forEachValue, mapValues,
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