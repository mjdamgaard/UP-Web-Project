
import {DevFunction, RuntimeError} from '../interpreting/ScriptInterpreter.js';
import * as accountMenu from '../account_menu/account_menu.js';
import {CLIENT_TRUST_FLAG} from './query/src/flags.js';



export const logout = new DevFunction(
  "logout", {isAsync: true}, async ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {settingsContext} = execEnv.scriptVars.contexts;
    return await accountMenu.logout(settingsContext);
  },
);

export const openLoginPage = new DevFunction(
  "openLoginPage", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {settingsContext} = execEnv.scriptVars.contexts;
    return accountMenu.openLoginPage(settingsContext);
  },
);

export const openCreateAccountPage = new DevFunction(
  "openCreateAccountPage", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {settingsContext} = execEnv.scriptVars.contexts;
    return accountMenu.openCreateAccountPage(settingsContext);
  },
);

export const openAccountPage = new DevFunction(
  "openAccountPage", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {settingsContext} = execEnv.scriptVars.contexts;
    return accountMenu.openAccountPage(settingsContext);
  },
);

export const goToProfilePage = new DevFunction(
  "goToProfilePage", {}, ({callerNode, execEnv}, []) => {
    checkAccountLibraryPermission(callerNode, execEnv);
    let {settingsContext} = execEnv.scriptVars.contexts;
    return accountMenu.goToProfilePage(settingsContext);
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
