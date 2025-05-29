import {DevFunction} from "../interpreting/ScriptInterpreter";
import {IS_APP_ROOT_FLAG} from "./jsx_components";


// export const NO_STATE_CHANGE_FLAG = Symbol("no-state-change");

// export const MIGHT_CHANGE_STATE_SIGNAL = new Signal(
//   "might-change-state",
//   function(flagEnv, node, env) {
//     let [wasFound] = flagEnv.getFlag(NO_STATE_CHANGE_FLAG);
//     if (wasFound ) throw new RuntimeError(
//       "Cannot call a stateful function from here",
//       node, env
//     );
//   }
// );

export const getStyle = new DevFunction(
  {},
  ({callerNode, execEnv, interpreter}, [componentPath, liveModule]) => {
    let isAppRoot = execEnv.getFlag(IS_APP_ROOT_FLAG, 0);
    let isTrusted = isAppRoot;
    let styleSheetPaths = liveModule.get("styleSheetPaths");
    styleSheetPaths = "...";
    let classTransform = false;
    let styleSpecs = "...";
    return styleSpecs;
  },
);