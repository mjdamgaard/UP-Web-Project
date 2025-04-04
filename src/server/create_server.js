
import * as http from 'http';
import {InputGetter} from './user_input/InputGetter.js';
import {ClientError, endWithError, endWithInternalError} from './err/errors.js';

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
  switch (action) {
    case "read":
      // ...
      break;
    default:
        throw new ClientError(`Unrecognized action: "${action}"`);
  }


  // Get the required input for the given request type.
  let paramValArr = await InputGetter.getParamsPromise(
    req, paramNameArr, defaultValArr
  );

  // Validate the input.
  InputValidator.validateParams(paramValArr, typeArr, paramNameArr);

  // Query the database.
  let results = await DBConnector.connectAndQuery(sql, paramValArr);

  // Return the results.
  res.writeHead(200, {'Content-Type': 'text/json'});
  res.end(JSON.stringify(results));
}