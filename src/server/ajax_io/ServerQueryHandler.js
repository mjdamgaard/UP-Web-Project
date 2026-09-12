
export const curDomain = (typeof window === "undefined") ? "localhost" :
  /^https?:\/\/([^:/]*)/.exec(window.location.href)[1];

export const upNodeIDs = {
  "localhost": "1",
  "up-web.org": "1",
};


// TODO: Add a noCache option, which the users also get to optionally set.



export class ServerQueryHandler {

  constructor(
    authToken = undefined, expTime = undefined, fetchFun = fetch,
    domain = curDomain
  ) {
    this.tokenData = {authToken: authToken, expTime: expTime};
    this.fetch = fetchFun;
    this.domain = domain;
    this.nodeID = upNodeIDs[domain];
  }

  getTokenData() {
    if (this.tokenData.authToken) {
      return this.tokenData;
    }
    return JSON.parse(
      localStorage.getItem("userData") ?? "{}"
    );
  }

  async fetchNodeID(domain = this.domain) {
    return upNodeIDs[domain];
  }


  async queryAJAXServer(
    isPrivate, route, isPost, postData, options, flags, upNodeID = this.nodeID
  ) {
    if (upNodeID !== this.nodeID) {
      console.log("curDomain: ", curDomain);
      console.log("this.domain: ", this.domain);
      console.log("upNodeID: ", JSON.stringify(upNodeID));
      console.log("this.nodeID: ", JSON.stringify(this.nodeID));
    }
    if (upNodeID !== this.nodeID) throw new NetworkError(
      `Unrecognized UP node ID: "${upNodeID}" (queries to routes of foreign ` +
      "UP nodes are not implemented yet)"
    );
    if (route.includes("//")) throw new NetworkError(
      "A route must not contain empty segments (repeated slashes). Received: " +
      route + "."
    );

    // If route starts with "this" in place of the upNodeID, replace it with
    // this.nodeID.
    route = route.replace(/^\/this(?![a-zA-Z0-9_-])/, "/" + this.nodeID);

    // Construct the reqBody.
    let headers = {};
    let prefStr = "";
    if (isPrivate) {
      // Add the flags to the Prefer header string.
      if (flags) Object.entries(flags).forEach(([key, val]) => {
        if (!val) return;
        if (prefStr) prefStr += ", ";
        prefStr += key;
        if (typeof val === "string") {
          prefStr += "=" + val;
        }
      });

      // Add the (so-far-implemented) options to the Prefer header string.
      if (options?.returnLog) {
        if (prefStr) prefStr += ", ";
        prefStr += "return-log";
      }
      if (options?.gas) {
        // TODO: Implement options for specifying the gas. And also perhaps
        // implement an option to specify whether to use the user's own gas.
        // (Right now, the default is to use the user's own gas when
        // isPrivate == true.) The idea of not using gas would either be to be
        // able to deposit gas via SMFs, or to get your request handled even if
        // the server is stressed. However, in terms of the latter reason, it
        // would be more optimal to handle this in the HTTP API layer, and not
        // in the user-programmed application layer.
      }

      // Get the authentication token and set the Authorization header.
      let {authToken, expTime} = this.getTokenData();
      if (expTime && expTime * 1000 < Date.now() + 20) {
        throw new NetworkError(
          "User login session is expired"
        );
      }
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      else throw new NetworkError(
        "A non-login-related POST request was made before the user was " +
        "logged in"
      );
    }

    if (prefStr) {
      headers["Prefer"] = prefStr;
    }

    let reqBody;
    if (isPost) {
      reqBody = JSON.stringify(postData);
    }
    return await this.#request("ajax", route, isPost, reqBody, headers);
  }



  async queryLoginServer(reqType, reqBody, authOptions) {
    let route = "/" + reqType;
    let headers = authOptions?.authToken ? {
      Authorization: `Bearer ${authOptions.authToken}`
    } : authOptions?.username ? {
      Authorization:
        `Basic ${btoa(`${authOptions.username}:${authOptions.password}`)}`
    } : {};

    return await this.#request("login", route, true, reqBody, headers);
  }



  #requestBuffer = new Map();


  async #request(
    serverKey, route, isPost = false, reqBody = undefined, headers = {}
  ) {
    let reqKey = JSON.stringify([serverKey, route, isPost, reqBody, headers]);

    // If there is already an ongoing request with this reqData object,
    // simply return the promise of that.
    let responsePromise = this.#requestBuffer.get(reqKey);
    if (responsePromise) {
      let ret = await responsePromise;
      if (ret instanceof ErrorWrapper) {
        throw ret.val;
      }
    }

    // Send the request.
    responsePromise = this.#requestHelper(
      serverKey, route, isPost, reqBody, headers
    ).then(
      x => x, err => new ErrorWrapper(err)
    );

    // Then add it to requestBuffer, and also give it a then-callback to remove
    // itself from said buffer, before return ing the promise.
    this.#requestBuffer.set(reqKey, responsePromise);
    let ret = await responsePromise;
    this.#requestBuffer.delete(reqKey);
    if (ret instanceof ErrorWrapper) {
      throw ret.val;
    }
    return ret;
  }


  async #requestHelper(serverKey, route, isPost, reqBody, headers) {
    // Send the request.
    let options = isPost ? {
      method: "POST",
      headers: headers,
      body: reqBody,
    } : {
      headers: headers,
    };
    let fetch = this.fetch;
    let response;
    try {
      let url = this.#getURL(serverKey, route);
      response = await fetch(url, options);
    } catch (err) {
      if (err instanceof TypeError) {
        throw new NetworkError(err.message);
      }
      else throw err;
    }
    let responseText = await response.text();


    if (!response.ok) {
      throw new NetworkError(
        "HTTP error " + response.status +
        (responseText ? ": " + responseText : ""),
      );
    }
    else {
      let mimeType = response.headers.get("Content-Type");
      return unSerialize(responseText, mimeType);
    }
  }



  #getURL(serverKey, path) {
    let isLocalhost = this.domain === "localhost";
    let urlRoot = isLocalhost ? "http://localhost" : "https://" + this.domain;
    let serverPath;
    if (serverKey === "ajax") {
      serverPath = isLocalhost ? ":8080" : "/ajax";
    }
    else if (serverKey === "login") {
      serverPath = isLocalhost ? ":8081" : "/login";
    }
    let url = urlRoot + serverPath + path;
    return url;
  }




  fetch(route, options) {
    return this.queryAJAXServer(
      false, route, false, undefined, options,
    );
  }

  fetchAsAdmin(route, options) {
    return this.queryAJAXServer(
      true, route, false, undefined, options,
      {["request-admin-privileges"]: true}
    );
  }

  post(route, postData, options, flags) {
    return this.queryAJAXServer(
      true, route, true, postData, options, flags,
    );
  }

  postAsAdmin(route, postData, options) {
    return this.post(
      route, postData, options, {["request-admin-privileges"]: true}
    );
  }

}





export class NetworkError {
  constructor(msg) {
    this.msg = msg;
  }
  toString() {
    return this.msg; 
  }
}


class ErrorWrapper {
  constructor(val) {
    this.val = val;
  }
};




function unSerialize(val, mimeType) {
  if (mimeType === "text/plain") {
    return val;
  }
  else if (mimeType === "application/json") {
    try {
      return JSON.parse(val);
    } catch(err) {
      throw "Invalid application/json data received from server";
    }
  }
  else throw (
    `unSerialize(): Unrecognized/un-implemented MIME type: ${mimeType}`
  );
}

