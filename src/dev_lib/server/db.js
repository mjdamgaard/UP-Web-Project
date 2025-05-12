
import {
  DevFunction, Signal, RuntimeError, TypeError
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './db_src/parseRoute.js';

import * as directoriesMod from "./db_src/filetypes/directories.js";
import * as textFilesMod from "./db_src/filetypes/text_files.js";
import * as autoKeyTextStructFilesMod
  from "./db_src/filetypes/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod from
  "./db_src/filetypes/binary_scored_binary_key_structs.js";

import {CHECK_ELEVATED_PRIVILEGES_SIGNAL} from "./db_src/signals.js";




export const query = new DevFunction(
  {isAsync: true, minArgNum: 2, isEnclosed: true},
  async function(
    {callerNode, callerEnv, execEnv, interpreter, liveModule},
    [method, route, postData, maxAge, noCache, lastUpToDate]
  ) {
    // Verify that method is either "post" or "fetch", and turn it into a
    // boolean, 'isPost.'
    let isPost;
    if (method === "fetch") {
      isPost = false;
    }
    else if (method === "post") {
      isPost = true;
    }
    else throw new TypeError(
      'The only supported query methods are "fetch" and "post", but ' +
      `received "${method}"`,
      callerNode, callerEnv
    );

    // Parse the maxAge integer (in ms) and the lastUpToDate UNIX time integer.
    maxAge = parseInt(maxAge);
    lastUpToDate = parseInt(lastUpToDate);

    // Parse the route to get the filetype, among other parameters and
    // qualities.
    let homeDirID, filePath, fileExt, queryStringArr, isLocked;
    try {
    [
      homeDirID, filePath, fileExt, queryStringArr, isLocked
    ] = parseRoute(route);
    }
    catch(errMsg) {
      throw new RuntimeError(errMsg, callerNode, callerEnv);
    }
  
    // If the route is locked, check that you have admin privileges on the
    // directory of homeDirID.
    if (isLocked) {
      execEnv.emitSignal(
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
      // More file types can be added here in the future.
      default:
        throw new ClientError(`Unrecognized file type: ".${fileExt}"`);
    }

    // Query the database via the filetypeModule.
    let [result, wasReady] = await filetypeModule.query(
      {callerNode, callerEnv, execEnv, interpreter, liveModule},
      isPost, route, homeDirID, filePath, fileExt, queryStringArr,
      postData, maxAge, noCache ?? isPost, lastUpToDate
    );
    
    return [result, wasReady];
  }
);



export const fetch = new DevFunction(
  {isAsync: true, minArgNum: 1, isEnclosed: true},
  async function(
    {callerNode, execEnv, liveModule},
    [route, maxAge, noCache]
  ) {
    let [result] = liveModule.call(
      "query", ["fetch", route, undefined, maxAge, noCache],
      callerNode, execEnv
    );
    return result;
  }
);


export const post = new DevFunction(
  {isAsync: true, minArgNum: 1, isEnclosed: true},
  async function(
    {callerNode, execEnv, liveModule},
    [route, postData]
  ) {
    let [result] = liveModule.call(
      "query", ["post", route, postData],
      callerNode, execEnv
    );
    return result;
  }
);