
import {Signal, RuntimeError} from "../../../interpreting/ScriptInterpreter.js";


export const ADMIN_PRIVILEGES_FLAG = Symbol("admin-privileges");

export const CHECK_ADMIN_PRIVILEGES_SIGNAL = new Signal(
  "check-admin-privileges",
  function(flagEnv, node, env, homeDirID) {
    let [wasFound, prevHomeDirID] = flagEnv.getFlag(ADMIN_PRIVILEGES_FLAG);
    if (!wasFound || prevHomeDirID !== homeDirID) throw new RuntimeError(
      `Requested admin privileges on Directory ${homeDirID} not granted`,
      node, env
    );
  }
);



export const CAN_POST_FLAG = Symbol("can-post-privileges");

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


export const REQUEST_ORIGIN_FLAG = Symbol("request-origin");

export const CHECK_CORS_ORIGIN_SIGNAL = new Signal(
  "check-request-origin",
  function(flagEnv, node, env, routeRegExArr) {
    // TODO: Implement.
  }
);

