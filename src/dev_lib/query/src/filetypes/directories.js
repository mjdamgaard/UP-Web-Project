
import {
  payGas, RuntimeError,
} from "../../../../interpreting/ScriptInterpreter.js";

import {SET_ELEVATED_PRIVILEGES_SIGNAL} from "../signals.js";



export async function query(
  {callerNode, execEnv, interpreter},
  route, _, upNodeID, homeDirID, filePath, _, queryStringArr, options,
) {
  let {serverQueryHandler, dbQueryHandler, jsFileCache} = interpreter;

  // If route equals "...?mkdir&a=<adminID>", create a new home directory with
  // the requested adminID as the admin. 
  if (!homeDirID) {
    if (queryStringArr[0] === "mkdir") {
      let [a, requestedAdminID] = (queryStringArr[1] ?? []);
      if (a !== "a" || !requestedAdminID) throw new RuntimeError(
        "No admin ID was provided",
        callerNode, execEnv
      );
      payGas(callerNode, execEnv, {mkdir: 1});
      if (interpreter.isServerSide) {
        return await dbQueryHandler.queryDBProc(
          "createHomeDir", [requestedAdminID],
          route, upNodeID, options, callerNode, execEnv,
        );
      } else {
        return serverQueryHandler.queryServer(
          route, undefined, upNodeID, interpreter, callerNode, execEnv,
        );
      }
    }
    else throw new RuntimeError(
      `Unrecognized route: ${route}`,
      callerNode, execEnv
    );
  }

  // No requests targeting subdirectories are implemented at this point, if
  // ever.
  if (filePath) throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );

  // If route equals just ".../<homeDirID>", without any query string, return
  // a list of all nested file paths of the home directory, except paths of
  // files nested inside locked subdirectories (starting with "_").
  if (!queryStringArr) {
    if (interpreter.isServerSide) {
      let [fullDescList] = await dbQueryHandler.queryDBProc(
        "readHomeDirDescendants", [homeDirID, 1000, 0],
        route, upNodeID, options, callerNode, execEnv,
      );
      let visibleDescList = (fullDescList ?? []).filter(([filePath]) => (
        !/\/_[^/]*\//.test(filePath)
      ));
      return [visibleDescList];
    }
    else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, callerNode, execEnv,
      );
    }
  }

  let queryType = queryStringArr[0];

  // If route equals just ".../<homeDirID>?_all", return a list of all nested
  // file paths of the home directory, *including* paths of files nested
  // inside locked subdirectories (starting with "_").
  if (queryType === "_all") {
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProc(
        "readHomeDirDescendants", [homeDirID, 1000, 0],
        route, upNodeID, options, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, callerNode, execEnv,
      );
    }
  }

  // If route equals just ".../<homeDirID>?admin", return the adminID of the
  // home directory.
  if (queryType === "admin") {
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProc(
        "readHomeDirAdminID", [homeDirID],
        route, upNodeID, options, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, callerNode, execEnv,
      );
    }
  }

  // If route equals ".../<homeDirID>?_setAdmin&<adminID>", set a new admin of
  // the home directory.
  if (queryType === "~setAdmin") {
    let requestedAdminID = queryStringArr[1];
    let routesToEvict = [`/${homeDirID}?admin`];
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProc(
        "editHomeDir", [homeDirID, requestedAdminID],
        route, upNodeID, options, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, callerNode, execEnv,
      );
    }
  }

  // If route equals ".../<homeDirID>?_delete", request a deletion of the
  // directory, ut note that directories can only be deleted after each nested
  // file in it has been deleted (as this query does not delete the files).
  if (queryType === "~delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for the "fetch" method: ${route}`,
      callerNode, execEnv
    );
    let routesToEvict = [
      [`/${homeDirID}/`, true],
      [`/${homeDirID}?`, true],
      [`/${homeDirID}`, false],
    ];
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProc(
        "deleteHomeDir", [homeDirID],
        route, upNodeID, options, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServer(
        route, undefined, upNodeID, interpreter, callerNode, execEnv,
      );
    }
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}
