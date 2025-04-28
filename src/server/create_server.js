
import * as http from 'http';
import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {InputGetter} from './user_input/InputGetter.js';
import {ScriptInterpreter} from "../interpreting/ScriptInterpreter.js"
import {parseRoute} from './misc/parseRoute.js';


import * as directoriesMod from "../dev_lib/server/directories.js";
import * as textFilesMod from "../dev_lib/server/text_files.js";
import * as autoKeyTextStructFilesMod from
  "../dev_lib/server/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod from
  "../dev_lib/server/binary_scored_binary_key_structs.js";

const staticDevLibs = new Map();
staticDevLibs.set("dir", directoriesMod);
staticDevLibs.set("text_files", textFilesMod);
staticDevLibs.set("ats_files", autoKeyTextStructFilesMod);
staticDevLibs.set("bbs_files", binaryScoredBinaryKeyStructFilesMod);



http.createServer(async function(req, res) {
  try {
    await requestHandler(req, res);
  }
  catch (err) {
    if (err instanceof ClientError) {
      endWithError(res, err);
    }
    else {
      endWithInternalError(res, err);
    }
  }
}).listen(8080);




async function requestHandler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  if (req.method !== "POST") {
    throw new ClientError(
      "Server only accepts the POST method"
    );
  }

  // Get user credentials at first if provided, as well as the mandatory 'route'
  // (an extended path), which points to the file or directory that is the
  // target of the request, and thus which developer library handles it. Also
  // get the optional client cache time, 'cct', and the requested maximum
  // /server-side) cache time, 'mct', which are used for read requests.
  let body = await InputGetter.getBodyPromise(req);
  let [credentials, route, cct, mct] = await InputGetter.getParamsPromise(
    // (An undefined default value means that it is required. The 'route'
    // parameter is thus required here, whereas 'credentials' is not.)
    body, ["credentials", "route", "cct", "mct"], [null, undefined, null, null]
  );


  // TODO: If credentials is not null, authenticate the user here, throwing an
  // error on failure, and setting the reqUserID to the user's ID on success.
  let reqUserID = 9;


  // TODO: Get the gas object.
  let gas = {};




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
    // case "put": {
    //   let [
    //     route, content, isBase64
    //   ] = await InputGetter.getParamsPromise(
    //     body, ["route", "content", "isBase64"], [undefined, null, false]
    //   );
    //   result = await DBQueryHandler.put(
    //     reqUserID, route, content, isBase64
    //   );
    //   // result: wasCreated.
    //   break;
    // }
    // case "touch": {
    //   let [
    //     route
    //   ] = await InputGetter.getParamsPromise(
    //     body, ["route"], [undefined]
    //   );
    //   result = await DBQueryHandler.touch(
    //     reqUserID, route
    //   );
    //   // result: wasCreated.
    //   break;
    // }
    // case "mkdir": {
    //   let [
    //     isPrivate
    //   ] = await InputGetter.getParamsPromise(
    //     body, ["isPrivate"], [false]
    //   );
    //   result = await DBQueryHandler.mkdir(
    //     reqUserID, isPrivate
    //   );
    //   // result: dirID.
    //   break;
    // }
    // case "delete": {
    //   let [
    //     route
    //   ] = await InputGetter.getParamsPromise(
    //     body, ["route"], [undefined]
    //   );
    //   result = await DBQueryHandler.delete(
    //     reqUserID, route
    //   );
    //   // result: wasCreated.
    //   break;
    // }
    // case "call":
    //   // TODO: Implement.
    default:
      throw new ClientError(`Unrecognized action: "${action}"`);
  }


  let [result, wasReady] = await filetypeModule.query(
    route, homeDirID, filePath, queryStringArr, reqUserID, adminID, cct, mct,
    gas
  );

  // Return the results.
  res.writeHead(200, {'Content-Type': 'text/json'});
  res.end(JSON.stringify([result ?? null, wasReady ?? null]));
}