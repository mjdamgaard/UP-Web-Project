
import * as http from 'http';
// import * as process from 'process';

import {
  ClientError, endWithError, endWithInternalError, endWithUnauthenticatedError,
  endWithUnauthorizedError,
} from './err/errors.js';
import {getData} from './user_input/getData.js';
import {
  ScriptInterpreter, jsonStringify, getExtendedErrorMsg, Exception,
} from "../interpreting/ScriptInterpreter.js";
import {queryDB} from '../dev_lib/query/src/queryDB.js';
import {UserDBConnection, MainDBConnection} from './db_io/DBConnection.js';
import {FlagTransmitter} from "../interpreting/FlagTransmitter.js";
import {scriptParser} from "../interpreting/parsing/ScriptParser.js";

import {
  ELEVATED_PRIVILEGES_FLAG, CAN_POST_FLAG, USER_ID_FLAG,
  REQUEST_ADMIN_PRIVILEGES_FLAG, GRANT_ADMIN_PRIVILEGES_FLAG,
} from "../dev_lib/query/src/flags.js";


/* Static developer libraries */

import * as queryMod from "../dev_lib/query/query.js";
import * as connMod from "../dev_lib/db_connection/connection.js";
import * as jsonMod from "../dev_lib/fundamentals/json.js";
import * as stringMod from "../dev_lib/fundamentals/string.js";
import * as arrayMod from "../dev_lib/fundamentals/array.js";
import * as objectMod from "../dev_lib/fundamentals/object.js";
import * as numberMod from "../dev_lib/fundamentals/number.js";
import * as mathMod from "../dev_lib/fundamentals/math.js";
import * as dateMod from "../dev_lib/fundamentals/date.js";
import * as promiseMod from "../dev_lib/fundamentals/promise.js";
import * as reqOrigMod from "../dev_lib/request.js";
import * as hexMod from "../dev_lib/conversion/hex.js";
import * as errorMod from "../dev_lib/error.js";
import * as typeMod from "../dev_lib/type.js";
import * as routeMod from "../dev_lib/route.js";
import * as pathMod from "../dev_lib/path.js";
import * as scoredListsMod from "../dev_lib/semantic_entities/scored_lists.js";
import * as entitiesMod from "../dev_lib/semantic_entities/entities.js";

const staticDevLibs = new Map();
staticDevLibs.set("query", queryMod);
staticDevLibs.set("connection", connMod);
staticDevLibs.set("json", jsonMod);
staticDevLibs.set("string", stringMod);
staticDevLibs.set("array", arrayMod);
staticDevLibs.set("object", objectMod);
staticDevLibs.set("number", numberMod);
staticDevLibs.set("math", mathMod);
staticDevLibs.set("date", dateMod);
staticDevLibs.set("promise", promiseMod);
staticDevLibs.set("request", reqOrigMod);
staticDevLibs.set("hex", hexMod);
staticDevLibs.set("error", errorMod);
staticDevLibs.set("type", typeMod);
staticDevLibs.set("route", routeMod);
staticDevLibs.set("path", pathMod);
staticDevLibs.set("scored_lists", scoredListsMod);
staticDevLibs.set("entities", entitiesMod);


// The following gas objects and constants can be adjusted over time.
const stdGetReqGas = {
  comp: 10000,
  import: 200,
  fetch: 100,
  time: 6000,
  dbRead: 100,
};
const stdPostReqGas = {
  comp: 100000,
  import: 500,
  fetch: 500,
  time: 15000,
  dbRead: 1000,
  dbWrite: 100000,
  conn: 20000,
  mkdir: 1,
  mkTable: 0,
};
const stdElevatedPostReqGas = {
  comp: 1000000,
  import: 2000,
  fetch: 500,
  time: 15000,
  dbRead: 1000,
  dbWrite: 100000,
  conn: 200000,
  mkdir: 1,
  mkTable: 0,
};
const AUTO_REFILL_PERIOD = 604800; // ~= 1 week in seconds.
const autoRefillGas = {
  comp: 10000000,
  import: 50000,
  fetch: 50000,
  time: 1000000,
  dbRead: 1000000,
  dbWrite: 1000000,
  conn: 1000000,
  mkdir: 100,
  mkTable: 0,
};

// const TOKEN_EXP_PERIOD = 7948800; // ~= 3 months in seconds.


const mainScript = `
  import {queryRoute} from 'query';

  export function main(
    route, isPost, postData, options, resolve
  ) {
    queryRoute(route, isPost, postData, options).then(
      output => resolve(output)
    );
  }
`;

