

import {
  RuntimeError, payGas,
} from "../../../../interpreting/ScriptInterpreter.js";


export async function query(
  {callerNode, execEnv, interpreter},
  isPost, route, upNodeID, homeDirID, filePath, fileExt, queryStringArr, _,
  maxAge, noCache, lastUpToDate, onCached,
) {
  let serverQueryHandler = interpreter.serverQueryHandler;
  let dbQueryHandler = interpreter.dbQueryHandler;

  // If route equals just ".../<homeDirID>/<filePath>", without any query
  // string, throw.
  if (!queryStringArr) throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );

  let queryType = queryStringArr[0];

  // If route equals "/<homeDirID>?~put" with a text stored in the postData,
  // overwrite the existing file with contentText, if any, or create a new file
  // with that content.
  if (queryType === "~put") {
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
        route, upNodeID, maxAge, true, lastUpToDate, callerNode, execEnv,
        routesToEvict,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, upNodeID, maxAge, true, onCached, interpreter,
        callerNode, execEnv, routesToEvict,
      );
    }
  }



  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}
