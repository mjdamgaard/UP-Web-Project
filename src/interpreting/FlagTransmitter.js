
import {
  CLIENT_PERMISSIONS_FLAG, REQUEST_ADMIN_PRIVILEGES_FLAG,
} from "../dev_lib/query/src/flags.js";
import {jsonParse, jsonStringify} from "./ScriptInterpreter.js";




export class FlagTransmitter {

  static getTransmittedFlags(environment) {
    let ret = {};

    // Transmit the "request-admin-privileges" flag if the user is the admin
    // and wants to elevate their privileges for the request.
    let reqAdminPriv = environment.getFlag(REQUEST_ADMIN_PRIVILEGES_FLAG);
    if (reqAdminPriv) ret["request-admin-privileges"] = "true";

    // Transmit the "client-permissions" flag (holding an object that includes
    // permissions such as "read" and "write", which allows the client to
    // override the checkRequestOrigin() checks in a server module).
    let clientPermissions = environment.getFlag(CLIENT_PERMISSIONS_FLAG);
    if (clientPermissions) {
      ret["client-permissions"] =
        encodeURIComponent(jsonStringify(clientPermissions));
    }

    return ret;
  }


  static receiveFlags(flags) {
    let ret = [];

    // The "request-admin-privileges" flag is transmitted.
    let reqAdminPriv = flags["request-admin-privileges"];
    if (reqAdminPriv) ret.push(REQUEST_ADMIN_PRIVILEGES_FLAG);

    // And the CLIENT_PERMISSIONS_FLAG flag if transmitted.
    let clientPermissions = flags["client-permissions"];
    if (clientPermissions) {
      clientPermissions = jsonParse(decodeURIComponent(clientPermissions));
      ret.push([CLIENT_PERMISSIONS_FLAG, clientPermissions]);
    }

    return ret;
  }
}