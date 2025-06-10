
import {serverDomainURL} from "./config.js";
import {
  payGas, LoadError, jsonParse, RuntimeError,
} from "../../interpreting/ScriptInterpreter.js";

// TODO: Import FlagTransmitter.
let flagTransmitter;


export class ServerQueryHandler {

  constructor(userToken = undefined) {
    this.userToken = userToken;
  }

  getUserToken() {
    if (this.userToken) {
      return this.userToken;
    }
    return this.userToken = localStorage.getItem("authToken");
  }


  async queryServer(
    isPublic, route, isPost, postData, options, upNodeID, node, env
  ) {
    payGas(node, env, {fetch: 1});
    if (upNodeID !== "1") throw new RuntimeError(
      `Unrecognized UP node ID: "${upNodeID}" (queries to routes of foreign ` +
      "UP nodes are not implemented yet)",
      node, env
    );

    // Construct the reqBody.
    let reqData = {};
    if (isPost) {
      reqData.isPost = true;
      if (postData !== undefined) reqData.data = postData;
      if (options !== undefined) reqData.options = options;
      reqData.flags = flagTransmitter.getFlags(node, env);
    }

    let headers = {};
    if (!isPublic) {
      let token = this.getUserToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      else throw new RuntimeError(
        "A non-login-related POST request was made before the user was " +
        "logged in",
        node, env
      );
    }

    return await this.request(route, isPublic, reqData, node, env);
  }





  #requestBuffer = new Map();


  request(url, isGET = true, reqData = {}, headers = {}, node, env) {
    let reqKey = JSON.stringify([url, isGET, reqData, headers]);

    // If there is already an ongoing request with this reqData object,
    // simply return the promise of that.
    let responsePromise = this.#requestBuffer.get(reqKey);
    if (responsePromise) {
      return responsePromise;
    }

    // Send the request.
    responsePromise = this.#requestHelper(
      url, isGET, reqData, headers, node, env
    );

    // Then add it to requestBuffer, and also give it a then-callback to remove
    // itself from said buffer, before return ing the promise.
    this.#requestBuffer.set(reqKey, responsePromise);
    responsePromise.then(() => {
      this.#requestBuffer.delete(reqKey);
    });
    return responsePromise;
  }


  async #requestHelper(url, isGET, reqData, headers, node, env) {
    // Send the request.
    let options = isGET ? {
      headers: headers,
    } : {
      method: "POST",
      headers: headers,
      body: JSON.stringify(reqData),
    };
    let response = await fetch(serverDomainURL + url, options);



    if (!response.ok) {
      // TODO: Get the response again (and make it work in Node.js as well).
      let responseText = await response.text();
      // TODO: Consider changing the name of LoadError, and/or making a new
      // error type for server request errors.
      throw new LoadError(
        "HTTP error " + response.status +
        (responseText ? ": " + responseText : ""),
        node, env
      );
    }
    else {
      let mimeType = response.headers.get("Content-Type");
      let result = await response.text();
      return fromMIMEType(result, mimeType);
    }
  }


  fetch(url, headers = {}, node, env) {
    return this.request(url, true, undefined, headers, node, env);
  }

  fetchPrivate(url, headers = {}, node, env) {
    return this.request(url, true, {isPost: true}, headers, node, env);
  }

  async post(url, postData, headers = {}, node, env) {
    return await this.request(
      url, false,  {isPost: true, data: postData}, headers, node, env
    );
  }


}







function fromMIMEType(val, mimeType) {
  if (mimeType === "text/plain") {
    return val;
  }
  else if (mimeType === "text/json") {
    return jsonParse(val);
  }
  else throw (
    `fromMIMEType(): Unrecognized/un-implemented MIME type: ${mimeType}`
  );
}

















