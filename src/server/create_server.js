
import * as http from 'http';
import fs from 'fs';
import path from 'path';
import * as process from 'process';

import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {ScriptInterpreter} from "../interpreting/ScriptInterpreter.js";
import {scriptParser} from "../interpreting/parsing/ScriptParser.js";

import {SET_ELEVATED_PRIVILEGES_SIGNAL}
  from "../dev_lib/server/db_src/signals.js";

import * as dbMod from "../dev_lib/server/db.js";

const staticDevLibs = new Map();
staticDevLibs.set("db", dbMod);


const [ , curPath] = process.argv;
const mainScriptPath = path.normalize(
  path.dirname(curPath) + "/main_script/main.js"
);
const mainScript = fs.readFileSync(mainScriptPath, "utf8");

const [syntaxTree, lexArr, strPosArr] = scriptParser.parse(mainScript);
const parsedMainScript = syntaxTree.res;

const scriptInterpreter = new ScriptInterpreter(
  true, undefined, staticDevLibs, undefined
);

const LOCKED_ROUTE_REGEX = /[&/]_/;




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

  let data;
  if (req.method === "POST") {
    data = await getData(req);
  }
  else if (req.method !== "GET") {
    throw new ClientError(
      "Server only accepts the POST or GET methods"
    );
  }
  else {
    throw new ClientError(
      "Server does not implement the GET method yet"
    );
  }

  // At this point, the server only implements POST requests where most of the
  // parameters are stored in a JSON object. Parse from this the 'method', as
  // well as the optional maxAge, noCache, and lastModified parameters, and the
  // optional postData parameter (used when method == "post"). Also get the a
  // gasEnum and a scriptSignalsEnum, which points to a gas and a scriptSignals
  // object, respectively, which can influence whether the script succeeds or
  // fails (but don't change the result on a success).
  // First get and parse the request params.
  let reqParams, isValidJSON = true;
  try {
    reqParams = JSON.parse(data);
  }
  catch (err) {
    isValidJSON = false;
  }
  if (!isValidJSON || !reqParams || typeof reqParams !== "object") {
    throw new ClientError(
      "Post body was not a JSON object"
    );
  }

  // Then extract the parameters from it.
  let {
    // Get the optional user credentials (username and password/token).
    credentials,
    // Get the 'method', and the optional postData parameter (used when
    // method == "post").
    method = "fetch", postData,
    // Get the optional maxAge, noCache, and lastModified parameters used by
    // caches.
    maxAge, noCache, lastModified,
    // Get the optional gasEnum and a scriptSignalsEnum, which points to a gas
    // and a scriptSignals object, respectively, which can both influence
    // whether the script succeeds or fails (but don't change the result on a
    // success).
    gasEnum, scriptSignalsEnum,
    // Get the returnLog boolean, which if not present means that the script's
    // result will be returned on its own, without the log (which might be
    // empty anyway).
    returnLog,
  } = reqParams;

  if (!method) throw new ClientError(
    "No 'method' parameter was specified in the POST body"
  );

  // And get the "route" from the URL, which is an extended path that points to
  // the file or directory that is the target of the request.
  let route = req.url;


  // Get the userID of the requesting user, if the user has supplied their
  // credentials to the request, failing if those credentials couldn't be
  // authenticated. Also get the gas for the request in the same process.
  let [gas, reqUserID] = await getGasAndReqUserID(credentials, gasEnum);


  // Parse whether the route is a "locked" route (that can only be accessed by
  // the admin, if any, or by a server module method (SMM) of that directory).
  let isLocked = LOCKED_ROUTE_REGEX.test(route);

  // TODO: If the route it locked, get the adminID of the homeDir, and verify
  // that reqUser is the admin, then initialize scriptSignals with a
  // SET_ELEVATED_PRIVILEGES_SIGNAL on homeDirID. And if the route is not
  // locked, initialize an empty scriptSignals array.
  let scriptSignals = [[SET_ELEVATED_PRIVILEGES_SIGNAL, route[1]]];


  // Call the main.js script which redirects to the query() dev function, whose
  // arguments are: method, route, postData, maxAge, noCache, and lastModified.
  let parsedScripts = new Map([
    ["main.js", [parsedMainScript, lexArr, strPosArr, mainScript]]
  ]);
  let [output, log] = await scriptInterpreter.interpretScript(
    gas, undefined, "main.js",
    [method, route, postData, maxAge, noCache, lastModified],
    reqUserID, scriptSignals, undefined, undefined, parsedScripts,
  );
  let [result, wasReady] = output ?? [];


  // If the script logged an error, set an error status and write back the
  // stringified log to the client.
  if (log.error) {
    // TODO: Parse and reformat log hee, before handing it to JSON.stringify().
    endWithError(res, log.error);
  }

  // Else if returnLog is true, write back an array containing the result and
  // the log, and also add wasReady to the array, for good measure.
  else if (returnLog) {
    res.writeHead(200, {'Content-Type': 'text/json'});
    res.end(JSON.stringify([result, log, wasReady]));
  }

  // Else if wasReady is true, write back a 204 No Content response.
  else if (wasReady) {
    res.writeHead(204);
    res.end("");
  }

  // And else simply write back the stringified result.
  else {
    res.writeHead(200, {'Content-Type': 'text/json'});
    res.end(JSON.stringify(result));
  }

}







async function getGasAndReqUserID(credentials) {
  let username, password;
  // TODO...
  return [{
    comp: 100000,
    import: 100,
    fetch: 100,
    time: Infinity,
    dbRead: 100,
    dbWrite: 10000,
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
