
import {DBQueryHandler} from "../../../../server/db_io/DBQueryHandler.js";
import {
  RuntimeError, payGas,
} from "../../../../interpreting/ScriptInterpreter.js";


export async function query(
  {callerNode, callerEnv},
  isPost, route, homeDirID, filePath, _, queryStringArr,
  postData, maxAge, noCache, lastUpToDate
) {
  // If route equals just "/<homeDirID>/<filePath>", without any query string,
  // return the text stored in the file.
  if (!queryStringArr) {
    return await DBQueryHandler.queryDBProcOrCache(
      "readTextFile", [homeDirID, filePath],
      callerNode, callerEnv, route, maxAge, noCache, lastUpToDate,
    );
  }

  let queryType = queryStringArr[0];

  // If route equals "/<homeDirID>?_put&<contentText>", overwrite the existing
  // file with contentText, if any, or create a new file with that content.
  if (queryType === "_put") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for the "fetch" method: ${route}`,
      callerNode, callerEnv
    );
    let text = postData;
    payGas(callerNode, callerEnv, {dbWrite: text.length});
    let routesToEvict = [[`/${homeDirID}/${filePath}`, true]];
    return await DBQueryHandler.queryDBProcOrCache(
      "putTextFile", [homeDirID, filePath, text],
      callerNode, callerEnv, route, maxAge, noCache, lastUpToDate,
      routesToEvict,
    );
  }

  // If route equals "/<homeDirID>/<filePath>?_delete", ...
  if (queryType === "_delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for the "fetch" method: ${route}`,
      callerNode, callerEnv
    );
    let routesToEvict = [[`/${homeDirID}/${filePath}`, true]];
    return await DBQueryHandler.queryDBProcOrCache(
      "deleteTextFile", [homeDirID, filePath],
      callerNode, callerEnv, route, maxAge, noCache, lastUpToDate,
      routesToEvict,
    );
  }

  // If route equals "/<homeDirID>/<filePath>?_get&<alias>", verify that
  // fileExt = "js", and if so, execute the module and return the variables
  // exported as <alias>. 
  if (queryType === "get") {
    // TODO: Implement, and make sure to also remove any elevated privileges
    // when executing the module.
  }

  // If route equals "/<homeDirID>/<filePath>?_call&<alias>&<inputArr", verify
  // that fileExt = "js", and if so, execute the module and get the function
  // exported as <alias>, then call it and return its output.
  if (queryType === "call") {
    // TODO: Implement, and make sure to also remove any elevated privileges
    // when executing the module and calling the function.
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route for the "fetch" method: ${route}`,
    callerNode, callerEnv
  );
}
