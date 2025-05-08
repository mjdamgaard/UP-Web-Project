
import * as http from 'http';
import fs from 'fs';

import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {InputGetter} from './user_input/InputGetter.js';
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

  if (req.method !== "POST") {
    throw new ClientError(
      "Server only accepts the POST method"
    );
  }

  // Get user credentials at first if provided, as well as the mandatory 'route'
  // (an extended path), which points to the file or directory that is the
  // target of the request, and thus which developer library handles it. Also
  // get the optional client cache time, 'cct', and the requested maximum
  // server-side) cache time, 'mct', which are used for read requests.
  let body = await InputGetter.getBodyPromise(req);
  let [
    credentials, method, route, postData, receiverCacheTime, cachePeriod
  ] = await InputGetter.getParamsPromise(
    body,
    ["credentials", "method", "route", "data", "rct", "cp"],
    // (An undefined default value means that it is required. The 'route'
    // parameter is thus required here, whereas 'credentials' is not.)
    [null, "fetch", undefined, null, null]
  );


  // TODO: If credentials is not null, authenticate the user here, throwing an
  // error on failure, and setting the reqUserID to the user's ID on success.
  let reqUserID = 9;


  // TODO: Get the gas object.
  let gas = {};


  // Parse whether the route is a "locked" route (that can only be accessed by
  // the admin, if any, or by a server module method (SMM)).
  let isLocked = LOCKED_ROUTE_REGEX.test(route);

  // TODO: If the route it locked, get the adminID of the homeDir, and verify
  // that reqUser is the admin, then initialize initScriptSignals with a
  // SET_ELEVATED_PRIVILEGES_SIGNAL on homeDirID. And if the route is not
  // locked, initialize an empty initScriptSignals array.
  let initScriptSignals = [SET_ELEVATED_PRIVILEGES_SIGNAL, route[1]];

  // Call the main.js script which redirects to the query dev function, whose
  // arguments are route, cct (client cache time), and mct (minimum server
  // cache time).
  let parsedScripts = new Map(
    ["main.js", [parsedMainScript, lexArr, strPosArr, mainScript]]
  );
  let [output, log] = await scriptInterpreter.interpret(
    gas, undefined, "main.js",
    [method, route, postData, receiverCacheTime, cachePeriod],
    reqUserID, initScriptSignals, undefined, undefined, parsedScripts,
  );
  let [result, wasReady] = output ?? [];

  // TODO: Parse and reformat log hee, before handing it to JSON.stringify().

  // Return the results.
  res.writeHead(200, {'Content-Type': 'text/json'});
  res.end(JSON.stringify([result, log, wasReady]));
}