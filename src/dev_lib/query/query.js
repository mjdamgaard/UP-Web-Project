
import {
  DevFunction, RuntimeError, LoadError, jsonParse, jsonStringify,
  getPrototypeOf, OBJECT_PROTOTYPE, ARRAY_PROTOTYPE, FunctionObject,
  CLEAR_FLAG, PromiseObject,
} from '../../interpreting/ScriptInterpreter.js';
import {parseRoute} from './src/parseRoute.js';

import {checkAdminPrivileges, checkIfCanPost} from "./src/flags.js";

const ownUPNodeID = "1";




export const query = new DevFunction(
  "query", {
    isAsync: true,
    typeArr: ["string", "boolean?", "any?", "boolean?", "object?"],
  },
  async function(
    {callerNode, execEnv, interpreter, liveModule},
    [extendedRoute, isPost = false, postData, isPrivate, options = {}]
  ) {
    isPost ||= isPrivate;

    // If isPost == true, check if the current environment is allowed to post.
    if (isPost) {
      checkIfCanPost(callerNode, execEnv);
    }

    // First split the input route along each (optional) occurrence of '/>',
    // where the first part is then the actual route that is queried, and any
    // and all of the subsequent parts are what we can call "casting paths",
    // which reinterprets/casts the queried result into something else.
    let route, castingPathArr;
    [route, ...castingPathArr] = extendedRoute.split(';');

    // Parse the route, extracting parameters and qualities from it.
    let isLocked, upNodeID, homeDirID, filePath, fileExt, queryPathArr;
    try {
    [
      isLocked, upNodeID, homeDirID, filePath, fileExt, queryPathArr
    ] = parseRoute(route);
    }
    catch(errMsg) {
      throw new RuntimeError(errMsg, callerNode, execEnv);
    }

    // If on the server side, and if upNodeID is that of the UP node that the
    // server is part of, query the database, but not before checking admin
    // privileges for the given home directory if the route is locked.
    let result;
    if (interpreter.isServerSide && upNodeID === ownUPNodeID) {
      if (isLocked) {
        checkAdminPrivileges(homeDirID, callerNode, execEnv);
      }
      result = await interpreter.dbQueryHandler.queryDBFromScript(
        route, isPost, postData, options,
        homeDirID, filePath, fileExt, queryPathArr,
        callerNode, execEnv
      );
    }

    // Else query a server at the given UP node.
    else {
      result = await interpreter.queryServer(
        isPrivate, route, isPost, postData, options, upNodeID,
        callerNode, execEnv
      );
    }

    // If there are any casting paths, cast the result accordingly.
    let len = castingPathArr.length;
    for (let i = 0; i < len; i++) {
      let castingPath = castingPathArr[i];
      if (castingPath === "object") {
        result = jsonParse(result, callerNode, execEnv);
        if (getPrototypeOf(result) !== OBJECT_PROTOTYPE) throw new LoadError(
          "JSON value is not a plain object",
          callerNode, execEnv
        );
      }
      else if (castingPath === "array") {
        result = jsonParse(result, callerNode, execEnv);
        if (getPrototypeOf(result) !== ARRAY_PROTOTYPE) throw new LoadError(
          "JSON value is not an array",
          callerNode, execEnv
        );
      }
      else if (castingPath === "parse") {
        result = jsonParse(result, callerNode, execEnv);
      }
      else if (castingPath === "stringify") {
        result = jsonStringify(result);
      }
      else if (/^(\.jsx?)?\//.test(castingPath)) {
        let [ , queryType, alias, inputArrJSON] = castingPath.split("/");
        if (queryType === "get") {
          // Import and execute the given JS module using interpreter.import(),
          // then get the export of the given alias.
          let liveModule = await interpreter.import(
            `/${ownUPNodeID}/${homeDirID}/${filePath}`, callerNode, execEnv
          );
          result = liveModule.get(alias);
        }
        else if (queryType === "call") {
          let inputArr = jsonParse(inputArrJSON, callerNode, execEnv);

          // Import and execute the given JS module using interpreter.import(),
          // and do so within a dev function with the "clear" flag, which
          // removes all permission-granting flags for the module's execution
          // environment. And when the liveModule is gotten, get and execute
          // the function, also within the same enclosed execution environment.
          let liveModule = await interpreter.import(
            `/${ownUPNodeID}/${homeDirID}/${filePath}`, callerNode, execEnv
          );
          let fun = liveModule.get(alias);
          if (!(fun instanceof FunctionObject)) throw new RuntimeError(
            `No function of name '${alias}' is exported from ${route}`
          );
          result = interpreter.executeFunction(
            fun, inputArr, callerNode, execEnv, undefined, [CLEAR_FLAG]
          );
          if (result instanceof PromiseObject) {
            result = await result.promise;
          }
        }
      }
      else {
        // Simply do nothing if the casting path does not match the above
        // cases, as casting paths might also be used in order to change the
        // behavior of import(). For instance, putting ';.js' at the end of a
        // route will make import() treat the result as a JS module, and one
        // can also do the same thing with ';.jsx' or ';.css'.
      }
    }

    // And finally, return the result.
    return result;
  }
);



export const fetch = new DevFunction(
  "fetch", {isAsync: true, typeArr: ["string", "boolean?", "any?"]},
  async function(
    {callerNode, execEnv, interpreter},
    [extendedRoute, isPrivate = false, options]
  ) {
    let [result] = await query.fun(
      {callerNode, execEnv, interpreter},
      [extendedRoute, false, undefined, isPrivate, options],
    ) ?? [];
    return result;
  }
);


export const post = new DevFunction(
  "post", {isAsync: true, typeArr: ["string", "any?", "any?"]},
  async function(
    {callerNode, execEnv, interpreter},
    [route, postData, options]
  ) {
    let [result] = await query.fun(
      {callerNode, execEnv, interpreter},
      [route, true, postData, true, options],
    ) ?? [];
    return result;
  }
);



export const getCurrentHomePath = new DevFunction(
  "getCurrentHomePath", {},
  function({execEnv}, []) {
    let curRoute = execEnv.getModuleEnv().modulePath ?? "";
    let [ret] = curRoute.match(/^\/[^/]+\/[^/]+/g) ?? [];
    return ret; 
  }
);