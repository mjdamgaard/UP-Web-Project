
import * as http from 'http';
import * as bcrypt from 'bcrypt';

import {
  ClientError, endWithError, endWithInternalError,
} from './err/errors.js';
import {getData} from './user_input/getData.js';
import {UserDBConnection} from './db_io/DBConnection.js';

const SALT_ROUNDS = 13; // (Number of rounds = 2^SALT_ROUNDS.)
// TODO: MAX_ACCOUNT_NUM should be used when confirming an e-mail instead, if
// at all.  
const MAX_ACCOUNT_NUM = 10; // Number of user accounts per e-mail address.


const AUTH_TOKEN_REGEX = /^Bearer (.+)$/;
const USER_CREDENTIALS_REGEX = /^Basic (.+)$/;
const USERNAME_AND_PW_REGEX = /^([^:]+):(.*)$/;


// The following gas objects and constants can be adjusted over time.
const initGasJSON = JSON.stringify({
  comp: 10000000,
  import: 50000,
  fetch: 50000,
  time: 1000000,
  dbRead: 100000,
  dbWrite: 1000000,
  conn: 300000,
  mkdir: 100,
  mkTable: 0,
});
const TOKEN_EXP_PERIOD = 7948800; // ~= 3 months in seconds.
const TIME_GRAIN = 17; // Means round down the current token timestamp by 2^27
// ~= 1.5 days.


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
  res.setHeader("Access-Control-Allow-Headers", "Authorization");
  if (req.method === "OPTIONS") {
    res.setHeader("Cache-Control", "max-age=604800");
    res.end("");
    return;
  }

  // The server only implements POST requests where the request type is
  // specified by the URL pathname, and where the request body, if there, is
  // an optional plain-text e-mail address, in case of a createAccount
  // request, or a plain-text userID in case of a logoutAll request.
  let reqType = req.url.substring(1);
  if (req.method !== "POST") throw new ClientError(
    "Login server only accepts POST methods"
  );
  let reqBody = await getData(req);

  // Get from the Authorization header either the username and the password, in
  // case of a createAccount or login request, or the authToken in case of a
  // logout request.
  let username, password, authToken;
    let authHeader = req.headers["authorization"];
    if (authHeader) {
      let [ , credentials] = USER_CREDENTIALS_REGEX.exec(authHeader) ?? [];
      if (credentials) {
        credentials = atob(
          credentials.replaceAll("_", "/").replaceAll("-", "+")
        );
        [ , username = "", password = ""] =
          USERNAME_AND_PW_REGEX.exec(credentials) ?? [];
      }
      else {
        [ , authToken = ""] = AUTH_TOKEN_REGEX.exec(authHeader) ?? [];
      }
    } 

  // Then branch according to the request type.
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
      let wasLoggedOut = await logout(authToken);
      res.writeHead(200, {'Content-Type': "application/json"});
      res.end(wasLoggedOut ? 'true' : 'false');
      break;
    }
    case "logoutAll": {
      let userID = reqBody;
      let logoutNum = await logoutAll(authToken, userID);
      res.writeHead(200, {'Content-Type': "application/json"});
      res.end(parseInt(logoutNum) || 0);
      break;
    }
    case "replaceToken": {
      let [newAuthToken, expTime] = await replaceToken(authToken);
      res.writeHead(200, {'Content-Type': "application/json"});
      res.end(JSON.stringify([newAuthToken, expTime]));
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
    "createUserAccount", [username, pwHash, emailAddr ?? "", initGasJSON],
  ) ?? [];
  let [userID] = resultRow;

  // If the creation failed, due to the username already existing, return an
  // empty array.
  if (!userID) {
    return [];
  }

  // Then generate (and store) a new authentication token for the user.
  [resultRow = []] = await userDBConnection.queryProcCall(
    "generateAuthToken", [userID, TOKEN_EXP_PERIOD, TIME_GRAIN],
  ) ?? [];
  let [authToken, expTime] = resultRow;

  userDBConnection.end();
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
    "generateAuthToken", [userID, TOKEN_EXP_PERIOD, TIME_GRAIN],
  ) ?? [];
  let [authToken, expTime] = resultRow;

  userDBConnection.end();
  return [userID, authToken, expTime];
}



async function logout(authToken) {
  let userDBConnection = new UserDBConnection();

  // Delete the stored authToken if it exists.
  let [resultRow = []] = await userDBConnection.queryProcCall(
    "deleteAuthToken", [authToken],
  ) ?? [];
  let [wasDeleted] = resultRow;

  userDBConnection.end();
  return wasDeleted;
}

async function logoutAll(userID, authToken) {
  let userDBConnection = new UserDBConnection();

  // Delete all the user's authentication tokens, iff the provided authToken
  // is owned by the user.
  [resultRow = []] = await userDBConnection.queryProcCall(
    "deleteAllAuthTokensIfAuthenticated", [userID, authToken],
  ) ?? [];
  let [deletionNum] = resultRow;

  userDBConnection.end();
  return deletionNum;
}


async function replaceToken(authToken) {
  let userDBConnection = new UserDBConnection();

  // Delete all the user's authentication tokens, iff the provided authToken
  // is owned by the user.
  [resultRow = []] = await userDBConnection.queryProcCall(
    "replaceAuthToken", [authToken, TOKEN_EXP_PERIOD, TIME_GRAIN],
  ) ?? [];
  let [newAuthToken, expTime] = resultRow;

  userDBConnection.end();
  return [newAuthToken, expTime];
}







export function validateUsernamePWAndEmailFormats(
  username, password, emailAddr = ""
) {
  if (!username || !/^[a-zA-Z][a-zA-Z0-9_-]{3,39}$/.test(username)) {
    throw new ClientError("Invalid username");
  }
  if (!password || password.length < 8 || password.length > 120) {
    throw new ClientError("Invalid password");
  }
  // TODO: Implement validation.
  if (emailAddr && !/^.$/.test(emailAddr)) {
    throw new ClientError(
      "Invalid e-mail address"
    );
  }
}
