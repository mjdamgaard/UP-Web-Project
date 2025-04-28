
import {DevFunction} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './misc/parseRoute.js';

import * as directoriesMod from "../dev_lib/server/query_src/directories.js";
import * as textFilesMod from "../dev_lib/server/query_src/text_files.js";
import * as autoKeyTextStructFilesMod from
  "../dev_lib/server/query_src/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod from
  "../dev_lib/server/query_src/binary_scored_binary_key_structs.js";



export const query = new DevFunction(null, null, (
  {}, route, cct, mct
) => {
  // Parse the route to get the filetype, among other parameters and qualities.
  let [
    homeDirID, filePath, fileExt, isLocked, queryStringArr
  ] = parseRoute(route);
  
  
  // If the route is locked for the admin only, query for the adminID,
  // straightaway, and verify that reqUserID equals adminID.
  // TODO: Do this.
  let adminID = isLocked ? 9 : undefined;
  
  
  // Branch according to the filetype.
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
      filetypeModule = textFilesMod;
      break;
    case "bbs":
      filetypeModule = textFilesMod;
      break;
    default:
      throw new ClientError(`Unrecognized action: "${action}"`);
  }
  
  
  let [result, wasReady] = filetypeModule.query(
    route, homeDirID, filePath, queryStringArr, reqUserID, adminID, cct, mct,
    gas
  );
  
});
