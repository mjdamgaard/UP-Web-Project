
import {
  DevFunction, NetworkError, ObjectObject, getString,
} from '../interpreting/ScriptInterpreter.js';
import {
  CLIENT_TRUST_FLAG, REQUESTING_COMPONENT_FLAG, 
} from './query/src/flags.js';



export const checkRequestOrigin = new DevFunction(
  "checkRequestOrigin", {typeArr: ["boolean", "array?"]},
  function(
    {callerNode, execEnv},
    [canForce, whitelist = []]
  ) {
    // If canForce is true, check if the client trusts the request to be forced
    // through this CORS-like check.
    if (canForce) {
      let clientTrust = execEnv.getFlag(CLIENT_TRUST_FLAG);
      if (clientTrust) {
        return;
      }
    }

    // Else see if the request origin matches any one in the whitelist, where a
    // trailing '*' in a whitelisted request origin string is a wildcard that
    // means that all extensions of that string is allowed as well.
    let requestOrigin = execEnv.getFlag(REQUESTING_COMPONENT_FLAG);
    if (whitelist instanceof ObjectObject) whitelist = whitelist.members;
    let isAllowed = whitelist.some(str => {
      str = getString(str, callerNode, execEnv);
      if (str.at(-1) === "*") {
        let requiredSubstring = str.slice(0, -1);
        return requestOrigin.substring(0, requiredSubstring.length) ===
          requiredSubstring;
      } else {
        return str === requestOrigin;
      }
    });
    
    // Throw if the request origin was not accepted.
    if (!isAllowed) throw new NetworkError(
      "Request origin not allowed",
      callerNode, execEnv
    );
  }
);



export const checkClientTrust = new DevFunction(
  "checkClientTrust", {}, function({callerNode, execEnv}, []) {
    if (!execEnv.getFlag(CLIENT_TRUST_FLAG)) throw new NetworkError(
      "Client trust required for this request",
      callerNode, execEnv
    );
  }
);



export const getRequestOrigin = new DevFunction(
  "getRequestOrigin", {}, function({execEnv}, []) {
    return execEnv.getFlag(REQUESTING_COMPONENT_FLAG);
  }
);





export const getRequestingUserID = new DevFunction(
  "getRequestingUserID", {},
  function({execEnv}, []) {
    return execEnv.getFlag(USER_ID_FLAG); 
  }
);



