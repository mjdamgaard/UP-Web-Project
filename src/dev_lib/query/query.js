
import {
  DevFunction, RuntimeError, LoadError, jsonParse, jsonStringify,
  getPrototypeOf, OBJECT_PROTOTYPE, ARRAY_PROTOTYPE, FunctionObject,
  CLEAR_FLAG, PromiseObject, Environment, LiveJSModule, parseString,
  TEXT_FILE_ROUTE_REGEX, SCRIPT_ROUTE_REGEX, CSSModule, getString,
  getPropertyFromObject, ArgTypeError, forEachValue, ObjectObject,
} from '../../interpreting/ScriptInterpreter.js';
import {scriptParser} from "../../interpreting/parsing/ScriptParser.js";
import {parseRoute} from './src/route_parsing.js';

import {
  CAN_POST_FLAG, ELEVATED_PRIVILEGES_FLAG, NO_TRACE_FLAG
} from "./src/flags.js";



export const upNodeID = "1";




export const queryRoute = new DevFunction(
  "queryRoute", {
    isAsync: true,
    typeArr: ["string", "boolean?", "any?", "object?"],
  },
  async function(
    {callerNode, execEnv, interpreter},
    [route, isPost = false, postData, options = {}]
  ) {
    // If isPost == true, check if the current environment is allowed to post.
    if (isPost) {
      let canPost = execEnv.getFlag(CAN_POST_FLAG);
      if (!canPost) throw new RuntimeError(
        "Cannot post from here",
        callerNode, execEnv
      );
    }

    // And else change to an environment where the "can-post" flag is set to
    // false.
    else {
      execEnv = new Environment(
        execEnv, undefined, {flags: [[CAN_POST_FLAG, false]]},
      );
    }

    // Parse the route, extracting parameters and qualities from it.
    let isLocked, routeUPNodeID, homeDirID, localPath, dirSegments, fileName,
      fileExt, queryPathSegments;
    try {
    [
      isLocked, routeUPNodeID, homeDirID, localPath, dirSegments, fileName,
      fileExt, queryPathSegments
    ] = parseRoute(route);
    }
    catch(errMsg) {
      throw new RuntimeError(errMsg, callerNode, execEnv);
    }

    // Check against querying a locked route without the isPrivate option being
    // true, or without it being a post request.
    let isPrivate = isPost || getPropertyFromObject(options, "isPrivate");
    if (isLocked && !isPrivate) ArgTypeError(
      "Fetching from a locked route without the 'isPrivate' option set",
      callerNode, execEnv
    );

    // Also make sure to deep-copy the postData if it is an object, and do it
    // via a JSON conversion back and forth such that the object is turned into
    // a plain one.
    if (postData && typeof postData === "object") {
      postData = JSON.parse(jsonStringify(postData));
    }

    // If on the server side, and if upNodeID is that of the UP node that the
    // server is part of, query the database, but not before checking if the
    // privileges are elevated for the given home directory if the route is
    // locked.
    let result;
    if (interpreter.isServerSide && routeUPNodeID === upNodeID) {
      if (isLocked) {
        let curHomeDirID = execEnv.getFlag(ELEVATED_PRIVILEGES_FLAG);
        if (!curHomeDirID || curHomeDirID !== homeDirID) throw new RuntimeError(
          `Requested elevated privileges on Directory ${homeDirID} not granted`,
          callerNode, execEnv
        );
      }
      result = await interpreter.queryDB(
        route, isPost, postData, options,
        homeDirID, localPath, dirSegments, fileName, fileExt, queryPathSegments,
        callerNode, execEnv, interpreter
      );
    }

    // Else query a server at the given UP node.
    else {
      let isPrivate = isPost || getPropertyFromObject(options, "isPrivate");
      result = await interpreter.queryServer(
        isPrivate, route, isPost, postData, options, routeUPNodeID,
        callerNode, execEnv
      );
    }

    // And finally, return the result.
    return result;
  }
);




