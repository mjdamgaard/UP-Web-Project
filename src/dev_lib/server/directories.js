
import {MainDBConnection} from "./DBConnection.js";
import {ClientError} from "../../server/err/errors.js";
import {
  DevFunctionFromAsyncFun, payGas,
} from "../../interpreting/ScriptInterpreter.js";
import {
  adminOnlySignal,
} from "../signals/fundamental_signals.js";


export async function query(
  route, homeDirID, filePath, queryStringArr, reqUserID, adminID, cct, mct
) {
  // If route equals "mkdir?<adminID>", create a new home directory with the
  // requested adminID as the admin. 
  if (!homeDirID) {
    if (queryStringArr[0] === "mkdir") {
      let requestedAdminID = queryStringArr[1];
      let dirID = await _mkdir(requestedAdminID);
      return dirID;
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
    let visibleDescList = await _getAllDescendants("...", homeDirID);
    return visibleDescList;
  }

  let queryType = queryStringArr[0];

  // If route equals just "/<homeDirID>?_all", return a list of all nested
  // file paths of the home directory, including paths of
  // files nested inside locked subdirectories (starting with "_").
  if (queryType === "_all") {

  }

  if (queryType === "_delete") {

  }
  


}



export async function _mkdir({node, env}, adminID) {
  payGas(node, env, true, {mkdir: 1})
  let dirID = await MainDBConnection.querySingleValue(
    "createHomeDir", [adminID]
  );
  return dirID;
} 

export const mkdir = new DevFunctionFromAsyncFun(null, null, _mkdir);




export async function _getDescendants({node, env}, dirID) {
  payGas(node, env, true, {dbRead: 1})
  let fullDescList = await MainDBConnection.querySingleList(
    "readHomeDirDescendants", [dirID]
  );

  let visibleDescList = fullDescList.filter(([filePath]) => (
    !/\/_[^/]*\//.test(filePath)
  ));
  return visibleDescList;
} 

export const getDescendants = new DevFunctionFromAsyncFun(
  null, null, _getDescendants
);


export async function _getAllDescendants({node, env}, dirID) {
  payGas(node, env, true, {dbRead: 1})
  let fullDescList = await MainDBConnection.querySingleList(
    "readHomeDirDescendants", [dirID]
  );
  return fullDescList;
} 

export const getAllDescendants = new DevFunctionFromAsyncFun(
  adminOnlySignal, null, _getDescendants
);