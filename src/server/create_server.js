
import * as http from 'http';
import fs from 'fs';
import path from 'path';
// import * as process from 'process';

import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {
  ScriptInterpreter, RuntimeError, jsonStringify,
} from "../interpreting/ScriptInterpreter.js";
import {DBQueryHandler} from "./db_io/DBQueryHandler.js";
import {scriptParser} from "../interpreting/parsing/ScriptParser.js";

import {ELEVATED_PRIVILEGES_FLAG} from "../dev_lib/query/src/signals.js";

import * as queryMod from "../dev_lib/query/query.js";

const staticDevLibs = new Map();
staticDevLibs.set("query", queryMod);



const [ , curPath] = process.argv;
const mainScriptPath = path.normalize(
  path.dirname(curPath) + "/main_script/main.js"
);
const mainScript = fs.readFileSync(mainScriptPath, "utf8");

const [syntaxTree, lexArr, strPosArr] = scriptParser.parse(mainScript);
const parsedMainScript = syntaxTree.res;
const dbQueryHandler = new DBQueryHandler();

const scriptInterpreter = new ScriptInterpreter(
  true, undefined, dbQueryHandler, staticDevLibs, jsFileCache, undefined
);

// Locked routes are all routes where any file name, directory name, or
// query path property name contains a tilde (~).
const LOCKED_ROUTE_REGEX = /~/;




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

  // The server only implements GET and POST requests, where for the POST 
  // requests the post request body is a JSON object.
  let route = req.url;
  let reqParams = {};
  let isPublic = true;
  if (req.method === "POST") {
    // Set isPublic as false, and get and parse the request params.
    isPublic = false;
    let reqBody = await getData(req);
    let isValidJSON = true;
    try {
      reqParams = JSON.parse(reqBody || "{}");
    }
    catch (err) {
      isValidJSON = false;
    }
    if (!isValidJSON || !reqParams || typeof reqParams !== "object") {
      throw new ClientError(
        "Post request body was not a JSON object"
      );
    }
  }
  else if (req.method !== "GET") throw new ClientError(
    "Server only accepts the GET and POST methods"
  );

  // Get optional isPost and postData, as well as the optional user credentials
  // (username and password/token), and the options parameter.
  let {
    isPost = false, postData, credentials, flags, options = {},
  } = reqParams;

  // Also extract some additional optional parameters from options. 
  let {gas, gasID, returnLog} = options;


  // Get the userID of the requesting user, if the user has supplied their
  // credentials to the request, failing if those credentials couldn't be
  // authenticated. Also get the gas for the request in the same process.
  let reqUserID;
  [gas, reqUserID] = await getGasAndReqUserID(credentials, gas, gasID);


  // Parse whether the route is a "locked" route (that can only be accessed by
  // the admin, if any, or by a server module function (SMF) of that directory).
  // These are all paths that include a tilde ('~') anywhere in them.
  let isLocked = LOCKED_ROUTE_REGEX.test(route);

  // TODO: If the route it locked, get the adminID of the homeDir, and verify
  // that reqUser is the admin, then initialize initFlags with a
  // SET_ELEVATED_PRIVILEGES_SIGNAL on homeDirID. And if the route is not
  // locked, initialize an empty initFlags array.
  let initFlags = [[ELEVATED_PRIVILEGES_FLAG, route[1]]];


  // Call the main.js script which redirects to the query() dev function.
  let parsedScripts = new Map([
    ["main.js", [parsedMainScript, lexArr, strPosArr, mainScript]]
  ]);
  let [output, log] = await scriptInterpreter.interpretScript(
    gas, undefined, "main.js", [
      isPublic, route, isPost, new ObjectWrapper(postData),
      new ObjectWrapper(options)
    ],
    reqUserID, initFlags, undefined, undefined, parsedScripts,
  );
  let [result, mimeType] = output ?? [];


  // If the script logged an error, set an error status and write back the
  // stringified log to the client.
  if (log.error) {
    // TODO: Parse and reformat log hee, before handing it to JSON.stringify().
      endWithError(res, log.error);
  }

  // Else if returnLog is true, write back an array containing the result,
  // wasReady, and also the log.
  else if (returnLog) {
    // If the result is not a text, null the result, returning only the log.
    if (mimeType.substring(0, 5) !== "text/") {
      result = null;
    }
    res.writeHead(200, {'Content-Type': 'text/json'});
    res.end(JSON.stringify([result, log]));
  }

  // And else simply write back the result with the specified MIME type, after
  // parsing the result from query() and turning it into that MIME type. (Note
  // that we should never use the MIME type of text/javascript or text/html.)
  else {
    result = toMIMEType(result);
    res.writeHead(200, {'Content-Type': mimeType});
    res.end(result);
  }

}



// toMIMEType() converts a user-defined value to a string of a certain MIME
// type. (This might need a refactoring if we can't use req.end() to send a
// binary file stream.) The corresponding fromMIMEType() is located in
// ServerQueryHandler.js.
function toMIMEType(val, mimeType) {
    if (mimeType === "text/plain") {
      return val.toString();
    }
    else if (mimeType === "text/json") {
      return jsonStringify(val);
    }
    else {
       throw `toMIMEType(): Unrecognized/un-implemented MIME type: ${mimeType}`;
    }
}





async function getGasAndReqUserID(credentials) {
  let username, password;
  // TODO...
  return [{
    comp: 100000,
    import: 100,
    fetch: 100,
    time: 3000,
    // time: Infinity,
    dbRead: 100,
    dbWrite: 10000,
    cacheRead: 100,
    cacheWrite: 100,
  }];
}




function getDataChunksPromise(req) {
  return new Promise((resolve, reject) => {
      let chunks = [];
      let size = 0;
      req.on('data', chunk => {
        chunks.push(chunk);
        size += chunk.length ?? chunk.size;
        if (size > 10000) reject(
          new ClientError("Post data maximum size exceeded")
        );
      });
      req.on('end', () => {
          resolve(chunks);
      });
  });
}


async function getData(req) {
  let chunks = await getDataChunksPromise(req);

  // TODO: Implement returning a string only if chunks are UFT-8 string parts,
  // and not binary data chunks, in which case return something like a Buffer.
  return chunks.reduce(
    (acc, val) => acc + val.toString(),
    ""
  ); 
}
