
import {
  DevFunction, Signal, RuntimeError, TypeError
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './misc/parseRoute.js';

import * as directoriesMod from ".//db_src/directories.js";
import * as textFilesMod from ".//db_src/text_files.js";
import * as autoKeyTextStructFilesMod from ".//db_src/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod from
  ".//db_src/binary_scored_binary_key_structs.js";

import {CHECK_ELEVATED_PRIVILEGES_SIGNAL} from "./db_src/signals.js";




export const query = new DevFunction(
  {isAsync: true, minArgNum: 2, isEnclosed: true},
  async function(
    {callerNode, callerEnv, execEnv, interpreter, liveModule},
    [method, route, postData, receiverCacheTime, cachePeriod, onWasReady]
  ) {
    // Parse the route to get the filetype, among other parameters and
    // qualities.
    let [
      homeDirID, filePath, fileExt, queryStringArr, isLocked
    ] = parseRoute(route);
  
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


    // Query the database via the filetypeModule, with the method depending on
    // the 'method' argument.
    let result, wasReady;
    if (method === "fetch") {
      [result, wasReady] = await filetypeModule.fetch(
        {callerNode, callerEnv, interpreter, liveModule},
        route, homeDirID, filePath, fileExt, queryStringArr,
        cachePeriod, receiverCacheTime
      );
    }
    else if (method === "post") {
      result = await filetypeModule.post(
        {callerNode, callerEnv, interpreter, liveModule},
        route, homeDirID, filePath, fileExt, queryStringArr,
        postData
      );
    }
    else {
      throw new TypeError(
        'The only supported query methods are "fetch" and "post", but ' +
        `received "${method}"`,
        callerNode, callerEnv
      );
    }

    // If wasReady, i.e. the result was retrieved from the cache with a
    // timestamp there less than the receiverCacheTime, call the onWasReady()
    // function, given that one is provided.
    if (onWasReady && wasReady) {
      interpreter.executeFunction(onWasReady, [], callerNode, execEnv);
    }
    
    return result;
  }
);



export const fetch = new DevFunction(
  {isAsync: true, minArgNum: 1, isEnclosed: true},
  function(
    {callerNode, execEnv, liveModule},
    [route, cachePeriod]
  ) {
    return liveModule.call(
      "query", ["fetch", route, undefined, undefined, cachePeriod],
      callerNode, execEnv
    );
  }
);


export const post = new DevFunction(
  {isAsync: true, minArgNum: 1, isEnclosed: true},
  function(
    {callerNode, execEnv, liveModule},
    [route, postData]
  ) {
    return liveModule.call(
      "query", ["post", route, postData],
      callerNode, execEnv
    );
  }
);