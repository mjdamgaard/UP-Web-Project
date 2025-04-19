
import * as http from 'http';
import {ClientError, endWithError, endWithInternalError} from './err/errors.js';
import {InputGetter} from './user_input/InputGetter.js';
import {DBQueryHandler} from './db_io/DBQueryHandler.js';

// console.log(String({toString: null}))

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

  // Get user ID and session ID at first if provided.
  let body = await InputGetter.getBodyPromise(req);
  let [action, credentials] = await InputGetter.getParamsPromise(
    body, ["action", "credentials"], [undefined, null] // An undefined default
    // value means that it is required; the 'action' parameter is required.
  );


  // TODO: If credentials is not null, authenticate the user here, throwing an
  // error on failure, and setting the reqUserID to the user's ID on success.
  let reqUserID = undefined;


  // Branch according to the action.
  let result;
  switch (action) {
    case "read": {
      let [
        route, clientCacheTime, minServerCacheTime
      ] = await InputGetter.getParamsPromise(
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
        body, ["route", "content", "isBase64"], [undefined, undefined, false]
      );
      result = await DBQueryHandler.put(
        reqUserID, route, content, isBase64
      );
      // result: wasCreated.
      break;
    }
    // case "create": {
    //   let [
    //     route, content, isBase64
    //   ] = await InputGetter.getParamsPromise(
    //     body, ["route"], [undefined, undefined, false]
    //   );
    //   result = await DBQueryHandler.write(
    //     reqUserID, route, content, isBase64
    //   );
    //   // result: wasCreated.
    //   break;
    // }
    case "delete":
      // TODO: Implement.
    case "call":
      // TODO: Implement.
    default:
        throw new ClientError(`Unrecognized action: "${action}"`);
  }

  // Return the results.
  res.writeHead(200, {'Content-Type': 'text/json'});
  res.end(JSON.stringify(result));
}