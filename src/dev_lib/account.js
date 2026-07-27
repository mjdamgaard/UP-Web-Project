
import {DevFunction, RuntimeError} from "../interpreting/ScriptInterpreter.js";
import {CLIENT_TRUST_FLAG} from './query/src/flags.js';

import {ServerQueryHandler} from "../server/ajax_io/ServerQueryHandler.js";

const serverQueryHandler = new ServerQueryHandler();



// logout() tries to log out the user, returning undefined on success, and
// returning an error message string on failure.
export const logout = new DevFunction(
  "logout", {isAsync: true}, async ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userContext} = execEnv.globals.contexts;
    let {userID, authToken} = JSON.parse(
      localStorage.getItem("userData") ?? "{}"
    );
    try {
      await serverQueryHandler.queryLoginServer(
        "logout", userID, {authToken: authToken}
      );
    }
    catch (err) {
      console.error(`An error occurred when logging out: "${err.toString()}"`);
      return "An error occurred when logging out";
    }
    localStorage.clear();
    userContext.setVal({
      userID: undefined, username: undefined, expTime: undefined
    });
  },
);


// login() tries to log in the user, returning undefined on success, and
// returning an error message string on failure.
export const login = new DevFunction(
  "login", {isAsync: true, typeArr: ["string", "string"]},
  async ({callerNode, execEnv}, [username, password]) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userContext} = execEnv.globals.contexts;
    let errMsg = validateUsernamePWAndEmailFormats(username, password);
    if (errMsg) {
      return errMsg;
    }
    let res;
    try {
      res = await serverQueryHandler.queryLoginServer(
        "login", undefined, {username: username, password: password}
      );
    }
    catch (err) {
      console.error(`An error occurred when logging in: "${err.toString()}"`);
      return "An error occurred when logging in";
    }
    let [userID, authToken, expTime] = res;
    if (!userID) {
      return "Incorrect password";
    }
    userContext.setVal({
      userID: userID, username: username, expTime: expTime
    });
    localStorage.setItem("userData", JSON.stringify({
      userID: userID, username: username,
      authToken: authToken, expTime: expTime,
    }));
  },
);


// createAccount() tries to create a new account, returning undefined on
// success, and returning an error message string on failure.
export const createAccount = new DevFunction(
  "createAccount", {isAsync: true, typeArr: ["string", "string", "string?"]},
  async ({callerNode, execEnv}, [username, password, email]) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userContext} = execEnv.globals.contexts;
    let errMsg = validateUsernamePWAndEmailFormats(username, password, email);
    if (errMsg) {
      return errMsg;
    }
    let res;
    try {
      res = await serverQueryHandler.queryLoginServer(
        "createAccount", email, {username: username, password: password}
      );
    }
    catch (err) {
      console.error(
        `An error occurred when creating a new account: "${err.toString()}"`
      );
      return "An error occurred when creating a new account";
    }
    let [userID, authToken, expTime] = res;
    if (!userID) {
      return "Username already exists";
    }
    userContext.setVal({
      userID: userID, username: username, expTime: expTime
    });
    localStorage.setItem("userData", JSON.stringify({
      userID: userID, username: username,
      authToken: authToken, expTime: expTime,
    }));
  },
);


// fetchGasReserves() returns a gas object on success, and returns an error
// message string on failure.
export const fetchGasReserves = new DevFunction(
  "fetchGasReserves", {isAsync: true}, async ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userID, authToken} = JSON.parse(
      localStorage.getItem("userData") ?? "{}"
    );
    let res;
    try {
      res = await serverQueryHandler.queryLoginServer(
        "userIDAndGas", undefined, {authToken: authToken}
      );
    }
    catch (err) {
      console.error(
        `An error occurred when fetching gas object: "${err.toString()}"`
      );
      return "An error occurred when fetching gas object";
    }
    let [ , gas] = res;
    if (!gas) {
      return "An error occurred when fetching gas object";
    }
    return gas;
  },
);



export const canUseAccountLibrary = new DevFunction(
  "canUseAccountLibrary", {}, ({execEnv}, []) => {
    return execEnv.getFlag(CLIENT_TRUST_FLAG) ? true : false;
  },
);




function checkAccountLibraryPermission(callerNode, execEnv) {
  if (!execEnv.getFlag(CLIENT_TRUST_FLAG)) throw new RuntimeError(
    "Permission to use account library not granted in this context",
    callerNode, execEnv
  );
}


const EMAIL_REGEX = /^[a-zA-Z][a-zA-Z0-9.\-_]*@[a-zA-Z][a-zA-Z0-9.\-_]*$/;

function validateUsernamePWAndEmailFormats(
  username, password, emailAddr = ""
) {
  if (!username || !/^[a-zA-Z][a-zA-Z0-9_-]{3,39}$/.test(username)) {
    return "Invalid username";
  }
  if (!password || password.length < 8 || password.length > 120) {
    return "Password not long enough";
  }
  if (emailAddr && !EMAIL_REGEX.test(emailAddr)) {
    return "Invalid e-mail address";
  }
}
