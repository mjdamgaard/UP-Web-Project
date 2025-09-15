
import {
  DevFunction, forEachValue,
} from "../../interpreting/ScriptInterpreter.js";



export const forEach = new DevFunction(
  "forEach", {typeArr: ["any", "function"]},
  ({callerNode, execEnv, interpreter}, [obj, fun]) => {
    forEachValue(obj, callerNode, execEnv, (val, ind) => {
      interpreter.executeFunction(
        fun, [val, ind], callerNode, execEnv
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
