
import {DevFunction} from "../../interpreting/ScriptInterpreter.js";

export const now = new DevFunction(
  "now", {}, () => {
    return Date.now();
  }
);