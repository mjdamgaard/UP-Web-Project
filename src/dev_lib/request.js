
import {
  DevFunction, NetworkError, getValueForFirstMatchingPath, forEachValue,
  getPropertyFromObject, jsonStringify,
} from '../interpreting/ScriptInterpreter.js';
import {
  CLIENT_PERMISSIONS_FLAG, USER_ID_FLAG, ADMIN_PRIVILEGES_FLAG, CAN_POST_FLAG,
  REQUESTING_SMF_ROUTE_FLAG,
} from './query/src/flags.js';



export const checkRequestOrigin = new DevFunction(
  "checkRequestOrigin", {typeArr: ["boolean", "array?"]},
  function({callerNode, execEnv}, [canForce, whitelist = []]) {
    let clientPermissions = execEnv.getFlag(CLIENT_PERMISSIONS_FLAG);

    // If canForce is true, check if the client trusts the request to be forced
    // through this CORS-like check.
    if (canForce && clientPermissions) {
      // Get the client permissions object and the "can-post" flag, and check
      // either the "read" or the "write" permissions property depending the
      // "can-post" flag. Or if permissions simply equals "all", let the check
      // succeed regardless.
      if (clientPermissions === "all") {
        return;
      }
      let canPost = execEnv.getFlag(CAN_POST_FLAG);
      let permissionsPropName = canPost ? "write" : "read";
      let permissionProp = getPropertyFromObject(
        clientPermissions, permissionsPropName, callerNode, execEnv
      );
      let {modulePath} = execEnv.getModuleEnv();
      let isAllowed = getValueForFirstMatchingPath(
        permissionProp, modulePath, callerNode, execEnv, true
      );
      if (isAllowed) {
        return;
      }
    }

    // Else if the request originated from another SMF, check if that the given
    // SM is whitelisted.
    let isAllowed;
    let requestingSMFRoute = execEnv.getFlag(REQUESTING_SMF_ROUTE_FLAG);
    let requestingComponentsProp;
    if (requestingSMFRoute) {
      isAllowed = getValueForFirstMatchingPath(
        whitelist, requestingSMFRoute, callerNode, execEnv, true
      );

    }

    // Else check if any of the requestOrigins from the client permissions
    // matches matches a path in the whitelist.
    else if (clientPermissions) {
      requestingComponentsProp = getPropertyFromObject(
        clientPermissions, "requestingComponents", callerNode, execEnv
      );
      if (requestingComponentsProp === "all") {
        isAllowed = true;
      }
      else {
        forEachValue(
          requestingComponentsProp, callerNode, execEnv,
          (requestingComponentPath) => {
            if (isAllowed) return;
            isAllowed = getValueForFirstMatchingPath(
              whitelist, requestingComponentPath, callerNode, execEnv, true
            );
          }, true
        );
      }
    }
    
    // Throw if the request origin was not accepted.
    if (!isAllowed) throw new NetworkError(
      "Request origin not allowed: " +
      (requestingSMFRoute || jsonStringify(requestingComponentsProp)),
      callerNode, execEnv
    );
  }
);


export const checkAdminPrivileges = new DevFunction(
  "checkAdminPrivileges", {}, function({callerNode, execEnv}, []) {
    if (!execEnv.getFlag(ADMIN_PRIVILEGES_FLAG)) throw new NetworkError(
      "Admin privileges required for this request",
      callerNode, execEnv
    );
  }
);



// export const getRequestOrigin = new DevFunction(
//   "getRequestOrigin", {}, function({execEnv}, []) {
//     return execEnv.getFlag(REQUESTING_SMF_ROUTE_FLAG) ??
//       execEnv.getFlag(REQUESTING_COMPONENT_FLAG);
//   }
// );



export const getRequestingUserID = new DevFunction(
  "getRequestingUserID", {},
  function({execEnv}, []) {
    return execEnv.getFlag(USER_ID_FLAG); 
  }
);


// TODO: Implement a setPermissions() function to reduce the permissions, not
// least the "client permissions" object. Do this here and/or in query.js.

