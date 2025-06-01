
import {
  DevFunction, FunctionObject, Signal, RuntimeError, TypeError, LoadError,
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './src/parseRoute.js';

import * as directoriesMod from "./src/filetypes/directories.js";
import * as textFilesMod from "./src/filetypes/text_files.js";
import * as relationalTableFilesMod from "./src/filetypes/rel_table.js";
import * as fullTextTableFilesMod from "./src/filetypes/full_text_tables.js";

import {CHECK_ELEVATED_PRIVILEGES_SIGNAL} from "./src/signals.js";





export const query = new DevFunction(
  {isAsync: true, minArgNum: 2, isEnclosed: true},
  async function(
    {callerNode, execEnv, interpreter, liveModule},
    [route, data, options]
  ) {
    options = options?.val ?? options;

    // Parse the route to get the filetype, among other parameters and
    // qualities.
    let upNodeID, homeDirID, filePath, fileExt, queryStringArr, isLocked;
    try {
    [
      upNodeID, homeDirID, filePath, fileExt, queryStringArr, , isLocked
    ] = parseRoute(route);
    }
    catch(errMsg) {
      throw new RuntimeError(errMsg, callerNode, execEnv);
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
      case "jsx":
      case "txt":
      case "json":
      case "html":
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

    // // If on the server side, and dbQueryHandler has not been imported yet, do
    // // so.
    // if (interpreter.isServerSide && !dbQueryHandler) {
    //   let dbQueryHandlerMod = await import(dbQueryHandlerPath);
    //   dbQueryHandler = new dbQueryHandlerMod.DBQueryHandler();
    // }

    // Query the database via the filetypeModule, and return the output (which
    // will often be [result, wasReady] (on success) server-side, and will
    // simply be result client-side).
    return await filetypeModule.query(
      {callerNode, execEnv, interpreter, liveModule},
      route, data, upNodeID, homeDirID, filePath, fileExt, queryStringArr,
      options,
    );
  }
);



// export const fetch = new DevFunction(
//   {isAsync: true, minArgNum: 1, isEnclosed: true},
//   async function(
//     {callerNode, execEnv, liveModule},
//     [route, maxAge, noCache, onCached]
//   ) {
//     if (onCached === undefined) {
//       if (noCache instanceof FunctionObject) {
//         onCached = noCache;
//         noCache = undefined;
//       }
//       else if (noCache === undefined && maxAge instanceof FunctionObject) {
//         onCached = maxAge;
//         maxAge = undefined;
//       }
//     }
//     let [result] = await liveModule.call(
//       "query", ["fetch", route, undefined, maxAge, noCache],
//       callerNode, execEnv
//     ) ?? [];
//     return result;
//   }
// );


// export const post = new DevFunction(
//   {isAsync: true, minArgNum: 1, isEnclosed: true},
//   async function(
//     {callerNode, execEnv, liveModule},
//     [route, postData]
//   ) {
//     let [result] = await liveModule.call(
//       "query", ["post", route, postData],
//       callerNode, execEnv
//     ) ?? [];
//     return result;
//   }
// );