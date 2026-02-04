
import {
  REQUESTING_COMPONENT_FLAG, CLIENT_TRUST_FLAG, REQUEST_ADMIN_PRIVILEGES_FLAG,
} from "../dev_lib/query/src/flags.js";

const SM_EXT_REGEX = /\.sm\.js/;



export class FlagTransmitter {

  static getTransmittedFlags(environment) {
    let ret = {};

    // Transmit the "request-admin-privileges" flag if the user is the admin
    // and wants to elevate their privileges for the request.
    let reqAdminPriv = environment.getFlag(REQUEST_ADMIN_PRIVILEGES_FLAG);
    if (reqAdminPriv) ret["request-admin-privileges"] = true;

    // Transmit the "requesting-component" flag (holding the route of the last
    // JSX component that declared itself as a request origin).
    let reqComp = environment.getFlag(REQUESTING_COMPONENT_FLAG);
    if (reqComp && !SM_EXT_REGEX.test(reqComp)) {
      ret["requesting-component"] = reqComp;
    }

    // Transmit the "client-trust" flag (holding a boolean of whether the
    // client trusts the POST request to have only the results that they
    // expect).
    let clientTrust = environment.getFlag(CLIENT_TRUST_FLAG);
    if (clientTrust) ret["client-trust"] = true;

    return ret;
  }


  static receiveFlags(flags) {
    let ret = [];

    // The "request-admin-privileges" flag is transmitted.
    let reqAdminPriv = flags["request-admin-privileges"];
    if (reqAdminPriv) ret.push(REQUEST_ADMIN_PRIVILEGES_FLAG);

    // The "requesting-component" flag is transmitted.
    let reqComp = flags["requesting-component"];
    if (reqComp) ret.push([REQUESTING_COMPONENT_FLAG, reqComp]);

    // And the CLIENT_TRUST flag if transmitted.
    let clientTrust = flags["client-trust"];
    if (clientTrust) ret.push(CLIENT_TRUST_FLAG);

    return ret;
  }
}