
import {MainDBConnection} from "./DBConnection.js";



export async function query(
  homeDirID, filePath, fileExt, queryPathArr, isLocked, queryStringArr,
  reqUserID, adminID, cct, mct
) {
  // If route = "mkdir/<adminID>", create a new home directory with the
  // requested adminID as the admin. 
  if (!homeDirID) {
    if (queryPathArr[0] === "mkdir") {
      let requestedAdminID = queryPathArr[1];
      let dirID = await MainDBConnection.querySingleValue(
        "createHomeDir", [requestedAdminID]
      );
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