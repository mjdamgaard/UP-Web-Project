
import * as http from 'http';
import fs from 'fs';
import path from 'path';
// import * as process from 'process';

import {
  ClientError, endWithError, endWithInternalError, endWithUnauthenticatedError,
  endWithUnauthorizedError,
} from './err/errors.js';
import {getData} from './user_input/getData.js';
import {
  ScriptInterpreter, jsonStringify,
} from "../interpreting/ScriptInterpreter.js";
import {DBQueryHandler} from "./db_io/DBQueryHandler.js";
import {UserDBConnection, MainDBConnection} from './db_io/DBConnection.js';
import {FlagTransmitter} from "../interpreting/FlagTransmitter.js";
import {scriptParser} from "../interpreting/parsing/ScriptParser.js";

import {
  ADMIN_PRIVILEGES_FLAG, CAN_POST_FLAG,
} from "../dev_lib/query/src/flags.js";

import * as queryMod from "../dev_lib/query/query.js";
import * as jsonMod from "../dev_lib/fundamentals/json.js";
import * as stringMod from "../dev_lib/fundamentals/string.js";
import * as arrayMod from "../dev_lib/fundamentals/array.js";

const staticDevLibs = new Map();
staticDevLibs.set("query", queryMod);
staticDevLibs.set("json", jsonMod);
staticDevLibs.set("string", stringMod);
staticDevLibs.set("array", arrayMod);


const TOKEN_EXP_PERIOD = 2764800000;


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
// query path segment that starts with an underscore.
const LOCKED_ROUTE_REGEX = /\/_/;

const AUTH_TOKEN_REGEX = /^Bearer (.+)$/;
const HOME_DIR_ID_REGEX = /^\/[^/]*\/([^/]+)/;



http.createServer(async function(req, res) {
  let returnGasRef = [];
  try {
    await requestHandler(req, res, returnGasRef);
  }
  catch (err) {
    if (err instanceof ClientError) {
      endWithError(res, err);
    }
    else {
      endWithInternalError(res, err);
    }
  }
  let returnGas = returnGasRef[0];
  if (returnGas) {
    returnGas();
  }
}).listen(8080);




async function requestHandler(req, res, returnGasRef) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // If the header includes an Authorization header, immediately consult the
  // DB to authenticate the user, creating a userID promise that resolves with
  // a truthy ID only if the user is correctly authenticated.
  let userIDPromise;
  let authHeader = req.headers["authorization"];
  if (authHeader) {
    let [ , authToken] = AUTH_TOKEN_REGEX.exec(authHeader) ?? [];
    if (!authToken) throw new ClientError(
      "Invalid or unrecognized authorization header"
    );
    userIDPromise = getUserID(authToken).catch(() => {}); 
  } 

  // The server only implements GET and POST requests, where for the POST 
  // requests the request body is a JSON object.
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
    isPost = false, data: postData, flags: reqFlags = {}, options = {},
  } = reqParams;

  // Also extract some additional optional parameters from options.
  if (!options || typeof options !== "object") {
    options = {};
  }
  let {returnLog, gas: reqGas, gasID: reqGasID} = options;


  // Wait for the userID here if the authHeader was defined.
  let userID = "1"; // TODO: Change an comment in this:
  // if (authHeader) {
  //   userID = await userIDPromise;
  //   if (!userID) {
  //     endWithUnauthenticatedError(res);
  //     return;
  //   }
  // }

  // Get the gas for the interpretation, potentially using reqGas or reqGasID,
  // if provided, to determine the gas object to pass to the interpreter. If
  // the user is authenticated, gas can be withdrawn from the user DB, and else
  // some standard gas object is used (which in a future implementation might
  // be made to vary in time depending on server load).
  let [gas, returnGas] = await getGas(userID, reqGas, reqGasID);
  returnGasRef[0] = returnGas;


  // Parse whether the route is a "locked" route (which can only be accessed by
  // the admin, if any, or by a server module function (SMF) of that directory).
  // These are all paths that includes '/_' anywhere within them. If it is
  // indeed locked, query for the adminID of the home directory and verify that
  // userID == adminID, then add the "admin-privileges" flag to the 'flags,'
  // array.
  let isLocked = LOCKED_ROUTE_REGEX.test(route);
  let flags = isPost ? [CAN_POST_FLAG] : [];
  if (isLocked) {
    if (!userID) {
      endWithUnauthorizedError(res);
      return;
    }
    let [ , homeDirID] = route.match(HOME_DIR_ID_REGEX) ?? [];
    let mainDBConnection = new MainDBConnection();
    let [resultRow] = await mainDBConnection.queryProcCall(
      "readHomeDirAdminID", [homeDirID],
    ) ?? [];
    mainDBConnection.end();
    let [adminID] = resultRow ?? [];
    if (userID != adminID) {
      endWithUnauthorizedError(res);
      return;
    }
    flags.push([ADMIN_PRIVILEGES_FLAG, homeDirID]);
  }

  // Then call FlagTransmitter, with the optional reqFlags array determined by
  // the client, to get the flags which are raised initially for when the
  // main() function is executed.
  let transmittedFlags = FlagTransmitter.receiveFlags(reqFlags);
  flags = flags.concat(transmittedFlags);


  // Now run the main.js script, whose main() function redirects to a call to
  // the query() dev function.
  let virMainPath = "/1/0/main.js";
  let parsedScripts = new Map([
    [virMainPath, [parsedMainScript, lexArr, strPosArr, mainScript]]
  ]);
  let [output, log] = await scriptInterpreter.interpretScript(
    gas, undefined, virMainPath, [isPublic, route, isPost, postData, options],
    flags, parsedScripts,
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
    if (mimeType !== "text/plain" && mimeType !== "application/json") {
      result = null;
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify([result, log]));
  }

  // And else simply write back the result with the specified MIME type, after
  // parsing the result from query() and turning it into that MIME type. (Note
  // that we should never use the MIME type of text/javascript or text/html.)
  else {
    result = toMIMEType(result, mimeType);
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
  else if (mimeType === "application/json") {
    return jsonStringify(val);
  }
  else {
      throw `toMIMEType(): Unrecognized/un-implemented MIME type: ${mimeType}`;
  }
}






async function getUserID(authToken) {
  let userDBConnection = new UserDBConnection();
  let [resultRow = []] = await userDBConnection.queryProcCall(
    "selectAuthenticatedUserID", [authToken],
  ) ?? [];
  userDBConnection.end();
  let [userID] = resultRow;
  return userID;
}



async function getGas(userID, reqGas, reqGasID) {
  // TODO: Implement, instead of this placeholder definition:
  return [{
    comp: 100000,
    import: 100,
    fetch: 100,
    time: 3000,
    dbRead: 100,
    dbWrite: 10000,
    conn: 3000,
    mkdir: 10,
  }];
}


async function updateGas(userID, finalGas, isAutoRefill) {
  let userDBConnection = new UserDBConnection();
  await userDBConnection.queryProcCall(
    "updateGas", [userID, JSON.stringify(finalGas), isAutoRefill]
  );
  userDBConnection.end();
}


