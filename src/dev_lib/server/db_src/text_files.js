
import {MainDBConnection} from "./DBConnection.js";
import {
  RuntimeError, payGas,
} from "../../../interpreting/ScriptInterpreter.js";


export async function query(
  execVars,
  route, homeDirID, filePath, fileExt, queryStringArr,
  cachePeriod, clientCacheTime
) {
  let {callerNode, callerEnv, execEnv, interpreter} = execVars;

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
    let wasCreated = await putTextFile(
      execVars, homeDirID, filePath, contentText
    );
    return [wasCreated];
  }

  // If route equals "/<homeDirID>/<filePath>?_delete", ...
  if (queryType === "_delete") {
    // ...
  }

}



export async function readTextFile(
  {callerNode, callerEnv}, homeDirID, filePath
) {
  payGas(callerNode, callerEnv, {dbRead: 1});
  let text = await MainDBConnection.querySingleValue(
    "readTextFile", [homeDirID, filePath]
  );
  return [text];
} 

