
import {Signal, RuntimeError} from "../../../interpreting/ScriptInterpreter.js";


export const ELEVATED_PRIVILEGES_FLAG = Symbol("elevated_privileges");

export const SET_ELEVATED_PRIVILEGES_SIGNAL = new Signal(
  "set_elevated_privileges",
  function(flagEnv, _1, _2, homeDirID) {
    flagEnv.setFlag(ELEVATED_PRIVILEGES_FLAG, homeDirID);
  }
);

export const CHECK_ELEVATED_PRIVILEGES_SIGNAL = new Signal(
  "check_elevated_privileges",
  function(flagEnv, node, env, homeDirID) {
    let [wasFound, prevHomeDirID] = flagEnv.getFlag(ELEVATED_PRIVILEGES_FLAG);
    if (!wasFound || prevHomeDirID !== homeDirID) throw new RuntimeError(
      `Requested admin privileges on Directory ${homeDirID} not granted`,
      node, env
    );
    flagEnv.setFlag(ELEVATED_PRIVILEGES_FLAG, homeDirID);
  }
);

