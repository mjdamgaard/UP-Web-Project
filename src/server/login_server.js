
import * as http from 'http';

import {UserDBConnection, getProcCallSQL} from "./DBConnection.js";
import {getData} from './ajax_server.js';



http.createServer(async function(req, res) {
  try {
    await requestHandler(req, res);
  }
  catch (err) {
      endWithInternalError(res, err);
  }
}).listen(8081);




async function requestHandler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // The server only implements POST requests where the request body is a
  // JSON object.
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
  else throw new ClientError(
    "Login server only accepts the POST methods"
  );

  // Get optional isPost and postData, as well as the optional user credentials
  // (username and password/token), and the options parameter.
  let {
    isPost = false, postData, flags, options = {},
  } = reqParams;

}


