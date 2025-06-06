
import * as http from 'http';
import fs from 'fs';
import path from 'path';
// import * as process from 'process';

import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {
  ScriptInterpreter, RuntimeError, jsonStringify,
} from "../interpreting/ScriptInterpreter.js";
import {DBQueryHandler} from "./db_io/DBQueryHandler.js";
import {UserDBConnection} from './db_io/DBConnection.js';
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
  true, undefined, dbQueryHandler, staticDevLibs, undefined
);

// Locked routes are all routes where any file name, directory name, or
// query path property name contains a tilde (~).
const LOCKED_ROUTE_REGEX = /~/;




http.createServer(async function(req, res) {
  let userID, initGas, finalGas, lastAutoRefill;
  try {
    [userID, initGas, lastAutoRefill] = await getUserIDAndGas(req);
    finalGas = await requestHandler(req, res, userID, initGas);
  }
  catch (err) {
    if (err instanceof ClientError) {
      endWithError(res, err);
    }
    else {
      endWithInternalError(res, err);
    }
  }
  if (userID) {
    try {
      // TODO: If the lastAutoRefill time is long enough ago, add some extra
      // gas into finalGas, and also set isAutoRefill = true such that the
      // lastAutoRefill time is updated.
      let isAutoRefill = false; // TODO: Change.
      await updateGas(userID, finalGas, isAutoRefill);
    }
    catch (err) {
      console.error(err);
    }
  }
}).listen(8080);




async function requestHandler(req, res, userID, initGas) {
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
        "Post request body not a JSON object"
      );
    }
  }
  else if (req.method !== "GET") throw new ClientError(
    "Server only accepts the GET and POST methods"
  );

  // Get optional isPost and postData, as well as the optional user credentials
  // (username and password/token), and the options parameter.
  let {
    isPost = false, postData, flags, options = {},
  } = reqParams;

  // Also extract some additional optional parameters from options. 
  let {gas, gasID, returnLog} = options;


  // TODO: Use gas or gasID, if provided, to determine the gas object to pass
  // to the interpreter, which should generally be a reduced version of
  // initGas.
  gas = {...initGas}; // TODO: Change. 


  // Parse whether the route is a "locked" route (that can only be accessed by
  // the admin, if any, or by a server module function (SMF) of that directory).
  // These are all paths that include a tilde ('~') anywhere in them.
  let isLocked = LOCKED_ROUTE_REGEX.test(route);

  // TODO: If the route it locked, get the adminID of the homeDir, and verify
  // that reqUser is the admin, then initialize initFlags with a
  // SET_ELEVATED_PRIVILEGES_SIGNAL on homeDirID. And if the route is not
  // locked, initialize an empty initFlags array.
  let initFlags = [[ELEVATED_PRIVILEGES_FLAG, route[1]]]; // TODO: Change. 


  // Call the main.js script which redirects to the query() dev function.
  let parsedScripts = new Map([
    ["main.js", [parsedMainScript, lexArr, strPosArr, mainScript]]
  ]);
  let [output, log] = await scriptInterpreter.interpretScript(
    gas, undefined, "main.js", [
      isPublic, route, isPost, new ObjectWrapper(postData),
      new ObjectWrapper(options)
    ],
    initFlags, undefined, undefined, parsedScripts,
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






async function getUserIDAndGas(req) {
  // Get authentication token if one is provided.
  let authToken = !req || "test_token"; // TODO: Change.

  // If an auth. token is provided, query the user DB to get the userID, and
  // a JSON object containing all the user's gas (not withdrawn yet).
  if (authToken === undefined) {
    return [];
  }
  else {
    let userDBConnection = new UserDBConnection();
    let [resultRow = []] = await userDBConnection.queryProcCall(
      "selectUserIDAndGas", [authToken]
    ) ?? [];
    let [userID, gasJSON, lastAutoRefill] = resultRow;
    userDBConnection.end();
    let initGas = JSON.parse(gasJSON);
    return [userID, initGas, lastAutoRefill];
  }
}



async function updateGas(userID, finalGas, isAutoRefill) {
  let userDBConnection = new UserDBConnection();
  await userDBConnection.queryProcCall(
    "updateGas", [userID, JSON.stringify(finalGas)]
  );
  userDBConnection.end();
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
        if (size > 4294967295) reject(
          new ClientError("Post data maximum size exceeded")
        );
      });
      req.on('end', () => {
          resolve(chunks);
      });
  });
}


export async function getData(req) {
  let chunks = await getDataChunksPromise(req);

  // TODO: Implement returning a string only if chunks are UFT-8 string parts,
  // and not binary data chunks, in which case return something like a Buffer.
  return chunks.reduce(
    (acc, val) => acc + val.toString(),
    ""
  ); 
}
