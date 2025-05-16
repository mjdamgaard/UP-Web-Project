
import {
  RuntimeError, payGas,
} from "../../../../interpreting/ScriptInterpreter.js";


export async function query(
  {callerNode, execEnv, interpreter},
  isPost, route, homeDirID, filePath, _, queryStringArr,
  postData, maxAge, noCache, lastUpToDate, onCached,
) {
  let serverQueryHandler = interpreter.serverQueryHandler;
  let dbQueryHandler = interpreter.dbQueryHandler;

  // If route equals just "/<homeDirID>/<filePath>", without any query string,
  // return the text stored in the file.
  if (!queryStringArr) {
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "readTextFile", [homeDirID, filePath],
        route, maxAge, noCache, lastUpToDate, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, maxAge, noCache, onCached, interpreter,
        callerNode, execEnv,
      );
    }
  }

  let queryType = queryStringArr[0];

  // If route equals "/<homeDirID>?_put&<contentText>", overwrite the existing
  // file with contentText, if any, or create a new file with that content.
  if (queryType === "_put") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for the "fetch" method: ${route}`,
      callerNode, execEnv
    );
    let text = postData;
    payGas(callerNode, execEnv, {dbWrite: text.length});
    let routesToEvict = [[`/${homeDirID}/${filePath}`, true]];
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "putTextFile", [homeDirID, filePath, text],
        route, maxAge, true, lastUpToDate, callerNode, execEnv,
        routesToEvict,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, maxAge, true, onCached, interpreter,
        callerNode, execEnv, routesToEvict,
      );
    }
  }

  // If route equals "/<homeDirID>/<filePath>?_delete", ...
  if (queryType === "_delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for the "fetch" method: ${route}`,
      callerNode, execEnv
    );
    let routesToEvict = [[`/${homeDirID}/${filePath}`, true]];
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "deleteTextFile", [homeDirID, filePath],
        route, maxAge, true, lastUpToDate, callerNode, execEnv,
        routesToEvict,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, maxAge, true, onCached, interpreter,
        callerNode, execEnv, routesToEvict,
      );
    }
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
    callerNode, execEnv
  );
}
