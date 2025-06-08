
import {
  DevFunction, RuntimeError, LoadError, getObject,
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './src/parseRoute.js';

import * as directoriesMod from "./src/filetypes/directories.js";
import * as textFilesMod from "./src/filetypes/text_files.js";
import * as relationalTableFilesMod from "./src/filetypes/rel_tables.js";
import * as fullTextTableFilesMod from "./src/filetypes/full_text_tables.js";

import {
  CHECK_ADMIN_PRIVILEGES_SIGNAL, CHECK_CAN_POST_SIGNAL
} from "./src/signals.js";





export const query = new DevFunction(
  {isAsync: true, minArgNum: 2, isEnclosed: true},
  async function(
    {callerNode, execEnv, interpreter, liveModule},
    [isPublic, route, isPost = false, postData, options]
  ) {
    isPost = isPublic ? false : isPost;
    options = options?.$val ?? {};

    // If isPost == true, check if the current environment is allowed to post.
    if (isPost) {
      execEnv.sendSignal(
        CHECK_CAN_POST_SIGNAL, callerNode
      );
    }

    // Parse the route, extracting parameters and qualities from it.
    let isLocked, upNodeID, homeDirID, filePath, fileExt, queryPathArr;
    try {
    [
      isLocked, upNodeID, homeDirID, filePath, fileExt, queryPathArr
    ] = parseRoute(route);
    }
    catch(errMsg) {
      throw new RuntimeError(errMsg, callerNode, execEnv);
    }
  
    // If the route is locked, check that you have admin privileges on the
    // directory of homeDirID.
    if (isLocked) {
      execEnv.sendSignal(
        CHECK_ADMIN_PRIVILEGES_SIGNAL, callerNode, homeDirID
      );
    }

    // If on the client side, simply forward the request to the server via the
    // serverQueryHandler.
    if (interpreter.isServerSide) {
      return await interpreter.serverQueryHandler.queryServer(
        isPublic, route, isPost, postData, options,
        upNodeID, callerNode, execEnv
      );
    }
    
    // Else branch according to the file type and get the right module for
    // handling that file type.
    let filetypeModule;
    let mimeType = "text/plain";
    switch (fileExt) {
      case undefined:
        filetypeModule = directoriesMod;
        break;
      case "json":
        mimeType = "text/json";
      case "js":
      case "jsx":
      case "txt":
      case "html":
      case "xml":
      case "svg":
      case "scss":
      case "md":
        filetypeModule = textFilesMod;
        break;
      case "att":
      case "bbt":
      case "bt":
      case "ct":
        filetypeModule = relationalTableFilesMod;
        break;
      case "ftt":
        filetypeModule = fullTextTableFilesMod;
        break;
      // (More file types can be added here in the future.)
      default:
        throw new LoadError(`Unrecognized file type: ".${fileExt}"`);
    }

    // Query the database via the filetypeModule, and return the output (which
    // will often be [result, wasReady] (on success) server-side, and will
    // simply be result client-side).
    let result = await filetypeModule.query(
      {callerNode, execEnv, interpreter, liveModule},
      route, isPost, postData, options,
      upNodeID, homeDirID, filePath, fileExt, queryPathArr,
    );
    return [result, mimeType];
  }
);



export const fetch = new DevFunction(
  {isAsync: true, minArgNum: 2, isEnclosed: true},
  async function(
    {callerNode, execEnv, liveModule},
    [isPublic, route, options]
  ) {
    let [result] = await liveModule.call(
      "query", [isPublic, route, false, undefined, options], callerNode, execEnv
    ) ?? [];
    return result;
  }
);


export const post = new DevFunction(
  {isAsync: true, minArgNum: 1, isEnclosed: true},
  async function(
    {callerNode, execEnv, liveModule},
    [route, postData, options]
  ) {
    let [result] = await liveModule.call(
      "query", [false, route, true, postData, options], callerNode, execEnv
    ) ?? [];
    return result;
  }
);