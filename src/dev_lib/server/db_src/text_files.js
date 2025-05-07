
import {MainDBConnection} from "./DBConnection.js";
import {
  DevFunctionFromAsyncFun, payGasWithNoContext,
} from "../../../interpreting/ScriptInterpreter.js";


export async function query(
  {callerNode, callerEnv, interpreter, liveModule},
  route, homeDirID, filePath, queryStringArr, reqUserID, adminID,
  clientCacheTime, minServerCacheTime,
) {
  // If route equals just "/<homeDirID>/<filePath>", without any query string,
  // return the text stored in the file.
  if (!queryStringArr) {
    let text = await readTextFile(gas, homeDirID, filePath);
    return [text];
  }

  let queryType = queryStringArr[0];

  // If route equals "/<homeDirID>?_put&<contentText>", overwrite the existing
  // file with contentText, if any, or create a new file with that content.
  if (queryType === "_put") {
    let contentText = queryStringArr[1] ?? "";
    let wasCreated = await putTextFile(gas, homeDirID, filePath);
    return [fullDescList];
  }

  // If route equals "/<homeDirID>?_delete", ...
  if (queryType === "_delete") {
    let fullDescList = await getAllDescendants(gas, homeDirID);
    return [fullDescList];
  }

}



export async function readTextFile(gas, homeDirID, filePath) {
  payGasWithNoContext(gas, {mkdir: 1});
  let dirID = await MainDBConnection.querySingleValue(
    "readTextFile", [homeDirID, filePath]
  );
  return dirID;
} 

export const readTextFile = new DevFunctionFromAsyncFun(
  null, null, readTextFile
);

