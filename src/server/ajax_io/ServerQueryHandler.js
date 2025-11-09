
export const curDomain = (typeof window === "undefined") ? "localhost" :
  /^https?:\/\/([^:/]*)/.exec(window.location.href)[1];

export const OWN_UP_NODE_ID = "1";




export class ServerQueryHandler {

  constructor(
    authToken = undefined, expTime = undefined, fetchFun = fetch,
    domain = curDomain
  ) {
    this.tokenData = {authToken: authToken, expTime: expTime};
    this.fetch = fetchFun;
    this.domain = domain;
  }

  getTokenData() {
    if (this.tokenData.authToken) {
      return this.tokenData;
    }
    return JSON.parse(
      localStorage.getItem("userData") ?? "{}"
    );
  }


  async queryAJAXServer(
    isPrivate, route, isPost, postData, options, upNodeID, flags
  ) {
    if (upNodeID !== OWN_UP_NODE_ID) throw new NetworkError(
      `Unrecognized UP node ID: "${upNodeID}" (queries to routes of foreign ` +
      "UP nodes are not implemented yet)"
    );

    // Construct the reqBody.
    let reqData = {};
    let headers = {};
    if (isPrivate) {
      if (options !== undefined) reqData.options = options;
      if (flags !== undefined) reqData.flags = flags;

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
    if (isPost) {
      reqData.isPost = true;
      if (postData !== undefined) reqData.data = postData;
    }

    let reqBody = JSON.stringify(reqData);
    return await this.request("ajax", route, !isPrivate, reqBody, headers);
  }



  async queryLoginServer(reqType, reqBody, authOptions) {
    let route = "/" + reqType;
    let headers = authOptions?.authToken ? {
      Authorization: `Bearer ${authOptions.authToken}`
    } : authOptions?.username ? {
      Authorization:
        `Basic ${btoa(`${authOptions.username}:${authOptions.password}`)}`
    } : {};

    return await this.request("login", route, false, reqBody, headers);
  }



  #requestBuffer = new Map();


  async request(
    serverKey, route, isGET = true, reqBody = undefined, headers = {}
  ) {
    let reqKey = JSON.stringify([serverKey, route, isGET, reqBody, headers]);

    // If there is already an ongoing request with this reqData object,
    // simply return the promise of that.
    let responsePromise = this.#requestBuffer.get(reqKey);
    if (responsePromise) {
      return await responsePromise;
    }

    // Send the request.
    responsePromise = this.#requestHelper(
      serverKey, route, isGET, reqBody, headers
    );

    // Then add it to requestBuffer, and also give it a then-callback to remove
    // itself from said buffer, before return ing the promise.
    this.#requestBuffer.set(reqKey, responsePromise);
    let ret = await responsePromise;
    this.#requestBuffer.delete(reqKey);
    return ret;
  }


  async #requestHelper(serverKey, route, isGET, reqBody, headers) {
    // Send the request.
    let options = isGET ? {
      headers: headers,
    } : {
      method: "POST",
      headers: headers,
      body: reqBody,
    };
    let fetch = this.fetch;
    let response;
    try {
      let url = this.#getURL(serverKey, route);debugger;
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
      false, route, false, undefined, options, OWN_UP_NODE_ID
    );
  }

  fetchAsAdmin(route, options) {
    return this.queryAJAXServer(
      true, route, false, undefined, options, OWN_UP_NODE_ID,
      {["request-admin-privileges"]: true}
    );
  }

  post(route, postData, options, flags) {
    return this.queryAJAXServer(
      true, route, true, postData, options, OWN_UP_NODE_ID, flags
    );
  }

  postAsAdmin(route, postData, options) {
    return this.post(
      route, postData, options, {["request-admin-privileges"]: true}
    );
  }

}





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





export class NetworkError {
  constructor(msg) {
    this.msg = msg;
  }
  toString() {
    return this.msg; 
  }
}

