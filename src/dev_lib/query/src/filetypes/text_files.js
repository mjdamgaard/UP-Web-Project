
import {
  RuntimeError, payGas, CLEAR_FLAG, PromiseObject, FunctionObject, getString,
} from "../../../../interpreting/ScriptInterpreter.js";

import {
  ELEVATED_PRIVILEGES_FLAG, REQUESTING_SMF_ROUTE_FLAG, CURRENT_SMF_ROUTE_FLAG,
  ADMIN_PRIVILEGES_FLAG, GRANT_ADMIN_PRIVILEGES_FLAG,
} from "../flags.js";

import {DBQueryHandler} from "../../../../server/db_io/DBQueryHandler.js";

const dbQueryHandler = new DBQueryHandler();

const ownUPNodeID = "1";


export async function query(
  {callerNode, execEnv, interpreter},
  route, isPost, postData, options = {},
  homeDirID, filePath, fileExt, queryPathArr
) {

  // If route equals just ".../<homeDirID>/<filePath>", without any query
  // path, return the text stored in the file.
  if (!queryPathArr) {
    let [[text] = []] = await dbQueryHandler.queryDBProc(
      "readTextFile", [homeDirID, filePath],
      route, options, callerNode, execEnv,
    ) ?? [];
    return text;
  }

  let queryType = queryPathArr[0];

  // If route equals ".../<homeDirID>/_put" with a text stored in the postData,
  // overwrite the existing file with contentText, if any, or create a new file
  // with that content.
  if (queryType === "_put") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let text = getString(postData, callerNode, execEnv);
    payGas(callerNode, execEnv, {dbWrite: text.length});
    let [[wasCreated] = []] = await dbQueryHandler.queryDBProc(
      "putTextFile", [homeDirID, filePath, text],
      route, options, callerNode, execEnv,
    ) ?? [];
    return wasCreated;
  }

  // If route equals ".../<homeDirID>/<filePath>/_rm", delete the text file.
  if (queryType === "_rm") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let [[wasDeleted] = []] = await dbQueryHandler.queryDBProc(
      "deleteTextFile", [homeDirID, filePath],
      route, options, callerNode, execEnv,
    ) ?? [];
    return wasDeleted;
  }

  // If route equals ".../<homeDirID>/<filePath>/get/<alias>", verify that
  // fileExt equals "js" or "jsx", and if so, execute the module and return the
  // variables exported as <alias>. 
  if (queryType === "get") {
    if (fileExt !== "js" && fileExt !== "jsx") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let [ , alias] = queryPathArr;
    if (typeof alias !== "string") throw new RuntimeError(
      "No variable name provided",
      callerNode, execEnv
    );

    // Import and execute the given JS module using interpreter.import(),
    // then return the export of the given alias.
    let liveModule = await interpreter.import(
      `/${ownUPNodeID}/${homeDirID}/${filePath}`, callerNode, execEnv, true
    );
    return liveModule.get(alias);
  }

  // If route equals ".../<homeDirID>/<filePath>/call/<alias>[/"<input>]*",
  // execute the module similarly to the /get routes just above, and then
  // execute the gotten function with the decoded inputArr and return its
  // returned value.
  if (queryType === "call") {
    if (isPost) throw new RuntimeError(
      `Unrecognized route for POST-like requests: "${route}"`,
      callerNode, execEnv
    );
    if (fileExt !== "js" && fileExt !== "jsx") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let [ , alias, ...inputArr] = queryPathArr;
    if (!alias) throw new RuntimeError(
      "No function name provided",
      callerNode, execEnv
    );
    if (postData) {
      if (postData instanceof Array) {
        inputArr = postData;
      }
      else {
        inputArr = [postData];
      }
    }

    // Import and execute the given JS module using interpreter.import(), and
    // do so within a dev function with the "clear" flag, which removes all
    // permission-granting flags for the module's execution environment. And
    // when the liveModule is gotten, get and execute the function, also within
    // the same enclosed execution environment.
    let liveModule = await interpreter.import(
      `/${ownUPNodeID}/${homeDirID}/${filePath}`, callerNode, execEnv, true
    );
    let fun = liveModule.get(alias);
    if (!(fun instanceof FunctionObject)) throw new RuntimeError(
      `No function of name '${alias}' is exported from ${route}`
    );
    let result = interpreter.executeFunction(
      fun, inputArr, callerNode, execEnv, undefined, [CLEAR_FLAG]
    );
    if (result instanceof PromiseObject) {
      result = await result.promise;
    }
    return result;
  }

  // If route equals ".../<homeDirID>/<filePath>/callSMF/<alias>" +
  // "[/<inputArrHex>]", verify that filePath ends in '.sm.js', and if so,
  // execute the module and get the function exported as <alias>, then call it
  // on the inputArr and return its output. inputArr can either come from the
  // optional last segment of the route (JSON-then-hex-encoded) or from the
  // postData (only JSON-encoded).
  if (queryType === "callSMF") {
    if (filePath.slice(-6) !== ".sm.js") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let [ , alias, ...inputArr] = queryPathArr;
    if (!alias) throw new RuntimeError(
      "No function name provided",
      callerNode, execEnv
    );
    if (postData) {
      if (postData instanceof Array) {
        inputArr = postData;
      }
      else {
        inputArr = [postData];
      }
    }

    // Import and execute the given JS module using interpreter.import(), and
    // do so within a dev function with "elevated privileges" the execution of
    // the SMF (server module function). Note that these elevated privileges
    // can only be used to post to files within the called SM's home directory,
    // and that all previous such privileges are removed by the new flag. And
    // if the admin has requested admin privileges, we also set the "admin-
    // privileges" flag.
    // We also make sure update the "current-SMF-route" and "requesting-SMF-
    // route" // flags such that if an SMF is called from another SMF of a
    // different home directory, the called SMF can make CORS like checks to
    // see if the requesting SMF is allowed access. (Such CORS-like checks are
    // recommended for all SMFs that can alter the state of the database. And
    // they can also be used to limit access to private data.)
    let liveModule = await interpreter.import(
      `/${ownUPNodeID}/${homeDirID}/${filePath}`, callerNode, execEnv, true
    );
    let fun = liveModule.get(alias);
    if (!(fun instanceof FunctionObject)) throw new RuntimeError(
      `No function of name '${alias}' is exported from ${route}`,
      callerNode, execEnv
    );
    // The new "current-SMF-route" flag is copied as is from the former
    // "current-SMF-route" flag, and the old "current-SMF-route" flag becomes
    // the "requesting-SMF-route" flag instead. If the input array was passed
    // via postData, we just append the JSON array to the route for the "SMF
    // route".
    let currentSMFRoute = !postData ? route :
      `/${ownUPNodeID}/${homeDirID}/${filePath}/` +
        "callSMF/" + JSON.stringify(inputArr);
    let requestingSMFRoute = execEnv.getFlag(CURRENT_SMF_ROUTE_FLAG);
    let grantAdminPrivileges = execEnv.getFlag(GRANT_ADMIN_PRIVILEGES_FLAG);
    let result = interpreter.executeFunction(
      fun, inputArr, callerNode, execEnv, undefined, [
        [CURRENT_SMF_ROUTE_FLAG, currentSMFRoute],
        [REQUESTING_SMF_ROUTE_FLAG, requestingSMFRoute],
        [ELEVATED_PRIVILEGES_FLAG, homeDirID],
        [ADMIN_PRIVILEGES_FLAG, grantAdminPrivileges],
        [GRANT_ADMIN_PRIVILEGES_FLAG, false],
      ]
    );
    if (result instanceof PromiseObject) {
      result = await result.promise;
    }
    return result;
  }


  // If route equals ".../<homeDirID>/<filePath>/depositGas" with postData = 
  // "<gasJSON>" verify that filePath ends in '.sm.js', and if so, deposit the
  // requested amount of gas (from the current execution environment) there,
  // which can be unlocked by the locked "/_withdrawGas" route type below.
  if (queryType === "depositGas") {throw new RuntimeError(
      "This route has not been tested yet, and might be obsolete", // as we
      // might reimplement it as a route related to the home directory instead.
      callerNode, execEnv
    );
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    if (filePath.slice(-6) !== ".sm.js") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let reqGas, isValid = true;
    if (postData) {
      if (typeof postData !== "string") {
        try {
          reqGas = JSON.parse(postData);
        } catch (err) {
          isValid = false;
        }
      }
      if (!reqGas || typeof reqGas !== "object") {
        isValid = false;
      }
      if (!isValid) throw new RuntimeError(
        "Invalid gas object",
        callerNode, execEnv
      );
    }
    else throw new RuntimeError(
      "No requested gas JSON object provided",
      callerNode, execEnv
    );

    // Get the server module's gas reserve.
    let releaseAfter;
    if (!options.conn) {
      options.conn = dbQueryHandler.getConnection();
      releaseAfter = true;
    }
    let [resultRow = []] = await dbQueryHandler.queryDBProc(
      "selectSMGas", [homeDirID, filePath, 1],
      route, options, callerNode, execEnv,
    ) ?? [];
    let [gasReserve = {}] = resultRow;

    // Take subtract as much of the reqGas as possible from the current gas
    // object, then add it to the SM's gas reserve and update the DB with the
    // result.
    payGas(callerNode, execEnv, {dbWrite: JSON.stringify(gasReserve).length});
    let {gas} = execEnv.scriptVars;
    assignLeastPositiveOrUndefined(reqGas, gas);
    payGas(callerNode, execEnv, reqGas);
    addTo(gasReserve, reqGas);
    await dbQueryHandler.queryDBProc(
      "updateSMGas", [homeDirID, filePath, JSON.stringify(gasReserve), 1],
      route, options, callerNode, execEnv,
    );
    if (releaseAfter) {
      dbQueryHandler.releaseConnection(options.conn);
    }

    // Return the gas that was deposited as well as the new gas reserve.
    return [[reqGas, gasReserve]];
  }

  // If route equals ".../<homeDirID>/<filePath>/_withdrawGas" with postData = 
  // "<gasJSON>" verify that filePath ends in '.sm.js', and if so, withdraw the
  // requested amount of gas (adding it to the gas object of the current
  // execution environment).
  if (queryType === "_withdrawGas") {throw new RuntimeError(
      "This route has not been tested yet, and might be obsolete", // as we
      // might reimplement it as a route related to the home directory instead.
      callerNode, execEnv
    );
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    if (filePath.slice(-6) !== ".sm.js") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    let reqGas;
    if (postData) {
      if (typeof postData !== "string") {
        try {
          reqGas = JSON.parse(postData);
        } catch (err) {
          isValid = false;
        }
      }
      if (!reqGas || typeof reqGas !== "object") {
        isValid = false;
      }
      if (!isValid) throw new RuntimeError(
        "Invalid gas object",
        callerNode, execEnv
      );
    }
    else throw new RuntimeError(
      "No requested gas JSON object provided",
      callerNode, execEnv
    );

    // Get the server module's gas reserve.
    let releaseAfter;
    if (!options.conn) {
      options.conn = dbQueryHandler.getConnection();
      releaseAfter = true;
    }
    let [resultRow = []] = await dbQueryHandler.queryDBProc(
      "selectSMGas", [homeDirID, filePath, 1],
      route, options, callerNode, execEnv,
    ) ?? [];
    let [gasJSON = '{}'] = resultRow;
    let gasReserve = JSON.parse(gasJSON);

    // Take subtract as much of the reqGas as possible from deposited gas
    // reserve, then add it to the gas object.
    let {gas} = execEnv.scriptVars;
    assignLeastPositiveOrUndefined(reqGas, gasReserve);
    addTo(gas, reqGas);
    subtractFrom(gasReserve, reqGas);
    await dbQueryHandler.queryDBProc(
      "updateSMGas", [homeDirID, filePath, JSON.stringify(gasReserve), 1],
      route, options, callerNode, execEnv,
    );
    if (releaseAfter) {
      dbQueryHandler.releaseConnection(options.conn);
    }

    // Return the gas that was withdrawn and the new gasReserve.
    return [[reqGas, gasReserve]];
  }

  // If route equals ".../<homeDirID>/<filePath>/gas", read how much gas is
  // stored on the server module (assuming that it is one).
  if (queryType === "gas") {
    if (filePath.slice(-6) !== ".sm.js") throw new RuntimeError(
      `Invalid route: ${route}`,
      callerNode, execEnv
    );
    return await dbQueryHandler.queryDBProc(
      "selectSMGas", [homeDirID, filePath, 0],
      route, options, callerNode, execEnv,
    );
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}








function assignLeastPositiveOrUndefined(target, ...sourceArr) {
  Object.entries(target).forEach(([key, targetVal]) => {
    targetVal = Math.abs(targetVal);
    sourceArr.forEach(source => {
      let sourceVal = Math.abs(source[key]);
      target[key] = (sourceVal === undefined) ? sourceVal :
        (targetVal <= sourceVal) ? targetVal : sourceVal;
    });
  });
  return target;
}

function addTo(target, source) {
  Object.keys(source).forEach((key) => {
    let targetVal = target[key];
    target[key] = (targetVal === undefined) ? source[key] :
      targetVal + source[key];
  });
  return target;
}

function subtractFrom(target, source) {
  Object.keys(source).forEach((key) => {
    let targetVal = target[key];
    target[key] = (targetVal === undefined) ? source[key] :
      targetVal - source[key];
  });
  return target;
}