
import {
  AsyncDevFunction, Environment, Flag, RuntimeError,
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
    callerEnv.raiseFlag(GET_ADMIN_PRIVILEGES_FLAG, homeDirID, callerNode);
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

export const query = new AsyncDevFunction(_query);



const SET_ADMIN_PRIVILEGES_FLAG = new Flag(
  function(homeDirID, flagEnv, node, env) {
    return homeDirID;
  }
);
const GET_ADMIN_PRIVILEGES_FLAG = new Flag(
  function(homeDirID, flagEnv, node, env) {
    let [ , prevHomeDirID] = flagEnv.getFirstFlag([
      this, SET_ADMIN_PRIVILEGES_FLAG
    ]);
    if (prevHomeDirID !== homeDirID) throw new RuntimeError(
      `Requested admin privileges on Directory ${homeDirID} not granted`,
      node, env
    );
    return homeDirID;
  }
);