export const query = new DevFunction(
  "query", {
    isAsync: true,
    typeArr: ["string", "boolean?", "any?", "object?", "array?"],
  },
  async function(
    {callerNode, execEnv, interpreter}, [
      extendedRoute, isPost = false, postData, options = {},
      ancestorModules = []
    ],
  ) {
    let isPrivate = isPost || getPropertyFromObject(options, "isPrivate");

    // First split the input route along each (optional) occurrence of ';',
    // where the first part is then the actual route that is queried, and any
    // and all of the subsequent parts are what we can call "casting paths",
    // which reinterprets/casts the queried result into something else.
    let route, castingSegmentArr;
    [route, ...castingSegmentArr] = extendedRoute.split(';');

    // Check against infinite import recursion.
    if (ancestorModules instanceof ObjectObject) {
      ancestorModules = ancestorModules.members;
    }
    if (
      ancestorModules.includes(extendedRoute) ||
      ancestorModules.includes(route)
    ) throw new LoadError(
      "Infinite recursion: Module " + route + " imports itself. Ancestor " +
      "modules when error happened: " + ancestorModules.join(", ") + ".",
      callerNode, execEnv
    );

    // If the route is a module that has already been executed, get it from the
    // liveModules cache instead.
    let {liveModules, parsedScripts} = execEnv.scriptVars;
    let liveModule = liveModules.get(route);
    let result;
    if (liveModule) {
      if (liveModule instanceof Promise) {
        liveModule = await liveModule;
      }
      result = liveModule;
    }

    // If route is a dev library path, which always comes in the form of a bare
    // module specifier (left over in the build step, if any), try to import
    // the given library.
    else if (route[0] !== "/") {
      let devMod = interpreter.staticDevLibs.get(route);
      if (devMod) {
        liveModule = new LiveJSModule(
          route, Object.entries(devMod), execEnv.scriptVars
        );
        liveModules.set(route, liveModule);
      }
      else {
        let devLibURL = interpreter.devLibURLs.get(route);
        if (!devLibURL) throw new LoadError(
          `Developer library "${route}" not found`,
          callerNode, execEnv
        );
        try {
          let liveModulePromise = new Promise((resolve, reject) => {
            import(devLibURL).then(devMod => {
              let liveModule = new LiveJSModule(
                route, Object.entries(devMod), execEnv.scriptVars
              );
              resolve(liveModule);
            }).catch(err => reject(err));
          }).then(x => x, e => e);
          liveModules.set(route, liveModulePromise);
          liveModule = await liveModulePromise;
          liveModules.set(route, liveModule);
        } catch (err) {
          throw new LoadError(
            `Developer library "${route}" failed to import ` +
            `from ${devLibURL}`,
            callerNode, execEnv
          );
        }
      }
      result = liveModule;
    }

    // Else if the module is a user module, with a '.js' or '.jsx' extension,
    // fetch/get it and create and return a LiveJSModule instance rom it.
    else if (SCRIPT_ROUTE_REGEX.test(route)) {
      // First try to get it from the parsedScripts buffer, then try to fetch
      // it from the database.
      let [parsedScript, lexArr, strPosArr, script] =
        parsedScripts.get(route) ?? [];
      if (!parsedScript) {
        script = await queryRoute.fun(
          {callerNode, execEnv, interpreter},
          [route, false, undefined, options],
        );
        if (typeof script !== "string") throw new LoadError(
          `No script was found at ${route}`,
          callerNode, execEnv
        );
        [parsedScript, lexArr, strPosArr] = parseString(
          script, callerNode, execEnv, scriptParser
        );
        if (!isPrivate) {
          parsedScripts.set(route, [parsedScript, lexArr, strPosArr, script]);
        }
      }

      // Before executing the module, first check that the module haven't been
      // executed while waiting for the script to be fetched.
      liveModule = liveModules.get(route);
      if (liveModule) {
        if (liveModule instanceof Promise) {
          liveModule = await liveModule;
        }
        result = liveModule;
      }

      // Else execute the module, inside the global environment, and return the
      // resulting liveModule, after also adding it to liveModules.
      else {
        let globalEnv = execEnv.getGlobalEnv();
        let liveModulePromise = new Promise((resolve, reject) => {
          interpreter.executeModule(
            parsedScript, lexArr, strPosArr, script, route, globalEnv,
            ancestorModules,
          ).then(
            ([liveModule]) => resolve(liveModule)
          ).catch(
            err => reject(err)
          );
        }).then(x => x, e => e);
        if (!isPrivate) {
          liveModules.set(route, liveModulePromise);
          liveModule = await liveModulePromise;
          liveModules.set(route, liveModule);
        } else {
          liveModule = await liveModulePromise;
        }
        result = liveModule;
      }
    }

    // Else if the module is actually a non-JS text file, fetch/get it and
    // return a string of its content instead.
    else if (TEXT_FILE_ROUTE_REGEX.test(route)) {
      let text = await queryRoute.fun(
        {callerNode, execEnv, interpreter},
        [route, false, undefined, options],
      );
      if (typeof text !== "string") throw new LoadError(
        `No text was found at ${route}`,
        callerNode, execEnv
      );
      if (route.slice(-4) === ".css") {
        result = new CSSModule(route, text);
      } else {
        result = text;
      }
    }

    // Else simply redirect to queryRoute().
    else {
      result = await queryRoute.fun(
        {callerNode, execEnv, interpreter},
        [route, isPost, postData, options],
      );
    };


    // We now have the result from querying the route itself, but the extended
    // route might also contain extra segments, separated by semicolons, used
    // for "casting" this result into a different form (or extracting data
    // from it, in particular by using ';get/<alias>' segments, which returns
    // a particular export of the given module, or ';call/<alias>[/argument]*'
    // segments which calls the exported function and returns what it returns).
    let len = castingSegmentArr.length;
    for (let i = 0; i < len; i++) {
      let castingSegment = castingSegmentArr[i];

      // The following casting segment types are for casting between JSON
      // objects (strings) and actual JS objects.
      if (castingSegment === "object") {
        result = jsonParse(result, callerNode, execEnv);
        if (getPrototypeOf(result) !== OBJECT_PROTOTYPE) throw new LoadError(
          "JSON value is not a plain object",
          callerNode, execEnv
        );
      }
      else if (castingSegment === "array") {
        result = jsonParse(result, callerNode, execEnv);
        if (getPrototypeOf(result) !== ARRAY_PROTOTYPE) throw new LoadError(
          "JSON value is not an array",
          callerNode, execEnv
        );
      }
      else if (castingSegment === "parse") {
        result = jsonParse(result, callerNode, execEnv);
      }
      else if (castingSegment === "stringify") {
        result = jsonStringify(result);
      }
      else if (
        castingSegment === "string" ||
        /^\.txt$/.test(castingSegment)
      ) {
        result = getString(result, execEnv, true);
      }

      // You can also cast any string-valued result into a JS or JSX module,
      // or a CSS module.
      else if (/^\.jsx?$/.test(castingSegment)) {
        if (result instanceof LiveJSModule) {
          return result;
        }
        let [parsedScript, lexArr, strPosArr] = parseString(
          result, callerNode, execEnv, scriptParser
        );
        let globalEnv = execEnv.getGlobalEnv();
        let scriptPath = route + ";" +
          castingSegmentArr.slice(0, i + 1).join(";");
        let [liveModule] = await interpreter.executeModule(
          parsedScript, lexArr, strPosArr, result, scriptPath, globalEnv
        );
        result = liveModule;
      }
      else if (/^\.css$/.test(castingSegment)) {
        if (result instanceof CSSModule) {
          return result;
        }
        let modulePath = route + ";" +
          castingSegmentArr.slice(0, i + 1).join(";");
        result = new CSSModule(modulePath, result);
      }

      // And then we have the ';get' and ';call' casting segments, which work
      // similarly to './get' and './call' routes, except the casting happens on
      // the current machine, and not on the server that is queried. ';get' and
      // ';call' routes are thus often preferred over './get' and './call',
      // as they allow for more efficient use of HTTP caching.
      else if (/^(get|call)\//.test(castingSegment)) {
        let [queryType, alias, ...inputArr] = castingSegment.split("/");
        if (!(result instanceof LiveJSModule)) throw new LoadError(
          "No JS module found at " + route + (
            (i > 0) ? castingSegmentArr.slice(0, i).join(";") : ""
          ),
          callerNode, execEnv
        );
        result = result.get(alias);
        if (result === undefined) throw new LoadError(
          "No export of the name '" + alias + "' found in " + route + (
            (i > 0) ? castingSegmentArr.slice(0, i).join(";") : ""
          ),
          callerNode, execEnv
        );
        if (queryType === "call") {
          if (!(result instanceof FunctionObject)) throw new LoadError(
            "No function of the name '" + alias + "' exported from " + route + (
              (i > 0) ? castingSegmentArr.slice(0, i).join(";") : ""
            ),
            callerNode, execEnv
          );
          result = interpreter.executeFunction(
            result, inputArr, callerNode, execEnv, undefined, [CLEAR_FLAG]
          );
          if (result instanceof PromiseObject) {
            result = await result.promise;
          }
        }
      }

      // We can also cast a list of all home directory descendants, namely when
      // route is of the form "If route is of the form "/<upNodeID>/" +
      // "<homeDirID>", such that we instead get a list of only the children
      // of a given subdirectory. More precisely, if the casting segment has
      // the form ';/<dirPath>', where dirPath is either an empty string or a
      // string of the form "(<dirName>/)+", we check that the previous result
      // is an array of strings, and if so, we treat it as an array of all
      // descendants and extract the children of the given subdirectory.
      else if (/^\/([^/]+\/)*/.test(castingSegment)) {
        // Throw is result is not an array of strings.
        if (
          !(result instanceof Array) ||
          result.some(val => typeof val !== "string")
        ) {
          throw new LoadError(
            "Result was not an array of file names at " + route + (
              (i > 0) ? castingSegmentArr.slice(0, i).join(";") : ""
            ),
            callerNode, execEnv
          );
        }

        // First transform the result such that each file path is cut off at
        // the first slash that comes after the subdirectory path.
        let subdirectoryPath = castingSegment.substring(1);
        if (subdirectoryPath && subdirectoryPath.at(-1) !== "/") {
          subdirectoryPath += "/";
        }
        let len = subdirectoryPath.length;
        let transformedResult = result.map(val => {
          let indOfNextSlash = val.indexOf("/", len);
          return (indOfNextSlash === -1) ? val.substring(len) :
            val.substring(len, indOfNextSlash);
        });

        // Then filter out all strings where the original string isn't a super-
        // string of subdirectoryPath, as well as all duplicates.
        result = transformedResult.filter((val, ind) => {
          return  (
            (ind === 0 || val !== transformedResult[ind - 1]) && 
            result[ind].substring(0, len) === subdirectoryPath
          );
        });
      }
    
      else throw new LoadError(
        "Unrecognized casting segment: '" + castingSegment + "'",
        callerNode, execEnv
      );
    }

    // And finally, return the result.
    return result;
  }
);


