
import {
  DevFunction, Exception, ClassObject, exceptionClass,
} from '../interpreting/ScriptInterpreter.js';
import {
  CLIENT_TRUST_FLAG, REQUESTING_COMPONENT_FLAG, 
} from './query/src/flags.js';


// TODO: Correct and extend this library to use the new flags correctly.  

export const checkRequestOrigin = new DevFunction(
  "checkRequestOrigin", {typeArr: ["boolean", "array"]},
  function(
    {callerNode, execEnv},
    [canForce, whitelist]
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
    let requestOrigin = undefined//execEnv.getFlag(REQUESTING_COMPONENT_FLAG);
    let isAllowed = whitelist.some(str => {
      if (str.at(-1) === "*") {
        let requiredSubstring = str.slice(0, -1);
        return requestOrigin.substring(0, requiredSubstring.length) ===
          requiredSubstring;
      } else {
        return requestOrigin === str;
      }
    });
    
    // Throw if the request origin was not accepted.
    if (!isAllowed) throw new Exception(
      RequestOriginError.getNewInstance(
        ["Request origin not allowed"], callerNode, execEnv
      ),
      callerNode, execEnv
    );
  }
);



export const getRequestOrigin = new DevFunction(
  "getRequestOrigin", {}, function({execEnv}, []) {
    return execEnv.getFlag(REQUESTING_COMPONENT_FLAG);
  }
);


export const getUserID = new DevFunction(
  "getUserID", {}, function({execEnv}, []) {
    return execEnv.scriptVars.contexts.userIDContext.get();
  }
);



export const RequestOriginError = new ClassObject(
  "RequestOriginError", undefined, undefined, exceptionClass
);

