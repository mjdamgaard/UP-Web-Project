
import * as http from 'http';
import fs from 'fs';

import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {InputGetter} from './user_input/InputGetter.js';
import {ScriptInterpreter} from "../interpreting/ScriptInterpreter.js";
import {scriptParser} from "./parsing/ScriptParser.js";
import {parseRoute} from './misc/parseRoute.js';


import * as queryMod from "../dev_lib/server/query.js";
import * as directoriesMod from "../dev_lib/server/file_types/directories.js";
import * as textFilesMod from "../dev_lib/server/file_types/text_files.js";
import * as autoKeyTextStructFilesMod from
  "../dev_lib/server/file_types/auto_key_text_structs.js";
import * as binaryScoredBinaryKeyStructFilesMod from
  "../dev_lib/server/file_types/binary_scored_binary_key_structs.js";
import { permission } from 'process';

const staticDevLibs = new Map();
staticDevLibs.set("query", queryMod);
staticDevLibs.set("dir", directoriesMod);
staticDevLibs.set("text_files", textFilesMod);
staticDevLibs.set("ats_files", autoKeyTextStructFilesMod);
staticDevLibs.set("bbs_files", binaryScoredBinaryKeyStructFilesMod);


const mainScript = fs.readFileSync("./main_script/main.js", "utf8");
const [parsedMainScript, lexArr, strPosArr] = scriptParser.parse(mainScript);

const scriptInterpreter = new ScriptInterpreter(
  true, undefined, undefined, staticDevLibs, undefined
);


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

  // Call the main.js script which redirects to the query dev function, whose
  // arguments are route, cct (client cache time), and mct (minimum server
  // cache time).
  let [result, wasReady] = await scriptInterpreter.interpret(
    gas, undefined, "main.js", [route, cct, mct], reqUserID, undefined,
    undefined,
    new Map(["main.js", [parsedMainScript, lexArr, strPosArr, mainScript]])
  );

  // Return the results.
  res.writeHead(200, {'Content-Type': 'text/json'});
  res.end(JSON.stringify([result ?? null, wasReady ?? null]));
}