
import {
  RuntimeError, payGas, DevFunction, CLEAR_FLAG, PromiseObject,
} from "../../../../interpreting/ScriptInterpreter.js";

import {
  ADMIN_PRIVILEGES_FLAG, REQUEST_ORIGIN_FLAG, CURRENT_MODULE_FLAG
} from "../flags.js";



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
        async ({interpreter}, []) => {
          let liveModule = await interpreter.import(
            `/0/${homeDirID}/${filePath}`
          );
          return liveModule.members[alias];
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
    if (isPost) throw new RuntimeError(
      `Unrecognized route for POST-like requests: "${route}"`,
      callerNode, execEnv
    );
    if (fileExt !== "js" && fileExt !== "jsx") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let [alias, inputArrBase64] = queryPathArr;
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

    // Import and execute the given JS module using interpreter.import(), and
    // do so within a dev function with the "clear" flag, which removes all
    // permission-granting flags for the module's execution environment. And
    // when the liveModule is gotten, get and execute the function, also within
    // the same enclosed execution environment.
    let resultPromise = new Promise(async (resolve) => {
      let liveModule = await interpreter.import(
        `/0/${homeDirID}/${filePath}`
      );
      let fun = liveModule.members[alias];
      let result = interpreter.executeFunction(
        fun, inputArr, callerNode, execEnv, undefined, [CLEAR_FLAG]
      );
      if (result instanceof PromiseObject) {
        result = await result.promise;
      }
      resolve(result);
    })
    return await resultPromise;
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
    let [alias, inputArrBase64] = queryPathArr;
    if (typeof alias !== "string") throw new RuntimeError(
      "No function name provided",
      callerNode, execEnv
    );
    let inputArr, isValid = true;
    if (postData) {
      try {
        inputArr = JSON.parse(postData);
      } catch (err) {
        isValid = false;
      }
    }
    if (typeof inputArrBase64 === "string") {
      try {
        inputArr = JSON.parse(
          atob(inputArrBase64.replaceAll("-", "+").replaceAll("_", "/"))
        );
      } catch (err) {
        isValid = false;
      }
    }
    else throw new RuntimeError(
      "No input array provided",
      callerNode, execEnv
    );
    if (!isValid || !(inputArr instanceof Array)) throw new RuntimeError(
      "Input array not a valid base-64-encoded JSON array",
      callerNode, execEnv
    );

    // Import and execute the given JS module using interpreter.import(), and
    // do so within a dev function with an "elevated-privileges" that
    // elevates the privileges to admin privileges for the execution of the SMF
    // (server module function). Note that these elevated privileges can only
    // be used to post to a files within the called SM's home directory, and
    // that all previous such privileges are removed by the new flag. We also
    // set a "current-CORS-origin" flag with the full /callSMF route, which
    // means that if the given SMF calls another server module, the CORS-
    // like system will treat the calls as originating from that SMF, and not
    // whatever current module (be it a JSX component module or an SM) queried
    // this /callSMF route.
    let resultPromise = new Promise(async (resolve) => {
      let liveModule = await interpreter.import(
        `/0/${homeDirID}/${filePath}`
      );
      let fun = liveModule.members[alias];
      let newReqOrigin = execEnv.getFlag(CURRENT_MODULE_FLAG);
      let result = interpreter.executeFunction(
        fun, inputArr, callerNode, execEnv, undefined, [
          [CURRENT_MODULE_FLAG, route],
          [REQUEST_ORIGIN_FLAG, newReqOrigin],
          [ADMIN_PRIVILEGES_FLAG, homeDirID],
        ]
      );
      if (result instanceof PromiseObject) {
        result = await result.promise;
      }
      resolve(result);
    })
    return await resultPromise;
  }


  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}

