
import {
  payGas, RuntimeError,
} from "../../../../interpreting/ScriptInterpreter.js";

import {SET_ELEVATED_PRIVILEGES_SIGNAL} from "../signals.js";



export async function query(
  {callerNode, callerEnv, execEnv, interpreter},
  isPost, route, homeDirID, filePath, _, queryStringArr,
  postData, maxAge, noCache, lastUpToDate, onCached,
  serverQueryHandler, dbQueryHandler,
) {

  // If route equals "mkdir?<adminID>", create a new home directory with the
  // requested adminID as the admin. 
  if (!homeDirID) {
    if (queryStringArr[0] === "mkdir") {
      if (!isPost) throw new RuntimeError(
        `Unrecognized route for the "fetch" method: ${route}`,
        callerNode, callerEnv
      );
      let requestedAdminID = queryStringArr[1];
      payGas(callerNode, callerEnv, {mkdir: 1});
      if (interpreter.isServerSide) {
        return await dbQueryHandler.queryDBProcOrCache(
          "createHomeDir", [requestedAdminID],
          route, maxAge, noCache, lastUpToDate, callerNode, callerEnv,
        );
      } else {
        return serverQueryHandler.queryServerOrCache(
          isPost, route, maxAge, noCache, onCached, interpreter,
          callerNode, callerEnv,
        );
      }
    }
    else throw new RuntimeError(
      `Unrecognized route: ${route}`,
      callerNode, callerEnv
    );
  }

  // No requests targeting subdirectories are implemented at this point.
  if (filePath) throw new RuntimeError(
    `Unrecognized route for the "fetch" method: ${route}`,
    callerNode, callerEnv
  );

  // If route equals just "/<homeDirID>", without any query string, return
  // a list of all nested file paths of the home directory, except paths of
  // files nested inside locked subdirectories (starting with "_").
  if (!queryStringArr) {
    if (interpreter.isServerSide) {
      let [fullDescList, wasReady] = await dbQueryHandler.queryDBProcOrCache(
        "readHomeDirDescendants", [homeDirID],
        route, maxAge, noCache, lastUpToDate, callerNode, callerEnv,
      );
      let visibleDescList;
      if (!wasReady) {
        visibleDescList = (fullDescList ?? []).filter(([filePath]) => (
          !/\/_[^/]*\//.test(filePath)
        ));
      }
      return [visibleDescList, wasReady];
    }
    else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, maxAge, noCache, onCached, interpreter,
        callerNode, callerEnv,
      );
    }
  }

  let queryType = queryStringArr[0];

  // If route equals just "/<homeDirID>?_all", return a list of all nested
  // file paths of the home directory, *including* paths of files nested
  // inside locked subdirectories (starting with "_").
  if (queryType === "_all") {
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "readHomeDirDescendants", [homeDirID],
        route, maxAge, noCache, lastUpToDate, callerNode, callerEnv,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, maxAge, noCache, onCached, interpreter,
        callerNode, callerEnv,
      );
    }
  }

  // If route equals just "/<homeDirID>?admin", return the adminID of the home
  // directory.
  if (queryType === "admin") {
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "readHomeDirAdminID", [homeDirID],
        route, maxAge, noCache, lastUpToDate, callerNode, callerEnv,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, maxAge, noCache, onCached, interpreter,
        callerNode, callerEnv,
      );
    }
  }

  // If route equals "/<homeDirID>?_setAdmin&<adminID>", set a new admin of the
  // home directory.
  if (queryType === "_setAdmin") {
    let requestedAdminID = queryStringArr[1];
    let routesToEvict = [`/${homeDirID}?admin`];
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "editHomeDir", [homeDirID, requestedAdminID],
        route, maxAge, true, lastUpToDate, callerNode, callerEnv,
        routesToEvict,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, maxAge, true, onCached, interpreter,
        callerNode, callerEnv, routesToEvict,
      );
    }
  }

  // If route equals "/<homeDirID>?_delete", request a deletion of the
  // directory, ut note that directories can only be deleted after each nested
  // file in it has been deleted (as this query does not delete the files).
  if (queryType === "_delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for the "fetch" method: ${route}`,
      callerNode, callerEnv
    );
    let routesToEvict = [
      [`/${homeDirID}/`, true],
      [`/${homeDirID}?`, true],
      [`/${homeDirID}`, false],
    ];
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "deleteHomeDir", [homeDirID],
        route, maxAge, true, lastUpToDate, callerNode, callerEnv,
        routesToEvict,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, maxAge, true, onCached, interpreter,
        callerNode, callerEnv, routesToEvict,
      );
    }
  }

  // TODO: Correct:
  // If route equals just "/<homeDirID>?call&<funName>&<inputArr>", get the
  // module.js file at the home level of the directory, then execute that
  // module and run the function named <funName>, with the optional <inputArr>
  // as its input.
  if (queryType === "call") {
    let [funName, inputArrStr] = queryStringArr;
    let inputArr = [];
    if (inputArrStr) {
      let isValidJSONArr = true;
      try {
        inputArr = JSON.parse(inputArrStr);
        if (!(inputArr instanceof Array)) {
          isValidJSONArr = false;
        }
      } catch (err) {
        isValidJSONArr = false;
      }
      if (!isValidJSONArr) throw new RuntimeError(
        `inputArr query parameter needs to be a JSON array, but received ` +
        `${inputArrStr}`,
        callerNode, callerEnv
      );
    }
    // TODO: Look in the cache first in case of the "fetch" method.
    let liveServerModule = await interpreter.import(`/${homeDirID}/module.js`);
    execEnv.emitSignal(SET_ELEVATED_PRIVILEGES_SIGNAL, homeDirID);
    liveServerModule.call(funName, inputArr, null, execEnv);
    return [res];
  }


  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route for the "fetch" method: ${route}`,
    callerNode, callerEnv
  );
}
