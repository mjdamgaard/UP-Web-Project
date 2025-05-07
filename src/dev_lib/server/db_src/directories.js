
import {MainDBConnection} from "./DBConnection.js";
import {
  payGas, RuntimeError,
} from "../../../interpreting/ScriptInterpreter.js";


export async function query(
  execVars,
  route, homeDirID, filePath, _, queryStringArr,
  cachePeriod, clientCacheTime
) {
  let {callerNode, callerEnv, execEnv, interpreter} = execVars;

  // If route equals "mkdir?<adminID>", create a new home directory with the
  // requested adminID as the admin. 
  if (!homeDirID) {
    if (queryStringArr[0] === "mkdir") {
      let requestedAdminID = queryStringArr[1];
      let dirID = await mkdir(execVars, requestedAdminID);
      return [dirID];
    }
    else throw new RuntimeError(
      `Unrecognized route: ${route}`,
      callerNode, callerEnv
    );
  }

  // No requests targeting subdirectories are implemented at this point.
  if (filePath) throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, callerEnv
  );

  // If route equals just "/<homeDirID>", without any query string, return
  // a list of all nested file paths of the home directory, except paths of
  // files nested inside locked subdirectories (starting with "_").
  if (!queryStringArr) {
    let visibleDescList = await readDirDescendants(execVars, homeDirID);
    return [visibleDescList];
  }

  let queryType = queryStringArr[0];

  // If route equals just "/<homeDirID>?_all", return a list of all nested
  // file paths of the home directory, including paths of
  // files nested inside locked subdirectories (starting with "_").
  if (queryType === "_all") {
    let fullDescList = await getAllDirDescendants(execVars, homeDirID);
    return [fullDescList];
  }

  // If route equals just "/<homeDirID>?_delete", request a deletion of the
  // directory, ut note that directories can only be deleted after each nested
  // file in it has been deleted (as this query does not delete the files).
  if (queryType === "_delete") {
    let wasDeleted = await deleteHomeDir(execVars, homeDirID);
    return [wasDeleted];
  }
  
  // If route equals just "/<homeDirID>?call&<funName>&<inputArr>", get the
  // module.js file at the home level of the directory, then execute that
  // module and run the function named <funName>, with the optional <inputArr>
  // as its input.
  if (queryType === "call") {
    let [funName, inputArrStr] = queryStringArr;
    let inputArr = [];
    if (inputArrStr) {
      let isValidJSONArr = true;
      try {
        inputArr = JSON.parse(inputArrStr);
        if (!(inputArr instanceof Array)) {
          isValidJSONArr = false;
        }
      } catch (err) {
        isValidJSONArr = false;
      }
      if (!isValidJSONArr) throw new RuntimeError(
        `inputArr query parameter needs to be a JSON array, but received ` +
        `${inputArrStr}`,
        callerNode, callerEnv
      );
    }
    let liveServerModule = await interpreter.import(`/${homeDirID}/module.js`);
    execEnv.emitSignal(SET_ELEVATED_PRIVILEGES_SIGNAL, homeDirID);
    liveServerModule.call(funName, inputArr, null, execEnv);
    return [res];
  }


}





export async function mkdir({callerNode, callerEnv}, adminID) {
  payGas(callerNode, callerEnv, {mkdir: 1});
  let dirID = await MainDBConnection.querySingleValue(
    "createHomeDir", [adminID],
  );
  return dirID;
} 

export const mkdir = new DevFunctionFromAsyncFun(null, null, mkdir);




export async function readDirDescendants({callerNode, callerEnv}, dirID) {
  payGas(callerNode, callerEnv, {dbRead: 1})
  let fullDescList = await MainDBConnection.querySingleList(
    "readHomeDirDescendants", [dirID]
  );

  let visibleDescList = fullDescList.filter(([filePath]) => (
    !/\/_[^/]*\//.test(filePath)
  ));
  return visibleDescList;
}


export async function getAllDirDescendants({callerNode, callerEnv}, dirID) {
  payGas(callerNode, callerEnv, {dbRead: 1})
  let fullDescList = await MainDBConnection.querySingleList(
    "readHomeDirDescendants", [dirID]
  );
  return fullDescList;
}


export async function deleteHomeDir(_, dirID) {
  let wasDeleted = await MainDBConnection.querySingleValue(
    "readHomeDirDescendants", [dirID]
  );
  return wasDeleted;
}






export const ELEVATED_PRIVILEGES_FLAG = Symbol("elevated_privileges");

export const SET_ELEVATED_PRIVILEGES_SIGNAL = new Signal(
  "set_elevated_privileges",
  function(flagEnv, _, _, homeDirID) {
    flagEnv.raiseFlag(ELEVATED_PRIVILEGES_FLAG, homeDirID);
  }
);

export const CHECK_ELEVATED_PRIVILEGES_SIGNAL = new Signal(
  "check_elevated_privileges",
  function(flagEnv, node, env, homeDirID) {
    let [wasFound, prevHomeDirID] = flagEnv.getFlag(ELEVATED_PRIVILEGES_FLAG);
    if (!wasFound || prevHomeDirID !== homeDirID) throw new RuntimeError(
      `Requested admin privileges on Directory ${homeDirID} not granted`,
      node, env
    );
    flagEnv.raiseFlag(ELEVATED_PRIVILEGES_FLAG, homeDirID);
  }
);

