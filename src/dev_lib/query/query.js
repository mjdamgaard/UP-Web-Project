
import {
  DevFunction, RuntimeError, LoadError,
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './src/parseRoute.js';


import * as directoriesMod from "./src/filetypes/directories.js";
import * as textFilesMod from "./src/filetypes/text_files.js";
import * as relationalTableFilesMod from "./src/filetypes/rel_tables.js";
import * as fullTextTableFilesMod from "./src/filetypes/full_text_tables.js";

import {checkAdminPrivileges, checkIfCanPost} from "./src/flags.js";

const OWN_UP_NODE_ID = "1";




export const query = new DevFunction(
  "query", {
    isAsync: true,
    typeArr: ["string", "boolean?", "any?", "boolean?", "object?"],
  },
  async function(
    {callerNode, execEnv, interpreter, liveModule},
    [extendedRoute, isPost = false, postData, isPrivate, options = {}]
  ) {
    isPost ||= isPrivate;

    // If isPost == true, check if the current environment is allowed to post.
    if (isPost) {
      checkIfCanPost(callerNode, execEnv);
    }

    // First split the input route along each (optional) occurrence of '/>',
    // where the first part is then the actual route that is queried, and any
    // and all of the subsequent parts are what we can call "casting paths",
    // which reinterprets/casts the queried result into something else.
    let route, castingPathArr;
    [route, ...castingPathArr] = extendedRoute.split('/>');

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

    // If on the server side, and if upNodeID is that of the UP node that the
    // server is part of, query the database, but not before checking admin
    // privileges for the given home directory if the route is locked.
    let result;
    if (interpreter.isServerSide && upNodeID === OWN_UP_NODE_ID) {
      if (isLocked) {
        checkAdminPrivileges(homeDirID, callerNode, execEnv);
      }
      result = await interpreter.dbQueryHandler.queryDBFromScript(
        route, isPost, postData, options, fileExt, callerNode, execEnv
      );
    }

    // Else query a server at the given UP node.
    else {
      result = await interpreter.serverQueryHandler.queryServerFromScript(
        isPrivate, route, isPost, postData, options, upNodeID,
        callerNode, execEnv
      );
    }

    // TODO: transform/cast the result if there are casting segments. 

    return result;


    // Else branch according to the file type and get the right module for
    // handling that file type.
    let filetypeModule;
    let mimeType = "application/json";
    switch (fileExt) {
      case undefined:
        filetypeModule = directoriesMod;
        break;
      case "js":
      case "jsx":
      case "txt":
      case "html":
      case "xml":
      case "svg":
      case "scss":
      case "md":
        // mimeType = "text/plain";
      case "json":
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
        throw new LoadError(
          `Unrecognized file type: ".${fileExt}"`,
          callerNode, execEnv
        );
    }

    // Query the database via the filetypeModule, and return the output (which
    // will often be [result, wasReady] (on success) server-side, and will
    // simply be result client-side).
    result = await filetypeModule.query(
      {callerNode, execEnv, interpreter, liveModule},
      route, isPost, postData, options,
      upNodeID, homeDirID, filePath, fileExt, queryPathArr,
    );
    return [result, mimeType];
  }
);



export const fetch = new DevFunction(
  "fetch", {isAsync: true, typeArr: ["string", "boolean?", "any?"]},
  async function(
    {callerNode, execEnv, interpreter},
    [extendedRoute, isPrivate = false, options]
  ) {
    let [result] = await query.fun(
      {callerNode, execEnv, interpreter},
      [extendedRoute, false, undefined, isPrivate, options],
    ) ?? [];
    return result;
  }
);


export const post = new DevFunction(
  "post", {isAsync: true, typeArr: ["string", "any?", "any?"]},
  async function(
    {callerNode, execEnv, interpreter},
    [route, postData, options]
  ) {
    let [result] = await query.fun(
      {callerNode, execEnv, interpreter},
      [route, true, postData, true, options],
    ) ?? [];
    return result;
  }
);



export const getCurrentHomePath = new DevFunction(
  "getCurrentHomePath", {},
  function({execEnv}, []) {
    let curRoute = execEnv.getModuleEnv().modulePath ?? "";
    let [ret] = curRoute.match(/^\/[^/]+\/[^/]+/g) ?? [];
    return ret; 
  }
);