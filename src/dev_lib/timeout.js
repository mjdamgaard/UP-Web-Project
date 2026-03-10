
import {DevFunction, ArgTypeError} from '../interpreting/ScriptInterpreter.js';



export const setTimeout = new DevFunction(
  "setTimeout", {typeArr: ["integer unsigned", "function?"]},
  ({callerNode, execEnv}, [delay, callback]) => {
    // TODO: Implement.
  },
);