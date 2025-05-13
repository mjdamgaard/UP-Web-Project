
import {
  DevFunction, FunctionObject, Signal, RuntimeError, TypeError
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './src/parseRoute.js';
import {ServerQueryHandler} from "../../server/db_io/DBQueryHandler.js";

import * as directoriesMod from "./src/filetypes/directories.js";
import * as textFilesMod from "./src/filetypes/text_files.js";
import * as autoKeyTextStructFilesMod
  from "./src/filetypes/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod from
  "./src/filetypes/binary_scored_binary_key_structs.js";

import {CHECK_ELEVATED_PRIVILEGES_SIGNAL} from "./src/signals.js";

// Instantiate serverQueryHandler for client-side HTTP queries (requests), and
// declare dbQueryHandler for server-side DB queries, which is instantiated
// dynamically below, and only if the function is run server-side.
const serverQueryHandler = new ServerQueryHandler();
var dbQueryHandler;



export const query = new DevFunction(
  {isAsync: true, minArgNum: 2, isEnclosed: true},
  async function(
    {callerNode, callerEnv, execEnv, interpreter, liveModule},
    [method, route, postData, maxAge, noCache, lastUpToDate, onCached]
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

    // Parse the maxAge integer (in ms) and the lastUpToDate UNIX time integer,
    // and use a default value of isPost for noCache.
    maxAge = parseInt(maxAge);
    lastUpToDate = parseInt(lastUpToDate);
    noCache ??= isPost;

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

    // If on the server side, and dbQueryHandler has not been imported yet, do
    // so.
    if (interpreter.isServerSide && !dbQueryHandler) {
      let dbQueryHandlerMod = await import(
        "../../server/db_io/DBQueryHandler.js"
      );
      dbQueryHandler = new dbQueryHandlerMod.DBQueryHandler();
    }

    // Query the database via the filetypeModule, and return the output (which
    // will often be [result, wasReady] (on success) server-side, and will
    // simply be result client-side).
    return await filetypeModule.query(
      {callerNode, callerEnv, execEnv, interpreter, liveModule},
      isPost, route, homeDirID, filePath, fileExt, queryStringArr,
      postData, maxAge, noCache ?? isPost, lastUpToDate, onCached,
      serverQueryHandler, dbQueryHandler,
    );
  }
);



export const fetch = new DevFunction(
  {isAsync: true, minArgNum: 1, isEnclosed: true},
  async function(
    {callerNode, execEnv, liveModule},
    [route, maxAge, noCache, onCached]
  ) {
    if (onCached === undefined) {
      if (noCache instanceof FunctionObject) {
        onCached = noCache;
        noCache = undefined;
      }
      else if (noCache === undefined && maxAge instanceof FunctionObject) {
        onCached = maxAge;
        maxAge = undefined;
      }
    }
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