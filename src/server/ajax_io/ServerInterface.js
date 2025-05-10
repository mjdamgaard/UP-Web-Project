
import {serverDomainURL} from "./config.js";


export async function postData(url, reqData) {
  let options = {
    method: "POST",
    body: JSON.stringify(reqData),
    // headers: {
    //   "Authorization": credentials ? `Basic ${credentials}` : undefined,
    // }
  };

  let response = await fetch(url, options);

  if (!response.ok) {
    response.text().then(responseText => {
      throw (
        "HTTP error " + response.status +
        (responseText ? ": " + responseText : "")
      );
    });
    return;
  }
  else {
    let result = await response.text()
    return JSON.parse(result);
  }
}




export class ServerInterface {

  static #postReqBuffer = new Map();

  static #post(route, reqData, credentials) {
      let reqKey = JSON.stringify(reqData);

      // If there is already an ongoing request with this reqData object,
      // simply return the promise of that.
      let responseTextPromise = this.#postReqBuffer.get(reqKey);
      if (responseTextPromise) {
        return responseTextPromise;
      }

      // Else send the request to the server and create the new response text
      // promise.
      let url = serverDomainURL + route;
      // let credentials = btoa(`${username}:${password}`)
      responseTextPromise = postData(url, reqData, credentials);

      // Then add it to #postReqBuffer, and also give it a then-callback to
      // remove itself from said buffer, before return ing the promise.
      this.#postReqBuffer.set(reqKey, responseTextPromise);
      responseTextPromise.then(() => {
        this.#postReqBuffer.delete(reqKey);
      });
      return responseTextPromise;
  }



  static fetchHomeDirDescendants(homeDirID, credentials) {
    return this.#post(
      `/${homeDirID}`,
      {credentials: credentials, noCache: true},
    );
  }


  static fetchScript(filePath, credentials) {
    if(filePath.slice(-3) !== ".js") throw (
      'Expected a script file name with the extension ".js", but got ' +
      `"${filePath}"`
    );
    return this.fetchTextFileContent(filePath, credentials)
  }

  static fetchAdminID(filePath, credentials) {
    let [ , homeDirID] = /^\/?([^/]+)\//.exec(filePath) ?? [];
    return this.#post(
      `/${homeDirID}?admin`,
      {credentials: credentials},
    );
  }



  static fetchTextFileContent(filePath, credentials) {
    return this.#post(
      filePath,
      {credentials: credentials},
    );
  }

  static putTextFile(filePath, text, credentials) {
    return this.#post(
      `/${filePath}?_put`,
      {credentials: credentials, method: "post", postData: text},
    );
  }


  static deleteFile(filePath, credentials) {
    return this.#post(
      `/${filePath}?_delete`,
      {credentials: credentials, method: "post"},
    );
  }


  static createHomeDir(credentials) {
    return this.#post(
      `/?mkdir`,
      {credentials: credentials, method: "post"},
    );
  }



  static putStructFile(credentials, filePath) {
    return this.#post({
      credentials: credentials, action: "put", route: filePath
    });
  }


  static touchStructFile(credentials, filePath) {
    return this.#post({
      credentials: credentials, action: "touch", route: filePath
    });
  }
}



