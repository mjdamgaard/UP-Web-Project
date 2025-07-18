
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

export const USER_ID_FLAG = Symbol("user-ID");


export const REQUESTING_SMF_ROUTE_FLAG = Symbol("requesting-SMF-route");
export const CURRENT_SMF_ROUTE_FLAG = Symbol("current-SMF-route");
export const REQUESTING_COMPONENT_FLAG = Symbol("requesting-component");
export const CLIENT_TRUST_FLAG = Symbol("client-trust");


export function checkRequestOrigin(routeRegExArr, node, env) {
  // TODO: Implement.
}

