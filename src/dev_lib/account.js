
import {DevFunction, RuntimeError} from '../interpreting/ScriptInterpreter.js';
import * as accountMenu from '../account_menu/account_menu.js';
import {CLIENT_TRUST_FLAG} from './query/src/flags.js';



export const logout = new DevFunction(
  "logout", {isAsync: true}, async ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userContext} = execEnv.globals.contexts;
    return await accountMenu.logout(userContext);
  },
);

export const openLoginPage = new DevFunction(
  "openLoginPage", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userContext} = execEnv.globals.contexts;
    return accountMenu.openLoginPage(userContext);
  },
);

export const openCreateAccountPage = new DevFunction(
  "openCreateAccountPage", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userContext} = execEnv.globals.contexts;
    return accountMenu.openCreateAccountPage(userContext);
  },
);

export const openAccountPage = new DevFunction(
  "openAccountPage", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userContext} = execEnv.globals.contexts;
    return accountMenu.openAccountPage(userContext);
  },
);

export const goToProfilePage = new DevFunction(
  "goToProfilePage", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {userContext} = execEnv.globals.contexts;
    return accountMenu.goToProfilePage(userContext);
  },
);


export const getUsername = new DevFunction(
  "getUsername", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {username} = JSON.parse(localStorage.getItem("userData") ?? "{}");
    return username;
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
