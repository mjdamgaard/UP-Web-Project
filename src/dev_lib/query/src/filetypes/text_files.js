
import {
  RuntimeError, payGas, DevFunction, CLEAR_FLAG, getValueWrapper,
  PromiseObject,
} from "../../../../interpreting/ScriptInterpreter.js";

import {SET_ELEVATED_PRIVILEGES_SIGNAL} from "../signals.js";



export async function query(
  {callerNode, execEnv, interpreter},
  route, isPost, postData, options,
  upNodeID, homeDirID, filePath, fileExt, queryPathArr
) {
  let {dbQueryHandler} = interpreter;

  // If route equals just ".../<homeDirID>/<filePath>", without any query
  // path, return the text stored in the file.
  if (!queryPathArr) {
    return await dbQueryHandler.queryDBProc(
      "readTextFile", [homeDirID, filePath],
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  let queryType = queryPathArr[0];

  // If route equals ".../<homeDirID>/~put" with a text stored in the postData,
  // overwrite the existing file with contentText, if any, or create a new file
  // with that content.
  if (queryType === "~put") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let text = postData;
    payGas(callerNode, execEnv, {dbWrite: text.length});
    return await dbQueryHandler.queryDBProc(
      "putTextFile", [homeDirID, filePath, text],
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/<filePath>/~delete", delete the text file.
  if (queryType === "~delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    return await dbQueryHandler.queryDBProc(
      "deleteTextFile", [homeDirID, filePath],
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/<filePath>/get/<alias>", verify that
  // fileExt equals "js" or "jsx", and if so, execute the module and return the
  // variables exported as <alias>. 
  if (queryType === "get") {
    if (fileExt !== "js" && fileExt !== "jsx") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let [alias] = queryPathArr;
    if (typeof alias !== "string") throw new RuntimeError(
      "No variable name provided",
      callerNode, execEnv
    );
    // Import and execute the given JS module using interpreter.import(), and
    // do so within a dev function with the "clear" flag, which removes all
    // permission-granting flags for the module's execution environment.
    let resultPromiseObj = interpreter.executeFunction(
      new DevFunction(
        {isAsync: true, flags: [CLEAR_FLAG]},
        async ({callerNode, execEnv, interpreter}, []) => {
          let liveModule = await interpreter.import(
            `/0/${homeDirID}/${filePath}`
          );
          return liveModule.get(alias);
        }
      ),
      [], callerNode, execEnv,
    );
    return await resultPromiseObj.promise;
  }

  // If route equals ".../<homeDirID>/<filePath>/call/<alias>/" +
  // "<inputArrBase64>", execute the module similarly to the /get routes just
  // above, and then execute the gotten function with the decoded inputArr and
  // return its returned value. Note the inputArrBase64 should be a base-64-
  // encoded JSON array.
  if (queryType === "call") {
    if (fileExt !== "js" && fileExt !== "jsx") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let [alias, inputArrBase64 = "[]"] = queryPathArr;
    if (typeof alias !== "string") throw new RuntimeError(
      "No function name provided",
      callerNode, execEnv
    );
    if (typeof inputArrBase64 !== "string") throw new RuntimeError(
      "No input array provided",
      callerNode, execEnv
    );
    let inputArr, isValid = true;
    try {
      inputArr = JSON.parse(
        atob(inputArrBase64.replaceAll("-", "+").replaceAll("_", "/"))
      );
    }
    catch (err) {
      isValid = false;
    }
    if (!isValid || !(inputArr instanceof Array)) throw new RuntimeError(
      "Input array not a valid base-64-encoded JSON array",
      callerNode, execEnv
    );
    inputArr = inputArr.map(val => getValueWrapper(val));

    // Import and execute the given JS module using interpreter.import(), and
    // do so within a dev function with the "clear" flag, which removes all
    // permission-granting flags for the module's execution environment. And
    // when the liveModule is gotten, get and execute the function, also within
    // the same enclosed execution environment.
    let resultPromiseObj = interpreter.executeFunction(
      new DevFunction(
        {isAsync: true, flags: [CLEAR_FLAG]},
        async ({callerNode, execEnv, interpreter}, []) => {
          let liveModule = await interpreter.import(
            `/0/${homeDirID}/${filePath}`
          );
          let fun = liveModule.get(alias);
          let result = interpreter.executeFunction(
            fun, inputArr, callerNode, execEnv
          );
          if (result instanceof PromiseObject) {
            result = await result.promise;
          }
          return result;
        }
      ),
      [], callerNode, execEnv,
    );
    return await resultPromiseObj.promise;
  }

  // If route equals ".../<homeDirID>/<filePath>/callSMF/<alias>/" +
  // "<inputArrBase64>", verify that filePath ends in '.sm.js', and if so,
  // execute the module and get the function exported as <alias>, then call it
  // with inputArr, base-64-decoded and JSON-decoded from inputArrBase64, and
  // return its output. And at the same time, make sure to signal that the call
  // should be treated as a call to a server module function (SMF), giving it
  // special privileges to write to certain parts of the DB (and removing any
  // previous privileges of the same kind). 
  if (queryType === "callSMF") {
    if (filePath.slice(-6) !== ".sm.js") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let [alias, inputArrBase64 = "[]"] = queryPathArr;
    if (typeof alias !== "string") throw new RuntimeError(
      "No function name provided",
      callerNode, execEnv
    );
    if (typeof inputArrBase64 !== "string") throw new RuntimeError(
      "No input array provided",
      callerNode, execEnv
    );
    let inputArr, isValid = true;
    try {
      inputArr = JSON.parse(
        atob(inputArrBase64.replaceAll("-", "+").replaceAll("_", "/"))
      );
    }
    catch (err) {
      isValid = false;
    }
    if (!isValid || !(inputArr instanceof Array)) throw new RuntimeError(
      "Input array not a valid base-64-encoded JSON array",
      callerNode, execEnv
    );
    inputArr = inputArr.map(val => getValueWrapper(val));

    // Import and execute the given JS module using interpreter.import(), and
    // do so within a dev function with the "clear" flag, which removes all
    // permission-granting flags for the module's execution environment. And
    // when the liveModule is gotten, get and execute the function, also within
    // the same enclosed execution environment.
    let resultPromiseObj = interpreter.executeFunction(
      new DevFunction(
        {isAsync: true, flags: [CLEAR_FLAG]},
        async ({callerNode, execEnv, interpreter}, []) => {
          let liveModule = await interpreter.import(
            `/0/${homeDirID}/${filePath}`
          );
          let fun = liveModule.get(alias);
          let result = interpreter.executeFunction(
            fun, inputArr, callerNode, execEnv
          );
          if (result instanceof PromiseObject) {
            result = await result.promise;
          }
          return result;
        }
      ),
      [], callerNode, execEnv,
    );
    return await resultPromiseObj.promise;
  }

  // TODO: Correct:
  // If route equals ".../<homeDirID>/call/<funName>/<inputArr>", get the
  // module.js file at the home level of the directory, then execute that
  // module and run the function named <funName>, with the optional <inputArr>
  // as its input.
  if (queryType === "call") {
    let [funName, inputArrStr] = queryPathArr;
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






export function queryDBProcOrCache(
  procName, paramValArr, routesToEvict,
  route, upNodeID, jsFileCache, routesToEvict, options, onCached,
  callerNode, execEnv
) {
  if (interpreter.isServerSide) {
    return dbQueryHandler.queryDBProcOrCache(
      procName, paramValArr,
      route, upNodeID, jsFileCache, routesToEvict, options, onCached,
      callerNode, execEnv
    );
  } else {
    return serverQueryHandler.queryServerOrCache(
      route, isPost, postData, upNodeID, interpreter, jsFileCache,
      routesToEvict, options, onCached, callerNode, execEnv,
    );
  }
}