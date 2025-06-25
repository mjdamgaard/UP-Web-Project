
import * as http from 'http';
const bcrypt = require('bcrypt');

import {
  ClientError, endWithError, endWithInternalError,
} from './err/errors.js';
import {getData} from './ajax_server.js';
import {UserDBConnection} from './db_io/DBConnection.js';

const SALT_ROUNDS = 13; // (Number of rounds = 2^SALT_ROUNDS.)


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
}).listen(8081);




async function requestHandler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // The server only implements POST requests where the request type is
  // specified by the URL pathname, and where the optional request body, if
  // there, is a plain text e-mail address.
  let reqType = req.url;
  if (req.method !== "POST") throw new ClientError(
    "Login server only accepts the POST methods"
  );
  let emailAddr = await getData(req);

  // Get user name and the password from the Authorization header.

  // Then branch according to the request type
  switch (reqType) {
    case "createAccount": {
      let [userID, authToken] = await createAccount(
        username, password, emailAddr
      );
      res.writeHead(201, {'Content-Type': "application/json"});
      res.end(JSON.stringify([userID, authToken]));
      break;
    }
    case "login": {
      let [userID, authToken] = await login(username, password);
      res.writeHead(200, {'Content-Type': "application/json"});
      res.end(JSON.stringify([userID, authToken]));
      break;
    }
    case "logout": {
      let wasLoggedOut = await logout(username, password, res);
      res.writeHead(200, {'Content-Type': "application/json"});
      res.end(wasLoggedOut ? "true" : "false");
      break;
    }
    default: throw new ClientError(
      "Unrecognized reqType"
    );
  }

}




async function createAccount(username, password, emailAddr) {
  validateUsernamePWAndEmailFormat(username, password, emailAddr);
  let pwHash = await generateSaltedPWHash(password);
  let userDBConnection = new UserDBConnection();

  // Create the new account and get the new user ID.
  let [resultRow = []] = await userDBConnection.queryProcCall(
    "createUserAccount", [username, pwHash, emailAddr ?? ""],
  ) ?? [];
  let [userID] = resultRow;

  // Then generate (and store) a new authentication token for the user.
  [resultRow = []] = await userDBConnection.queryProcCall(
    "generateAuthToken", [userID],
  ) ?? [];
  let [authToken] = resultRow;

  userDBConnection.end();
  return [userID, authToken];
}



async function login(username, password) {
  validateUsernamePWAndEmailFormat(username, password);
  let userDBConnection = new UserDBConnection();

  // Get the actual pwHash, and the userID, from the database.
  let [resultRow = []] = await userDBConnection.queryProcCall(
    "selectPWHashAndUserID", [username],
  ) ?? [];
  let [pwHash = "", userID = ""] = resultRow;

  userDBConnection.end();

  // Compare the two passwords, and return and empty array if the comparison
  // failed.
  if (!(await bcrypt.compare(password, pwHash))) {
    return [];
  }

  userDBConnection = new UserDBConnection();

  // Then generate (and store) a new authentication token for the user.
  [resultRow = []] = await userDBConnection.queryProcCall(
    "generateAuthToken", [userID],
  ) ?? [];
  let [authToken] = resultRow;

  userDBConnection.end();

  return [userID, authToken];
}



async function logout(username, password) {
  validateUsernamePWAndEmailFormat(username, password);
  let userDBConnection = new UserDBConnection();

  // Get the actual pwHash, and the userID, from the database.
  let [resultRow = []] = await userDBConnection.queryProcCall(
    "selectPWHashAndUserID", [username],
  ) ?? [];
  let [pwHash = "", userID = ""] = resultRow;

  userDBConnection.end();

  // Compare the two passwords, and return false if the comparison failed.
  if (!(await bcrypt.compare(password, pwHash))) {
    return false;
  }

  userDBConnection = new UserDBConnection();

  // Then delete the stored authToken, if any, for the given userID.
  [resultRow = []] = await userDBConnection.queryProcCall(
    "deleteAuthToken", [userID],
  ) ?? [];
  let [wasLoggedOut] = resultRow;

  userDBConnection.end();

  return wasLoggedOut;
}








function validateUsernamePWAndEmailFormat(username, password, emailAddr = "") {
  if (!username || !/^[a-zA-Z_-]{4, 40}$/.test(username)) {
    throw new ClientError(
      "Invalid username"
    );
  }
  if (!password || !/^[a-zA-Z_-]{4}{3, 40}$/.test(password)) {
    throw new ClientError(
      "Invalid base-64-encoded password"
    );
  }
  // TODO: Implement validation.
  if (emailAddr && !/^.$/.test(emailAddr)) {
    throw new ClientError(
      "Invalid e-mail address ()"
    );
  }
}

async function generateSaltedPWHash(password) {
  let salt = await bcrypt.genSalt(SALT_ROUNDS);
  let pwHashSalted = await bcrypt.hash(password, salt);
  return pwHashSalted;
}
