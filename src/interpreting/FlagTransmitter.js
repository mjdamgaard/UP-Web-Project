
import {
  NEXT_REQUEST_ORIGIN_FLAG, CLIENT_TRUST_FLAG
} from "../dev_lib/query/src/flags.js";


export class FlagTransmitter {
  

  static getTransmittedFlags(environment) {
    let ret = {};

    // Transmit the "next-request-origin" flag (holding the route of the last
    // JSX component that declared itself as a request origin).
    let reqOrigin = environment.getFlag(NEXT_REQUEST_ORIGIN_FLAG);
    if (reqOrigin) ret["next-request-origin"] = reqOrigin;

    // Transmit the "client-trust" flag (holding a boolean of whether the
    // client trusts the POST request to have only the results that they
    // expect).
    let clientTrust = environment.getFlag(CLIENT_TRUST_FLAG);
    if (clientTrust) ret["client-trust"] = clientTrust;

    return ret;
  }


  static receiveFlags(flags) {
    let ret = [];

    // The "next-request-origin" flag is transmitted, which in case of a
    // /callSMF route will be immediately converted to the "request-orin" flag
    // (and "next-request-origin" flag will then be set to the given /callSMF
    // route).
    let reqOrigin = flags["next-request-origin"];
    if (reqOrigin) ret.push([NEXT_REQUEST_ORIGIN_FLAG, reqOrigin]);

    // And the CLIENT_TRUST flag if transmitted.
    let clientTrust = flags["client-trust"];
    if (clientTrust) ret.push([CLIENT_TRUST_FLAG, clientTrust]);

    return ret;
  }
}