
import {
  DevFunction, Signal, RuntimeError, turnEnclosed,
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './misc/parseRoute.js';

import * as directoriesMod from "../dev_lib/server/db_src/directories.js";
import * as textFilesMod from "../dev_lib/server/db_src/text_files.js";
import * as autoKeyTextStructFilesMod from
  "../dev_lib/server/db_src/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod from
  "../dev_lib/server/db_src/binary_scored_binary_key_structs.js";

import {
  ELEVATED_PRIVILEGES_FLAG, SET_ELEVATED_PRIVILEGES_SIGNAL,
  CHECK_ELEVATED_PRIVILEGES_SIGNAL
} from "../dev_lib/server/db_src/directories.js";

export {
  ELEVATED_PRIVILEGES_FLAG, SET_ELEVATED_PRIVILEGES_SIGNAL,
  CHECK_ELEVATED_PRIVILEGES_SIGNAL
};



export const query = new DevFunction(
  {isAsync: true, minArgNum: 1, isEnclosed: true}, // initSignals: [QUERY_SIGNAL]},
  async function(
    {callerNode, callerEnv, interpreter, liveModule},
    [route, cachePeriod, clientCacheTime]
  ) {
    // Parse the route to get the filetype, among other parameters and qualities.
    let [
      homeDirID, filePath, fileExt, isLocked, queryStringArr
    ] = parseRoute(route);
  
    // If the route is locked, check that you have admin privileges on homeDirID.
    if (isLocked) {
      callerEnv.emitSignal(
        CHECK_ELEVATED_PRIVILEGES_SIGNAL, callerNode, homeDirID
      );
    }  
    
    // Branch according to the file type.
    let filetypeModule;
    switch (fileExt) {
      case undefined:
        filetypeModule = directoriesMod;
        break;
      case "js":
      case "txt":
      case "json":
      case "html":
      case "md":
        filetypeModule = textFilesMod;
        break;
      case "ats":
        filetypeModule = autoKeyTextStructFilesMod;
        break;
      case "bbs":
        filetypeModule = binaryScoredBinaryKeyStructFilesMod;
        break;
      default:
        throw new ClientError(`Unrecognized file type: ".${fileExt}"`);
    }
    
    
    let [result, wasReady] = await filetypeModule.query(
      {callerNode, callerEnv, interpreter, liveModule},
      route, homeDirID, filePath, fileExt, queryStringArr, reqUserID, adminID,
      cachePeriod, clientCacheTime
      
    );
    return [result, wasReady];
  }
);







// export const QUERY_FLAG = Symbol("query");

// export const QUERY_SIGNAL = new Signal(
//   "query",
//   function(flagEnv) {
//     flagEnv.raiseFlag(QUERY_FLAG);
//   }
// );


