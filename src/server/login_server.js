
import * as http from 'http';
import * as bcrypt from 'bcrypt';

import {
  ClientError, endWithError, endWithInternalError,
} from './err/errors.js';
import {getData} from './user_input/getData.js';
import {UserDBConnection} from './db_io/DBConnection.js';

const SALT_ROUNDS = 13; // (Number of rounds = 2^SALT_ROUNDS.)
const MAX_ACCOUNT_NUM = 10; // Number of user accounts per e-mail address.


const AUTH_TOKEN_REGEX = /^Bearer (.+)$/;
const USER_CREDENTIALS_REGEX = /^Basic (.+)$/;
const USERNAME_AND_PW_REGEX = /^([^:]+):([^:])+$/;

const TOKEN_EXP_PERIOD = 2764800000;


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
  // specified by the URL pathname, and where the request body, if there, is
  // either an optional plain-text e-mail address, in case of a createAccount
  // request, or a plain-text userID in case of a logout request.
  let reqType = req.url;
  if (req.method !== "POST") throw new ClientError(
    "Login server only accepts the POST methods"
  );
  let reqBody = await getData(req);

  // Get from the Authorization header either the username and the password, in
  // case of a createAccount or login request, or the authToken in case of a
  // logout request.
  let username, password, authToken;
    let authHeader = req.headers["authorization"];
    if (authHeader) {
      let [ , credentials] = AUTH_TOKEN_REGEX.exec(authHeader) ?? [];
      if (credentials) {
        credentials = atob(
          credentials.replaceAll("_", "/").replaceAll("-", "+")
        );
        [ , username = "", password = ""] =
          USERNAME_AND_PW_REGEX.exec(credentials) ?? [];
      }
      else {
        [ , authToken = ""] = authHeader.match(AUTH_TOKEN_REGEX) ?? [];
      }
    } 

  // Then branch according to the request type
  switch (reqType) {
    case "createAccount": {
      let emailAddr = reqBody;
      let [userID, authToken, expTime] = await createAccount(
        username, password, emailAddr
      );
      res.writeHead(201, {'Content-Type': "application/json"});
      res.end(JSON.stringify([userID, authToken, expTime]));
      break;
    }
    case "login": {
      let [userID, authToken, expTime] = await login(username, password);
      res.writeHead(200, {'Content-Type': "application/json"});
      res.end(JSON.stringify([userID, authToken, expTime]));
      break;
    }
    case "logout": {
      let userID = reqBody;
      let wasLoggedOut = await logout(userID, authToken);
      res.writeHead(200, {'Content-Type': "application/json"});
      res.end(wasLoggedOut ? "true" : "false");
      break;
    }
    default: throw new ClientError(
      "Unrecognized reqType"
    );
  }

}


// TODO: Implement sending an e-mail automatically to the address if one is
// provided, and if the e-mail is responded to by clicking some link, the
// account will get ticked off as having this e-mail address confirmed for it.
// And also implement using these for password resetting and account recovery.



async function createAccount(username, password, emailAddr) {
  validateUsernamePWAndEmailFormats(username, password, emailAddr);
  let pwHash = await bcrypt.hash(password, SALT_ROUNDS);
  let userDBConnection = new UserDBConnection();

  // Create the new account and get the new user ID.
  let [resultRow = []] = await userDBConnection.queryProcCall(
    "createUserAccount", [username, pwHash, emailAddr ?? "", MAX_ACCOUNT_NUM],
  ) ?? [];
  let [userID] = resultRow;

  // If the creation failed, due to too many account per (confirmed) e-mail,
  // return an empty array.
  if (!userID) {
    return [];
  }

  // Then generate (and store) a new authentication token for the user.
  [resultRow = []] = await userDBConnection.queryProcCall(
    "generateAuthToken", [userID],
  ) ?? [];
  let [authToken, modifiedAt] = resultRow;

  userDBConnection.end();
  let expTime = parseInt(modifiedAt) + TOKEN_EXP_PERIOD;
  return [userID, authToken, expTime];
}



async function login(username, password) {
  validateUsernamePWAndEmailFormats(username, password);
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
  let [authToken, modifiedAt] = resultRow;

  userDBConnection.end();
  let expTime = parseInt(modifiedAt) + TOKEN_EXP_PERIOD;
  return [userID, authToken, expTime];
}



async function logout(userID, authToken) {
  let userDBConnection = new UserDBConnection();

  // Then delete the stored authToken, if any, for the given userID.
  [resultRow = []] = await userDBConnection.queryProcCall(
    "deleteAuthToken", [userID, authToken],
  ) ?? [];
  let [wasDeleted] = resultRow;

  userDBConnection.end();

  return wasDeleted;
}








export function validateUsernamePWAndEmailFormats(
  username, password, emailAddr = ""
) {
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
      "Invalid e-mail address"
    );
  }
}
