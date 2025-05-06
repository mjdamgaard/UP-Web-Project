
import {
  AsyncDevFunction, Signal, RuntimeError,
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './misc/parseRoute.js';

import * as directoriesMod from "../dev_lib/server/db_src/directories.js";
import * as textFilesMod from "../dev_lib/server/db_src/text_files.js";
import * as autoKeyTextStructFilesMod from
  "../dev_lib/server/db_src/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod from
  "../dev_lib/server/db_src/binary_scored_binary_key_structs.js";



export async function _query(
  {callerNode, callerEnv, interpreter}, [route, cct, mct]
) {
  // Parse the route to get the filetype, among other parameters and qualities.
  let [
    homeDirID, filePath, fileExt, isLocked, queryStringArr
  ] = parseRoute(route);

  // If the route is locked, check that you have admin privileges on homeDirID.
  if (isLocked) {
    callerEnv.emitSignal(CHECK_ELEVATED_PRIVILEGES_SIGNAL, callerNode, homeDirID);
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
    route, homeDirID, filePath, queryStringArr, reqUserID, adminID, cct, mct,
    gas
  );
  return [result, wasReady];
}

export const query = new DevFunction(
  {isAsync: true, minArgNum: 1, isEnclosed: true},
  _query
);



export const ELEVATED_PRIVILEGES_FLAG = Symbol("elevated_privileges");

export const SET_ELEVATED_PRIVILEGES_SIGNAL = new Signal(
  "set_elevated_privileges",
  function(flagEnv, _, _, homeDirID) {
    flagEnv.raiseFlag(ELEVATED_PRIVILEGES_FLAG, homeDirID);
  }
);

export const CHECK_ELEVATED_PRIVILEGES_SIGNAL = new Signal(
  "check_elevated_privileges",
  function(flagEnv, node, env, homeDirID) {
    let [wasFound, prevHomeDirID] = flagEnv.getFlag(ELEVATED_PRIVILEGES_FLAG);
    if (!wasFound || prevHomeDirID !== homeDirID) throw new RuntimeError(
      `Requested admin privileges on Directory ${homeDirID} not granted`,
      node, env
    );
    flagEnv.raiseFlag(ELEVATED_PRIVILEGES_FLAG, homeDirID);
  }
);