const [syntaxTree, lexArr, strPosArr] = scriptParser.parse(mainScript);
const parsedMainScript = syntaxTree.res;

const scriptInterpreter = new ScriptInterpreter(
  true, undefined, queryDB, staticDevLibs, undefined
);

// Locked routes are all routes where any file name, directory name, or
// query path segment that starts with an underscore.
const LOCKED_ROUTE_REGEX = /\/_/;

const AUTH_TOKEN_REGEX = /^Bearer (.+)$/;
const HOME_DIR_ID_REGEX = /^\/[0-9a-f]+\/([0-9a-f]+)/;






let [ , , port] = process.argv;
port = port ? parseInt(port) : 8080;


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
    returnGas().catch(err => console.error(err));
  }
}).listen(port);




async function requestHandler(req, res, returnGasRef) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  if (req.method === "OPTIONS") {
    res.setHeader("Cache-Control", "max-age=604800");
    res.end("");
    return;
  }

  // The server only implements GET and POST requests, where for the POST 
  // requests the request body is a JSON object.
  let route = req.url;
  let reqParams = {};
  let isPrivate = false;
  if (req.method === "POST") {
    // Set isPrivate as true, and get and parse the request params.
    isPrivate = true;
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
  if (isPrivate) {
    options.isPrivate = true;
  }
  let {returnLog, gas: reqGas = {}} = options;

  // For now, we ignore the reqGas object, as this gives the early developers/
  // user programmers the possibility not to use database transactions. When we
  // then implement database transactions (which won't take long), we can give
  // these devs/users a little time to correct their SMs before we remove the
  // following line again.
  reqGas = {};  


  // Call FlagTransmitter.receiveFlags(), with the optional reqFlags array
  // determined by the client, to get the flags which are raised initially for
  // when the main() function is executed.
  let flags = FlagTransmitter.receiveFlags(reqFlags);


  // If the header includes an Authorization header, query the DB in order to
  // authenticate the user. We obtain the userID in this process as well, which
  // we use it to set the "user ID context" (which has this form due to
  // compatibility with the front-end interpreter). We also get the gas for the
  // interpretation in the same process.
  let userID, gas, returnGas;
  let requestAdminPrivileges = flags.includes(REQUEST_ADMIN_PRIVILEGES_FLAG);
  let authHeader = req.headers["authorization"];
  if (authHeader) {
    let [ , authToken] = AUTH_TOKEN_REGEX.exec(authHeader) ?? [];
    if (!authToken) throw new ClientError(
      "Invalid or unrecognized authorization header"
    );
    let stdGas = requestAdminPrivileges ? stdElevatedPostReqGas : stdPostReqGas;
    [userID, gas, returnGas] = await getUserIDAndGas(
      authToken, stdGas, reqGas
    );
    if (!userID) {
      endWithUnauthenticatedError(res);
      return;
    }
  }
  if (userID) {
    returnGasRef[0] = returnGas;
  } else {
    if (isPrivate) {
      endWithUnauthenticatedError(res);
      return;
    }
    gas = Object.assign({}, stdGetReqGas);
  }



  // Parse whether the route is a "locked" route (which can only be accessed by
  // the admin, if any, or by a server module function (SMF) of that directory).
  // These are all paths that includes '/_' anywhere within them. If it is
  // indeed locked, query for the adminID of the home directory and verify that
  // userID == adminID, and that the user has requested admin privileges, then
  // add the "elevated-privileges" flag to the 'flags' array.
  let isLocked = LOCKED_ROUTE_REGEX.test(route);
  if (isPost) flags.push(CAN_POST_FLAG);
  if (isLocked || requestAdminPrivileges) {
    if (!userID || isLocked && !requestAdminPrivileges) {
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
    flags.push([ELEVATED_PRIVILEGES_FLAG, homeDirID]);
    if (requestAdminPrivileges) {
      flags.push([GRANT_ADMIN_PRIVILEGES_FLAG, true]);
    }
  }
  if (userID) {
    flags.push([USER_ID_FLAG, userID]);
  }



  // Now run the main.js script, whose main() function redirects to a call to
  // the query() dev function.
  let virMainPath = "/1/0/main.js";
  let parsedScripts = new Map([
    [virMainPath, [parsedMainScript, lexArr, strPosArr, mainScript]]
  ]);
  let [result, log] = await scriptInterpreter.interpretScript(
    gas, undefined, virMainPath, [route, isPost, postData, options],
    flags, {}, parsedScripts,
  );


  // If returnLog is true, write back an array containing the result and the
  // log.
  if (returnLog) {
    if (log.error instanceof Exception) {
      log.error = getExtendedErrorMsg(log.error);
    }
    result = jsonStringify([result, log]);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(result);
  }

  // Else if the script logged an error, write back the error to the client.
  else if (log.error) {
    endWithError(res, log.error);
  }

  // And else simply write back the result with the specified MIME type, after
  // parsing the result from query() and turning it into that MIME type. (Note
  // that we should never use the MIME type of text/javascript or text/html.)
  else {
    let mimeType;
    [result, mimeType] = serialize(result);
    res.writeHead(200, {'Content-Type': mimeType});
    res.end(result);
  }

}



// serialize() converts a user-defined value to a string or a binary buffer
// (once this is implemented, and assuming that res.end() can handle a binary
// buffer) and returns along with that the MIME type to pair with it.
function serialize(val) {
  if (typeof val == "string") {
    return [val, "text/plain"];
  }
  else {
    return [jsonStringify(val), "application/json"];
  }
  // TODO: Implement other MIME types if and when needed. 
}





// getUserIDAndGas() reads the userID and the user's gas reserve from the DB,
// then uses a standard gas object (which in a future implementation might be
// made to vary in time depending on server load)) and the reqGas input, if
// provided, to construct and return the gas object used for the interpreter as
// well. Note that the reqGas's properties will overwrite those of the std. gas
// object. The function also returns a callback function, returnGas().
async function getUserIDAndGas(authToken, stdGas, reqGas) {
  // Get the userID and the user's gas reserve.
  let userDBConnection = new UserDBConnection();
  let [resultRow = []] = await userDBConnection.queryProcCall(
    "selectAuthenticatedUserIDAndGas", [authToken, 1],
  ) ?? [];
  let [userID, gasReserveJSON = '{}', autoRefilledAt = 0] = resultRow;
  let gasReserve = JSON.parse(gasReserveJSON);

  if (!userID) {
    return [];
  }

  // If long enough time has passed since last auto-refill, refill the user's
  // reserve before continuing.
  if ((autoRefilledAt + AUTO_REFILL_PERIOD) * 1000 < Date.now()) {
    assignGreatest(gasReserve, autoRefillGas);
    await userDBConnection.queryProcCall(
      "updateGas", [userID, JSON.stringify(gasReserve), 1, 0],
    );
  }

  // Now construct the request the requested gas object from the standard
  // post request gas object and the optional reqGas object, and limit the
  // result by the gas available in the user's reserve as well. Also
  // decrement the DB read gas by 1 o pay for looking up the gas reserve.
  let initGas = assignLeastPositiveOrUndefined(
    Object.assign({}, stdGas, reqGas), gasReserve
  );
  let gas = Object.assign({}, initGas);
  gas.dbRead = (gas.dbRead ?? 0) - 1;

  // Now construct the returnGas() function to be executed at the end of the
  // request (even if the request fails.)
  let returnGas = async () => {
    let newGasReserve = subtractAbs(gasReserve, subtractAbs(initGas, gas));
    await userDBConnection.queryProcCall(
      "updateGas", [userID, JSON.stringify(newGasReserve), 0, 1],
    );
    userDBConnection.end();
  };

  return [userID, gas, returnGas]
}



function assignGreatest(target, ...sourceArr) {
  sourceArr.forEach(source => {
    Object.entries(source).forEach(([key, sourceVal]) => {
      let targetVal = target[key];
      target[key] = (targetVal === undefined) ? sourceVal :
        (targetVal < sourceVal) ? sourceVal : targetVal;
    });
  });
  return target;
}

function assignLeastPositiveOrUndefined(target, ...sourceArr) {
  Object.entries(target).forEach(([key, targetVal]) => {
    targetVal = Math.abs(targetVal);
    sourceArr.forEach(source => {
      let sourceVal = Math.abs(source[key]);
      target[key] = (sourceVal === undefined) ? sourceVal :
        (targetVal <= sourceVal) ? targetVal : sourceVal;
    });
  });
  return target;
}

function subtractAbs(minuendObj, subtrahendObj) {
  let ret = {};
  Object.entries(minuendObj).forEach(([key, val]) => {
    ret[key] = val - Math.abs(subtrahendObj[key]);
  });
  return ret;
}