export const fetch = new DevFunction(
  "fetch", {isAsync: true, typeArr: ["string", "object?", "array?"]},
  async function(
    {callerNode, execEnv, interpreter},
    [extendedRoute, options, ancestorModules = []],
  ) {
    // If returnLog is true, also automatically set isPrivate: true, before
    // calling query.fun().
    if (options && getPropertyFromObject(options, "returnLog")) {
      let modifiedOptions = {};
      forEachValue(options, callerNode, execEnv, (val, key) => {
        modifiedOptions[key] = val;
      });
      modifiedOptions.isPrivate = true;
      options = modifiedOptions;
    }
    let result = await query.fun(
      {callerNode, execEnv, interpreter},
      [extendedRoute, false, undefined, options, ancestorModules],
    );
    return result;
  }
);

export const fetchPrivate = new DevFunction(
  "fetchPrivate", {isAsync: true, typeArr: ["string", "object?", "array?"]},
  async function(
    {callerNode, execEnv, interpreter},
    [extendedRoute, options = {}, ancestorModules = []],
  ) {
    // Add isPrivate: true to the options object before calling fetch.fun().
    let modifiedOptions = {};
    forEachValue(options, callerNode, execEnv, (val, key) => {
      modifiedOptions[key] = val;
    });
    modifiedOptions.isPrivate = true;
    options = modifiedOptions;
    let result = await fetch.fun(
      {callerNode, execEnv, interpreter},
      [extendedRoute, options, ancestorModules],
    );
    return result;
  }
);


