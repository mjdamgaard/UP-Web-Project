
import {
  REQUEST_ORIGIN_FLAG, CURRENT_MODULE_FLAG, CLIENT_TRUST_FLAG
} from "../dev_lib/query/src/flags.js";


export class FlagTransmitter {
  

  static getTransmittedFlags(environment) {
    let ret = {};

    // Transmit the "request-origin" flag (holding the path/route of the last
    // JSX last component that declared itself as a request origin).
    let reqOrigin = environment.getFlag(REQUEST_ORIGIN_FLAG);
    if (reqOrigin) ret["request-origin"] = reqOrigin;

    // Transmit the "client-trust" flag (holding a boolean of whether the
    // trusts the POST request to have the results as expected by the client).
    let clientTrust = environment.getFlag(CLIENT_TRUST_FLAG);
    if (clientTrust) ret["client-trust"] = clientTrust;

    return ret;
  }


  static receiveFlags(flags) {
    let ret = [];

    // If flags contain a "request-origin" flag, set the CURRENT_MODULE_FLAG,
    // which in case of a /callSMF route will be immediately converted to the
    // REQUEST_ORIGIN_FLAG (and CURRENT_MODULE_FLAG will then be set to the
    // given /callSMF route).
    let reqOrigin = flags["request-origin"];
    if (reqOrigin) ret.push([CURRENT_MODULE_FLAG, reqOrigin]);

    // And set the CLIENT_TRUST flag if transmitted.
    let clientTrust = flags["client-trust"];
    if (clientTrust) ret.push([CLIENT_TRUST_FLAG, clientTrust]);
  }
}