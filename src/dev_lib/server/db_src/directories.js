
import {MainDBConnection} from "./DBConnection.js";
import {ClientError} from "../../../server/err/errors.js";
import {
  LiveDevFunction,
} from "../../../interpreting/ScriptInterpreter.js";
import {
  adminOnlySignal,
} from "../../signals/fundamental_signals.js";


export async function query(
  {callerNode, callerEnv, interpreter, liveDBModule},
  route, homeDirID, filePath, queryStringArr, reqUserID, adminID, cct, mct,
  gas
) {
  // If route equals "mkdir?<adminID>", create a new home directory with the
  // requested adminID as the admin. 
  if (!homeDirID) {
    if (queryStringArr[0] === "mkdir") {
      let requestedAdminID = queryStringArr[1];
      let dirID = await mkdir(gas, requestedAdminID);
      return [dirID];
    }
    else throw new ClientError(
      `Unrecognized route: ${route}`
    );
  }

  // No requests targeting subdirectories are implemented at this point.
  if (filePath) throw new ClientError(
    `Unrecognized route: ${route}`
  );

  // If route equals just "/<homeDirID>", without any query string, return
  // a list of all nested file paths of the home directory, except paths of
  // files nested inside locked subdirectories (starting with "_").
  if (!queryStringArr) {
    let visibleDescList = await readDirDescendants(gas, homeDirID);
    return [visibleDescList];
  }

  let queryType = queryStringArr[0];

  // If route equals just "/<homeDirID>?_all", return a list of all nested
  // file paths of the home directory, including paths of
  // files nested inside locked subdirectories (starting with "_").
  if (queryType === "_all") {
    let fullDescList = await getAllDirDescendants(gas, homeDirID);
    return [fullDescList];
  }

  // If route equals just "/<homeDirID>?_delete", request a deletion of the
  // directory, ut note that directories can only be deleted after each nested
  // file in it has been deleted (as this query does not delete the files).
  if (queryType === "_delete") {
    let wasDeleted = await deleteHomeDir(gas, homeDirID);
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
      if (!isValidJSONArr) throw new ClientError(
        `inputArr query parameter needs to be a JSON array, but received ` +
        `${inputArrStr}`
      );
    }
    let liveServerModule = await interpreter.import(`/${homeDirID}/module.js`);
    let liveDevFunction = new LiveDevFunction({
      devFun: callServerModuleMethod,
      liveModule: liveDBModule,
      funName: "_callServerModuleMethod",
      isEnclosed: true,
    }
    );
    let res = await interpreter.executeFunction(
      liveDevFunction, [liveServerModule, homeDirID, funName, inputArr],
      callerNode, callerEnv
    );
    return [res];
  }


}




const callServerModuleMethod = new DevFunction(
  {isAsync: true, minArgNum: 2, isEnclosed: true},
  async function(
    {callerNode, callerEnv, interpreter},
    [liveServerModule, homeDirID, funName, inputArr]
  ) {
    callerEnv.emitSignal(SET_ELEVATED_PRIVILEGES_SIGNAL, homeDirID);
    let method = liveServerModule.get(funName);
    return interpreter.executeAsyncFunction(
      method, inputArr, callerNode, callerEnv, liveServerModule
    );
  }
);




export async function mkdir(gas, adminID) {
  payGasWithNoContext(gas, {mkdir: 1});
  let dirID = await MainDBConnection.querySingleValue(
    "createHomeDir", [adminID]
  );
  return dirID;
} 

export const mkdir = new DevFunctionFromAsyncFun(null, null, mkdir);




export async function readDirDescendants(gas, dirID) {
  payGasWithNoContext(gas, {dbRead: 1})
  let fullDescList = await MainDBConnection.querySingleList(
    "readHomeDirDescendants", [dirID]
  );

  let visibleDescList = fullDescList.filter(([filePath]) => (
    !/\/_[^/]*\//.test(filePath)
  ));
  return visibleDescList;
}


export async function getAllDirDescendants(gas, dirID) {
  payGasWithNoContext(gas, {dbRead: 1})
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