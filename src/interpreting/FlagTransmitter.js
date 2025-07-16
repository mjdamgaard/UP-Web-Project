
import {
  REQUESTING_COMPONENT_FLAG, CLIENT_TRUST_FLAG
} from "../dev_lib/query/src/flags.js";


export class FlagTransmitter {
  

  static getTransmittedFlags(environment) {
    let ret = {};

    // Transmit the "requesting-component" flag (holding the route of the last
    // JSX component that declared itself as a request origin).
    let reqComp = environment.getFlag(REQUESTING_COMPONENT_FLAG);
    if (reqComp) ret["requesting-component"] = reqComp;

    // Transmit the "client-trust" flag (holding a boolean of whether the
    // client trusts the POST request to have only the results that they
    // expect).
    let clientTrust = environment.getFlag(CLIENT_TRUST_FLAG);
    if (clientTrust) ret["client-trust"] = clientTrust;

    return ret;
  }


  static receiveFlags(flags) {
    let ret = [];

    // The "requesting-component" flag is transmitted.
    let reqComp = flags["requesting-component"];
    if (reqComp) ret.push([REQUESTING_COMPONENT_FLAG, reqComp]);

    // And the CLIENT_TRUST flag if transmitted.
    let clientTrust = flags["client-trust"];
    if (clientTrust) ret.push([CLIENT_TRUST_FLAG, clientTrust]);

    return ret;
  }
}