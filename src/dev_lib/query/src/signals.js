
import {Signal, RuntimeError} from "../../../interpreting/ScriptInterpreter.js";


export const ELEVATED_PRIVILEGES_FLAG = Symbol("elevated-privileges");

export const SET_ELEVATED_PRIVILEGES_SIGNAL = new Signal(
  "set-elevated-privileges",
  function(flagEnv, _node, _env, homeDirID) {
    flagEnv.setFlag(ELEVATED_PRIVILEGES_FLAG, homeDirID);
  }
);

export const CHECK_ELEVATED_PRIVILEGES_SIGNAL = new Signal(
  "check-elevated-privileges",
  function(flagEnv, node, env, homeDirID) {
    let [wasFound, prevHomeDirID] = flagEnv.getFlag(ELEVATED_PRIVILEGES_FLAG);
    if (!wasFound || prevHomeDirID !== homeDirID) throw new RuntimeError(
      `Requested admin privileges on Directory ${homeDirID} not granted`,
      node, env
    );
  }
);



export const CAN_POST_FLAG = Symbol("can-post-privileges");

export const SET_CAN_POST_SIGNAL = new Signal(
  "set-can-post-privileges",
  function(flagEnv, _node, _env) {
    flagEnv.setFlag(CAN_POST_FLAG);
  }
);

export const CHECK_CAN_POST_SIGNAL = new Signal(
  "check-can-post-privileges",
  function(flagEnv, node, env) {
    let [wasFound] = flagEnv.getFlag(CAN_POST_FLAG);
    if (!wasFound) throw new RuntimeError(
      `Cannot post from here`,
      node, env
    );
  }
);


export const CURRENT_CORS_ORIGIN_FLAG = Symbol("current-CORS-origin");

export const SET_CURRENT_CORS_ORIGIN_SIGNAL = new Signal(
  "set-current-CORS-origin",
  function(flagEnv, _node, _env, route) {
    flagEnv.setFlag(CURRENT_CORS_ORIGIN_FLAG, route);
  }
);

export const CHECK_CORS_ORIGIN_SIGNAL = new Signal(
  "check-CORS-origin",
  function(flagEnv, node, env, routeRegExArr) {
    // TODO: Implement.
  }
);

