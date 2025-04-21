
import {serverURL} from "./config.js";



export class ServerInterface {

  static #postReqBuffer = new Map();

  static #post(reqData) {
      let reqKey = JSON.stringify(reqData);

      // If there is already an ongoing request with this reqData object,
      // simply return the promise of that.
      let responseTextPromise = this.#postReqBuffer.get(reqKey);
      if (responseTextPromise) {
        return responseTextPromise;
      }

      // Else send the request to the server and create the new response text
      // promise.
      responseTextPromise = postData(serverURL, reqData);

      // Then add it to #postReqBuffer, and also give it a then-callback to
      // remove itself from said buffer, before return ing the promise.
      this.#postReqBuffer.set(reqKey, responseTextPromise);
      responseTextPromise.then(() => {
        this.#postReqBuffer.delete(reqKey);
      });
      return responseTextPromise;
  }


  static fetchScript(filePath, credentials) {
    if(filePath.slice(-3) !== ".js") throw (
      'Expected a script file name with the extension ".js", but got ' +
      `"${filePath}"`
    );
    return this.fetchTextFileContent(filePath, credentials)
  }


  static fetchTextFileContent(filePath, credentials) {
    return this.#post({
      credentials: credentials, action: "read", route: filePath,
    });
  }

  static putTextFile(credentials, filePath, contentText) {
    return this.#post({
      credentials: credentials, action: "put", route: filePath,
      content: contentText
    });
  }




  static createHomeDir(credentials, isPrivate) {
    return this.#post({
      credentials: credentials, action: "mkdir", isPrivate: isPrivate
    });
  }

}




export async function postData(url, reqData) {
  let options = {
    method: "POST",
    body: JSON.stringify(reqData),
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