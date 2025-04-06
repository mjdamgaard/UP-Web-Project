


export class ServerInterface {

  static #postReqQueue = new Map();

  static #post(reqData) {
      let reqKey = JSON.stringify(reqData);

      // If there is already an ongoing request with this reqData object,
      // simply return the promise of that.
      let responseTextPromise = this.#postReqQueue(reqKey);
      if (responseTextPromise) {
        return responseTextPromise;
      }

      // Else send the request to the server and create the new response text
      // promise.
      let url = "http://localhost:8080";
      responseTextPromise = postData(url, reqData);

      // Then add it to #postReqQueue, and also give it a then-callback to
      // remove itself from said queue, before return ing the promise.
      this.#postReqQueue.set(reqKey, responseTextPromise);
      responseTextPromise.then(() => {
        this.#postReqQueue.delete(reqKey);
      });
      return responseTextPromise;
  }


  static fetchScript(filePath) {
    if(filePath.slice(-3) !== ".js") throw (
      'Trying to fetch a script without a last name of ".js"'
    );
    return this.fetchTextFileContent(filePath)
  }


  static fetchTextFileContent(filePath) {
    return this.#post({route: filePath});
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
    return await response.text();
  }
}