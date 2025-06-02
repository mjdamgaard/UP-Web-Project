

import {
  RuntimeError, payGas,
} from "../../../../interpreting/ScriptInterpreter.js";


export async function query(
  {callerNode, execEnv, interpreter},
  route, isPost, postData, options,
  upNodeID, homeDirID, filePath, fileExt, queryStringArr,
) {
  let {serverQueryHandler, dbQueryHandler} = interpreter;

  // If route equals just ".../<homeDirID>/<filePath>", without any query
  // string, throw.
  if (!queryStringArr) throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );

  let queryType = queryStringArr[0];

  // If route equals ".../<homeDirID>/<filepath>?~touch" create a table file
  // if not already there, but do not delete its content if there.
  if (queryType === "~touch") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    payGas(callerNode, execEnv, {dbWrite: 1});
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProc(
        "touchTableFile", [homeDirID, filePath],
        route, upNodeID, options, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, options,
        callerNode, execEnv,
      );
    }
  }

  // If route equals ".../<homeDirID>/<filepath>?~touch" create a table file
  // if not already there, and delete its content if it does exist already.
  if (queryType === "~put") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    payGas(callerNode, execEnv, {dbWrite: 1});
    let procName =
      (fileExt === "att") ? "putATT" :
      (fileExt === "bt") ? "putBT" :
      (fileExt === "ct") ? "putCT" :
      (fileExt === "bbt") ? "putBBT" :
      undefined;
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProc(
        procName, [homeDirID, filePath],
        route, upNodeID, options, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, options,
        callerNode, execEnv,
      );
    }
  }


  // If route equals ".../<homeDirID>/<filepath>?~delete", delete the table
  // file (and its content) if its there.
  if (queryType === "~delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let procName =
      (fileExt === "att") ? "deleteATT" :
      (fileExt === "bt") ? "deleteBT" :
      (fileExt === "ct") ? "deleteCT" :
      (fileExt === "bbt") ? "deleteBBT" :
      undefined;
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProc(
        procName, [homeDirID, filePath],
        route, upNodeID, options, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, options,
        callerNode, execEnv,
      );
    }
  }

  // If route equals ".../<homeDirID>/<filepath>?entry&<elemKey>", read and
  // return the table entry with the given element key.
  if (queryType === "entry") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let procName =
      (fileExt === "att") ? "deleteATT" :
      (fileExt === "bt") ? "deleteBT" :
      (fileExt === "ct") ? "deleteCT" :
      (fileExt === "bbt") ? "deleteBBT" :
      undefined;
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProc(
        procName, [homeDirID, filePath],
        route, upNodeID, options, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, options,
        callerNode, execEnv,
      );
    }
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}
