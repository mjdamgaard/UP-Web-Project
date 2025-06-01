
import {
  RuntimeError, payGas,
} from "../../../../interpreting/ScriptInterpreter.js";


export async function query(
  {callerNode, execEnv, interpreter},
  isPost, route, upNodeID, homeDirID, filePath, _, queryStringArr, postData,
  maxAge, noCache, lastUpToDate, onCached,
) {
  let serverQueryHandler = interpreter.serverQueryHandler;
  let dbQueryHandler = interpreter.dbQueryHandler;

  // If route equals just ".../<homeDirID>/<filePath>", without any query
  // string, return the text stored in the file.
  if (!queryStringArr) {
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "readTextFile", [homeDirID, filePath],
        route, upNodeID, maxAge, noCache, lastUpToDate, callerNode, execEnv,
      );
    } else {
      return serverQueryHandler.queryServerOrCache(
        isPost, route, upNodeID, maxAge, noCache, onCached, interpreter,
        callerNode, execEnv,
      );
    }
  }

  let queryType = queryStringArr[0];

  // If route equals ".../<homeDirID>?~put" with a text stored in the postData,
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

  // If route equals ".../<homeDirID>/<filePath>?~delete", ...
  if (queryType === "~delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for the "fetch" method: ${route}`,
      callerNode, execEnv
    );
    let routesToEvict = [[`/${homeDirID}/${filePath}`, true]];
    if (interpreter.isServerSide) {
      return await dbQueryHandler.queryDBProcOrCache(
        "deleteTextFile", [homeDirID, filePath],
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

  // If route equals ".../<homeDirID>/<filePath>?get&<alias>", verify that
  // fileExt = "js", and if so, execute the module and return the variables
  // exported as <alias>. 
  if (queryType === "get") {
    // TODO: Implement, and make sure to also remove any elevated privileges
    // when executing the module.
  }

  // If route equals ".../<homeDirID>/<filePath>?~call&<alias>&argv=<inputArr>",
  // verify that fileExt = "js", and if so, execute the module and get the
  // function exported as <alias>, then call it and return its output.
  if (queryType === "call") {
    // TODO: Implement, and make sure to also remove any elevated privileges
    // when executing the module and calling the function.
  }

  // TODO: Correct:
  // If route equals ".../<homeDirID>?call&<funName>&<inputArr>", get the
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
        callerNode, execEnv
      );
    }
    // TODO: Look in the cache first in case of the "fetch" method.
    let liveServerModule = await interpreter.import(`/${homeDirID}/module.js`);
    execEnv.emitSignal(SET_ELEVATED_PRIVILEGES_SIGNAL, homeDirID);
    liveServerModule.call(funName, inputArr, null, execEnv);
    return ["TODO..."];
  }


  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}