export const post = new DevFunction(
  "post", {isAsync: true, typeArr: ["string", "any?", "object?", "array?"]},
  async function(
    {callerNode, execEnv, interpreter},
    [route, postData, options, ancestorModules = []],
  ) {
    let result = await query.fun(
      {callerNode, execEnv, interpreter},
      [route, true, postData, options, ancestorModules],
    );
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




export const encodeURIComponent = new DevFunction(
  "encodeURIComponent", {typeArr: ["string"]}, 
  ({callerNode, execEnv}, [str]) => {
    try {
      return window.encodeURIComponent(str);
    }
    catch (err) {
      throw new ArgTypeError(
        err.message,
        callerNode, execEnv
      );
    }
  }
);

export const decodeURIComponent = new DevFunction(
  "decodeURIComponent", {typeArr: ["string"]}, 
  ({callerNode, execEnv}, [str]) => {
    try {
      return window.decodeURIComponent(str);
    }
    catch (err) {
      throw new ArgTypeError(
        err.message,
        callerNode, execEnv
      );
    }
  }
);

export const encodeURI = new DevFunction(
  "encodeURI", {typeArr: ["string"]}, 
  ({callerNode, execEnv}, [str]) => {
    try {
      return window.encodeURI(str);
    }
    catch (err) {
      throw new ArgTypeError(
        err.message,
        callerNode, execEnv
      );
    }
  }
);

export const decodeURI = new DevFunction(
  "decodeURI", {typeArr: ["string"]}, 
  ({callerNode, execEnv}, [str]) => {
    try {
      return window.decodeURI(str);
    }
    catch (err) {
      throw new ArgTypeError(
        err.message,
        callerNode, execEnv
      );
    }
  }
);




export const clearPermissions = new DevFunction(
  "clearPermissions", {typeArr: ["function"]},
  ({callerNode, execEnv, interpreter}, [callback]) => {
    return interpreter.executeFunction(
      callback, [], callerNode, execEnv, undefined, [CLEAR_FLAG]
    );
  }
);


export const noPost = new DevFunction(
  "noPost", {typeArr: ["function"]},
  ({callerNode, execEnv, interpreter}, [callback]) => {
    return interpreter.executeFunction(
      callback, [], callerNode, execEnv, undefined, [[CAN_POST_FLAG, false]]
    );
  }
);

export const clearPrivileges = new DevFunction(
  "clearPrivileges", {typeArr: ["function"]},
  ({callerNode, execEnv, interpreter}, [callback]) => {
    return interpreter.executeFunction(
      callback, [], callerNode, execEnv, undefined,
      [[ELEVATED_PRIVILEGES_FLAG, false]]
    );
  }
);



// noTrace() suppresses traces from being generated and logged alongside any
// errors thrown while the flag is raised. And if the SMF calls another SMF
// (via './callSMF') any traces made inside the this called SMF should stop
// when reaching the the caller SMF. Use this function whenever the SMF handles
// private data that the client or the caller SMF may not see.
export const noTrace = new DevFunction(
  "noTrace", {typeArr: ["function"]},
  ({callerNode, execEnv, interpreter}, [callback]) => {
    return interpreter.executeFunction(
      callback, [], callerNode, execEnv, undefined, [NO_TRACE_FLAG]
    );
  }
);