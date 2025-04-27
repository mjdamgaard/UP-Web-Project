
import {MainDBConnection} from "./DBConnection.js";
import {
  DevFunction,
} from "../../interpreting/ScriptInterpreter.js";
import {mkdirSignal} from "../signals/fundamental_signals.js";


export async function query(
  homeDirID, filePath, _, isLocked, queryStringArr,
  reqUserID, adminID, cct, mct
) {
  // If route = "mkdir/<adminID>", create a new home directory with the
  // requested adminID as the admin. 
  if (!homeDirID) {
    if (queryStringArr[0] === "mkdir") {
      let requestedAdminID = queryStringArr[1];
      let dirID = await _mkdir(requestedAdminID);
      return dirID;
    }
  }

  // If route = "/<homeDirID>", ...
  if (!homeDirID) {
    if (queryPathArr[0] === "mkdir") {
      let requestedAdminID = queryPathArr[1];
      let dirID = await MainDBConnection.querySingleValue(
        "createHomeDir", [requestedAdminID]
      );
      return dirID;
    }
  }
  


}


export async function _mkdir(adminID) {
  let dirID = await MainDBConnection.querySingleValue(
    "createHomeDir", [adminID]
  );
  return dirID;
} 


export const mkdir = new DevFunction(mkdirSignal, (

) => {

})