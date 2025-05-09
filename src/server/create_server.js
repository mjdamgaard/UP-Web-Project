
import * as http from 'http';
import fs from 'fs';

import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {ScriptInterpreter} from "../interpreting/ScriptInterpreter.js";
import {scriptParser} from "./parsing/ScriptParser.js";

import {SET_ELEVATED_PRIVILEGES_SIGNAL}
  from "../dev_lib/server/db_src/signals.js";

import * as dbMod from "../dev_lib/server/db.js";
import * as directoriesMod from "../dev_lib/server/file_types/directories.js";
import * as textFilesMod from "../dev_lib/server/file_types/text_files.js";
import * as autoKeyTextStructFilesMod
  from "../dev_lib/server/file_types/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod
  from "../dev_lib/server/file_types/binary_scored_binary_key_structs.js";


const staticDevLibs = new Map();
staticDevLibs.set("db", dbMod);
staticDevLibs.set("dir", directoriesMod);
staticDevLibs.set("text_files", textFilesMod);
staticDevLibs.set("ats_files", autoKeyTextStructFilesMod);
staticDevLibs.set("bbs_files", binaryScoredBinaryKeyStructFilesMod);


const mainScript = fs.readFileSync("./main_script/main.js", "utf8");
const [parsedMainScript, lexArr, strPosArr] = scriptParser.parse(mainScript);

const scriptInterpreter = new ScriptInterpreter(
  true, undefined, undefined, staticDevLibs, undefined
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

  // At this point, the server only implements POST requests where all the
  // parameters are stored in a JSON object. Parse from this the 'method' and
  // the 'route' (an extended path), which points to the file or directory that
  // is the target of the request, as well as the optional user credentials,
  // the optional maxAge, noCache, and lastModified parameters. Also get the
  // optional postData parameter (used when method == "post").
  let reqParams, isValidJSON = true;
  try {
    resolve(JSON.parse(data));
  }
  catch (err) {
    isValidJSON = false;
  }
  if (!isValidJSON || !reqParams || typeof reqParams !== "object") {
    throw new ClientError(
      "Post body was not a JSON object"
    );
  }

  let {
    method, route, credentials, maxAge, noCache, lastModified, postData
  } = reqParams;

  if (!method) throw new ClientError(
    "No 'method' parameter was specified in the POST body"
  );
  if (!route) throw new ClientError(
    "No 'route' parameter was specified in the POST body"
  );


  // Get the userID of the requesting user, if the user has supplied their
  // credentials to the request, failing if those credentials couldn't be
  // authenticated. Also get the gas for the request in the same process.
  let [gas, reqUserID] = await getGasAndReqUserID(req);


  // Parse whether the route is a "locked" route (that can only be accessed by
  // the admin, if any, or by a server module method (SMM) of that directory).
  let isLocked = LOCKED_ROUTE_REGEX.test(route);

  // TODO: If the route it locked, get the adminID of the homeDir, and verify
  // that reqUser is the admin, then initialize initScriptSignals with a
  // SET_ELEVATED_PRIVILEGES_SIGNAL on homeDirID. And if the route is not
  // locked, initialize an empty initScriptSignals array.
  let initScriptSignals = [SET_ELEVATED_PRIVILEGES_SIGNAL, route[1]];

  // Call the main.js script which redirects to the query() dev function, whose
  // arguments are: method, route, postData, maxAge, noCache, and lastModified.
  let parsedScripts = new Map(
    ["main.js", [parsedMainScript, lexArr, strPosArr, mainScript]]
  );
  let [output, log] = await scriptInterpreter.interpret(
    gas, undefined, "main.js",
    [method, route, postData, maxAge, noCache, lastModified],
    reqUserID, initScriptSignals, undefined, undefined, parsedScripts,
  );
  let [result, wasReady] = output ?? [];

  // TODO: Parse and reformat log hee, before handing it to JSON.stringify().

  // Return the results.
  res.writeHead(200, {'Content-Type': 'text/json'});
  res.end(JSON.stringify([result, log, wasReady]));
}







async function getGasAndReqUserID(req) {
  let username, password;
  let [ , credentials] = /^Basic (.+)$/.exec(
    req.getHeader("authorization") ?? ""
  );

}




function getDataChunksPromise(req) {
  return new Promise((resolve, reject) => {
      let chunks = [];
      let size = 0;
      req.on('data', chunk => {
        chunks.push(chunk);
        size += chunk.length ?? chunk.size;
        data += chunk.toString();
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
