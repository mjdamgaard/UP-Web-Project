
import {RuntimeError} from "../../../interpreting/ScriptInterpreter.js";

export const ELEVATED_PRIVILEGES_FLAG = Symbol("elevated-privileges");

export function checkElevatedPrivileges(homeDirID, node, env) {
  let curHomeDirID = env.getFlag(ELEVATED_PRIVILEGES_FLAG);
  if (!curHomeDirID || curHomeDirID !== homeDirID) throw new RuntimeError(
    `Requested elevated privileges on Directory ${homeDirID} not granted`,
    node, env
  );
}

export const REQUEST_ADMIN_PRIVILEGES_FLAG = Symbol("request-admin-privileges");
export const GRANT_ADMIN_PRIVILEGES_FLAG = Symbol("grant-admin-privileges");
export const ADMIN_PRIVILEGES_FLAG = Symbol("admin-privileges");


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

