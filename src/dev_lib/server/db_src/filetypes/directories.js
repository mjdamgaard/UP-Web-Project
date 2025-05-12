
import {MainDBConnection} from "../../../../server/db_io/DBConnection.js";
import {
  payGas, RuntimeError,
} from "../../../../interpreting/ScriptInterpreter.js";

import {SET_ELEVATED_PRIVILEGES_SIGNAL} from "../signals.js";



export async function query(
  execVars,
  isPost, route, homeDirID, filePath, _, queryStringArr,
  postData, maxAge, noCache, lastUpToDate
) {
  let {callerNode, callerEnv, execEnv, interpreter} = execVars;

  // If route equals "mkdir?<adminID>", create a new home directory with the
  // requested adminID as the admin. 
  if (!homeDirID) {
    if (queryStringArr[0] === "mkdir") {
      if (!isPost) throw new RuntimeError(
        `Unrecognized route for the "fetch" method: ${route}`,
        callerNode, callerEnv
      );
      let requestedAdminID = queryStringArr[1];
      let newDirID = await mkdir(execVars, requestedAdminID);
      return [newDirID];
    }
    else throw new RuntimeError(
      `Unrecognized route: ${route}`,
      callerNode, callerEnv
    );
  }

  // No requests targeting subdirectories are implemented at this point.
  if (filePath) throw new RuntimeError(
    `Unrecognized route for the "fetch" method: ${route}`,
    callerNode, callerEnv
  );

  // If route equals just "/<homeDirID>", without any query string, return
  // a list of all nested file paths of the home directory, except paths of
  // files nested inside locked subdirectories (starting with "_").
  if (!queryStringArr) {
    // TODO: Look in the cache first.
    let visibleDescList = await readDirDescendants(execVars, homeDirID);
    return [visibleDescList];
  }

  let queryType = queryStringArr[0];

  // If route equals just "/<homeDirID>?_all", return a list of all nested
  // file paths of the home directory, *including* paths of files nested
  // inside locked subdirectories (starting with "_").
  if (queryType === "_all") {
    // TODO: Look in the cache first.
    let fullDescList = await getAllDirDescendants(execVars, homeDirID);
    return [fullDescList];
  }

  // If route equals just "/<homeDirID>?admin", return the adminID of the home
  // directory.
  if (queryType === "admin") {
    // TODO: Look in the cache first.
    let adminID = await getAdminID(execVars, homeDirID);
    return [adminID];
  }

  // If route equals "/<homeDirID>?_delete", request a deletion of the
  // directory, ut note that directories can only be deleted after each nested
  // file in it has been deleted (as this query does not delete the files).
  if (queryType === "_delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for the "fetch" method: ${route}`,
      callerNode, callerEnv
    );
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
    // TODO: Look in the cache first in case of the "fetch" method.
    let liveServerModule = await interpreter.import(`/${homeDirID}/module.js`);
    execEnv.emitSignal(SET_ELEVATED_PRIVILEGES_SIGNAL, homeDirID);
    liveServerModule.call(funName, inputArr, null, execEnv);
    return [res];
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route for the "fetch" method: ${route}`,
    callerNode, callerEnv
  );
}




export async function mkdir({callerNode, callerEnv}, adminID) {
  payGas(callerNode, callerEnv, {mkdir: 1});
  let homeDirID = await MainDBConnection.querySingleValue(
    "createHomeDir", [adminID],
  );
  return homeDirID;
} 



export async function readDirDescendants({callerNode, callerEnv}, homeDirID) {
  payGas(callerNode, callerEnv, {dbRead: 1})
  let fullDescList = await MainDBConnection.querySingleList(
    "readHomeDirDescendants", [homeDirID]
  );

  let visibleDescList = fullDescList.filter(([filePath]) => (
    !/\/_[^/]*\//.test(filePath)
  ));
  return visibleDescList;
}


export async function getAllDirDescendants({callerNode, callerEnv}, homeDirID) {
  payGas(callerNode, callerEnv, {dbRead: 1})
  let fullDescList = await MainDBConnection.querySingleList(
    "readHomeDirDescendants", [homeDirID]
  );
  return fullDescList;
}

export async function getAdminID({callerNode, callerEnv}, homeDirID) {
  payGas(callerNode, callerEnv, {dbRead: 1})
  let adminID = await MainDBConnection.querySingleValue(
    "readHomeDirAdminID", [homeDirID]
  );
  return adminID;
}


export async function deleteHomeDir(_, homeDirID) {
  let wasDeleted = await MainDBConnection.querySingleValue(
    "readHomeDirDescendants", [homeDirID]
  );
  return wasDeleted;
}

