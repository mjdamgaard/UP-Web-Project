
import * as http from 'http';
import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {InputGetter} from './user_input/InputGetter.js';
import {DBQueryHandler} from './db_io/DBQueryHandler.js';


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


/(\/[^/?.]+)*(\/[^/?.]+\.[^/?]+)?(\/[^/?]+)*/;
  // TODO: Relocate this function and import it instead:
  const dirPathRegEx = /^(\/[^/?.]+)+/;
  const filenameRegEx = /^\/([^/?.]+\.[^/?]+)/;
  const queryStringRegEx = /^\?([^=&]+=[^=&]*(&[^=&]+=[^=&])*)/;

  function parseRoute(route) {
    let dirPath, filename, queryPath, queryString;
    let match, routeRemainder = route;
    // Get the directory path, if any.
    [match, dirPath] = dirPathRegEx.exec(routeRemainder) ?? [""];
    routeRemainder = routeRemainder.substring(match.length);

    // Get the filename, if any.
    [match, filename] = filenameRegEx.exec(routeRemainder) ?? [""];
    routeRemainder = routeRemainder.substring(match.length);

    // Get the abstract "query path" following the filename, if any.
    [match, queryPath] = dirPathRegEx.exec(routeRemainder) ?? [""];
    routeRemainder = routeRemainder.substring(match.length);

    // Get the final query string, if any.
    [match, queryString] = queryStringRegEx.exec(routeRemainder) ?? [""];
    routeRemainder = routeRemainder.substring(match.length);

    // Throw if this did not exhaust the full route.
    if (routeRemainder !== "") throw new ClientError(
      `Invalid route: ${route}`
    );

    // Throw if a filename is used outside of any directory.
    if (filename && ! dirPath) throw new ClientError(
      `Invalid route: ${route}. Filename has to be preceded by a directory path`
    );

    // Extract the (home) dirID from dirPath, if any.
    let dirID;
    if (dirPath) {
      dirID = dirPath.substring(1, dirPath.indexOf("/", 1));
    }

    // Parse whether the given file or directory, or query path, is locked for
    // the admin only...
    if (dirPath) {
      dirID = dirPath.substring(1, dirPath.indexOf("/", 1));
    }




    // Get the file extension, and if the filename includes no ".", treat it as
    // a directory and add it to path, with a trailing "/" added as well.
    let fileExt;
    if (filename) {
      let indOfDot = filename.indexOf(".");
      if (indOfDot === 0) throw new ClientError(
        "Hidden files (with a leading '.') are not allowed in routes"
      );
      else if (indOfDot === -1) {
        path += filename + "/";
        filename = undefined;
      }
      else {
        fileExt = filename.substring(indOfDot + 1);
      }
    }
  }

  // Parse the route to get the filetype, among other parameters and qualities.
  let [
    dirID, filePath, fileExt, queryPath, isLocked, isHidden, queryString
  ] = parseRoute(route);

  // Branch according to the filetype.
  let wasReady, result;
  switch (route) {
    case "read": {
      let [
        route, clientCacheTime, minServerCacheTime
      ] = await InputGetter.getParamsPromise(
        // 'cct': client cache time, 'mct': max (server) cache time.
        body, ["route", "cct", "mct"], [undefined, null, null]
      );
      result = await DBQueryHandler.read(
        route, reqUserID, clientCacheTime, minServerCacheTime
      );
      // result: [wasReady, data].
      break;
    }
    case "put": {
      let [
        route, content, isBase64
      ] = await InputGetter.getParamsPromise(
        body, ["route", "content", "isBase64"], [undefined, null, false]
      );
      result = await DBQueryHandler.put(
        reqUserID, route, content, isBase64
      );
      // result: wasCreated.
      break;
    }
    case "touch": {
      let [
        route
      ] = await InputGetter.getParamsPromise(
        body, ["route"], [undefined]
      );
      result = await DBQueryHandler.touch(
        reqUserID, route
      );
      // result: wasCreated.
      break;
    }
    case "mkdir": {
      let [
        isPrivate
      ] = await InputGetter.getParamsPromise(
        body, ["isPrivate"], [false]
      );
      result = await DBQueryHandler.mkdir(
        reqUserID, isPrivate
      );
      // result: dirID.
      break;
    }
    case "delete": {
      let [
        route
      ] = await InputGetter.getParamsPromise(
        body, ["route"], [undefined]
      );
      result = await DBQueryHandler.delete(
        reqUserID, route
      );
      // result: wasCreated.
      break;
    }
    case "call":
      // TODO: Implement.
    default:
        throw new ClientError(`Unrecognized action: "${action}"`);
  }

  // Return the results.
  res.writeHead(200, {'Content-Type': 'text/json'});
  res.end(JSON.stringify(result ?? null));
}