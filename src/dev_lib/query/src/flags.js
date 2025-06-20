
import {RuntimeError} from "../../../interpreting/ScriptInterpreter.js";

export const ADMIN_PRIVILEGES_FLAG = Symbol("admin-privileges");

export function checkAdminPrivileges(homeDirID, node, env) {
  let curHomeDirID = env.getFlag(ADMIN_PRIVILEGES_FLAG);
  if (!curHomeDirID || curHomeDirID !== homeDirID) throw new RuntimeError(
    `Requested admin privileges on Directory ${homeDirID} not granted`,
    node, env
  );
}


export const CAN_POST_FLAG = Symbol("can-post-privileges");

export function checkIfCanPost(node, env) {
  let canPost = env.getFlag(CAN_POST_FLAG);
  if (!canPost) throw new RuntimeError(
    "Cannot post from here",
    node, env
  );
}


export const REQUEST_ORIGIN_FLAG = Symbol("request-origin");
export const CURRENT_MODULE_FLAG = Symbol("current-module");
export const CLIENT_TRUST_FLAG = Symbol("client-trust");


export function checkRequestOrigin(routeRegExArr, node, env) {
  // TODO: Implement.
}