// // queryServerOrCache() handles queries where the whole result is stored
// // directly at the route in the cache, or simply not cached at all if the
// // noCache parameter is truthy.
// async queryServerOrCache(
//   route, isPost, postData, upNodeID, interpreter, cache,
//   routesToEvict, {maxAge, noCache, getCredentials = isPost}, onCached,
//   node, env,
// ) {
//   if (upNodeID !== "A") throw new RuntimeError(
//     `Unrecognized UP node ID: "${upNodeID}" (queries to routes of foreign ` +
//     "UP nodes are not implemented yet)",
//     node, env
//   );

//   // Parse the maxAge integer (in ms) and the lastUpToDate UNIX time integer.
//   maxAge = parseInt(maxAge ?? 60000);
//   lastUpToDate = parseInt(lastUpToDate);

//   // If noCache is falsy, look in the cache first.
//   let cachedResult, fetchedResult, wasReady, lastUpToDate, now;
//   if (!noCache) {
//     payGas(node, env, {cacheRead: 1});
//     now = Date.now();
//     [cachedResult, lastUpToDate] = cache.get(route) ?? [];
//     if (cachedResult !== undefined) {
//       // If the resource was cached, check if it is still considered fresh
//       // according to the maxAge argument, and if so return the result.
//       let isFresh = now - lastUpToDate <= maxAge;
//       if (isFresh) {
//         return cachedResult;
//       }
//       // Else if not fresh, we still continue to query the server, but first
//       // we call onCached() right away if provided.
//       else if (onCached !== undefined) {
//         interpreter.executeFunction(onCached, [cachedResult], node, env);
//       }
//     }
//   }

//   // Query the server for [result, wasReady]. (TODO: Make the dbRead cost
//   // depend on the size of the result list, perhaps divided by 1000, or
//   // something like that, and then rounded up.)
//   payGas(node, env, {fetch: 1});
//   let reqData = {};
//   if (getCredentials) {
//     let {reqUserID} = env.scriptVars;
//     let token = "TODO: Implement.";
//     reqData.credentials = btoa(`${reqUserID}:${token}`);
//   }
//   if (postData !== undefined) reqData.postData = postData;
//   else if (noCache) {
//     reqData.noCache = true;
//   }
//   if (maxAge !== undefined) reqData.maxAge = maxAge;
//   if (lastUpToDate) reqData.lastUpToDate = lastUpToDate;
//   [fetchedResult, wasReady] = await this.post(route, reqData) ?? [];

//   // If the cachedResult was already up-to-date, use the cachedResult going
//   // forward, and if not, use the fetched result.
//   let result = wasReady ? cachedResult : fetchedResult;

//   // If noCache is not truthy, we also update the cache.
//   if (!noCache) {
//     payGas(node, env, {cacheWrite: 1});
//     lastUpToDate = now;
//     cache.set(route, [result, lastUpToDate]);
//   }

//   // If routesToEvict is defined, it means that the query modifies the
//   // database, and therefore should also evict previously stored results in
//   // the cache (at least when the query is expected to potentially out-date
//   // some cache entries).
//   if (routesToEvict) {
//     if (!noCache) throw (
//       "ServerQueryHandler.queryServerOrCache(): routesToEvict must not be " +
//       "used with a falsy noCache"
//     )
//     routesToEvict.forEach(route => {
//       // If a route entry in the array is not a string, treat it as a route--
//       // removeExtensions pair, where if removeExtensions is true, it means
//       // that all routes that are extensions of route should also be removed.
//       let removeExtensions = false; 
//       if (typeof route !== "string") {
//         [route, removeExtensions] = route;
//       }
//       if (removeExtensions) {
//         cache.removeExtensions(route);
//       }
//       cache.remove(route);
//     });
//   }

//   // And finally, return the result (either cached or fetched).
//   return result;
// }



// // queryServer() is the same as queryServerOrCache() above, just without the
// // cache. 
// queryServer(
//   route, data, upNodeID, interpreter, options, node, env,
// ) {
//   return queryServerOrCache(
//     route, data, upNodeID, interpreter, undefined, undefined,
//     options,
//     node, env,
//   );
// }

