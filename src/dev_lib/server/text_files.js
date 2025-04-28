
import {MainDBConnection} from "./DBConnection.js";
import {ClientError} from "../../server/err/errors.js";
import {
  DevFunctionFromAsyncFun, payGasWithNoContext,
} from "../../interpreting/ScriptInterpreter.js";
import {
  adminOnlySignal,
} from "../signals/fundamental_signals.js";


export async function query(
  route, homeDirID, filePath, queryStringArr, reqUserID, adminID, cct, mct,
  gas
) {
  // If route equals just "/<homeDirID>/<filePath>", without any query string,
  // return the text stored in the file.
  if (!queryStringArr) {
    let text = await _readTextFile(gas, homeDirID, filePath);
    return [text];
  }

  let queryType = queryStringArr[0];

  // If route equals "/<homeDirID>?_put&<contentText>", overwrite the existing
  // file with contentText, if any, or create a new file with that content.
  if (queryType === "_put") {
    let contentText = queryStringArr[1] ?? "";
    let wasCreated = await _putTextFile(gas, homeDirID, filePath);
    return [fullDescList];
  }

  // If route equals "/<homeDirID>?_delete", ...
  if (queryType === "_delete") {
    let fullDescList = await _getAllDescendants(gas, homeDirID);
    return [fullDescList];
  }

}



export async function _readTextFile(gas, homeDirID, filePath) {
  payGasWithNoContext(gas, {mkdir: 1});
  let dirID = await MainDBConnection.querySingleValue(
    "readTextFile", [homeDirID, filePath]
  );
  return dirID;
} 

export const readTextFile = new DevFunctionFromAsyncFun(
  null, null, _readTextFile
);

