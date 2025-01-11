// import $ from 'jquery';


// (If it turns out that we'll need manual caching (for more than just
// collapsed forwarding), I will just use a LRU library, e.g.
// https://github.com/rsms/js-lru, to implement that pretty easily.)



export class DBRequestManager {
  static ongoingQueries = {};
  // static cache = {}; // Consider replacing with an LRU list, or consider
  // // just telling users that a disabled browser cache will slow the app
  // // down.


  static query(reqData, callback = () => {}) {
    // If there is already an ongoing query with this reqData object, simply
    // push the insert data and return.
    let reqDataKey = JSON.stringify(reqData);
    let queryQueue = this.ongoingQueries[reqDataKey];
    if (queryQueue) {
      queryQueue.push(callback);
      return;
    }
    
    // Else initialize an ongoing query data queue, and make a fetchData()
    // call, which runs all the callbacks in the queue on at a time upon
    // receiving the response from the server.
    this.ongoingQueries[reqDataKey] = [callback];
    let url = "http://localhost:80/query_handler.php";
    fetchData(url, reqData, (responseText) => {
      // Get and then delete the ongoing query queue.
      let ongoingQueries = this.ongoingQueries;
      let queryQueue = ongoingQueries[reqDataKey];
      delete ongoingQueries[reqDataKey];

      // Then call all callbacks in queryQueue with their associated data,
      // but make a deep copy for each individual callback first.
      for (let i = 0; i < queryQueue.length; i++) {
        let callback = queryQueue[i];
        callback(responseText);
      }
      // // If cacheQuery is true, cache the query.
      // if (cacheQuery) {
      //   this.cache[reqDataKey] = result;
      // }
    });
  }



  static insert(reqData, callback = () => {}) {
    let url = "http://localhost:80/insert_handler.php";
    postData(url, reqData, (responseText) => {
      callback(responseText);
    });
  }



  static requestUpdate(reqData, callback = () => {}) {
    let url = "http://localhost:80/update_handler.php";
    postData(url, reqData, (responseText) => {
      callback(responseText);
    });
  }

}






export function fetchData(url, reqData, callback) {
  var queryURL = url;
  Object.entries(reqData).forEach(([key, val], ind) => {
    let delimiter = (ind === 0) ? "?" : "&";
    queryURL += delimiter + key + "=" + encodeURIComponent(val);
  });

  var options;
  if (queryURL.length <= 2000) {
    url = queryURL;
  } else {
    options = {
      method: "POST",
      body: JSON.stringify(reqData),
    };
  }

  fetch(url, options).then(response => {
    if (!response.ok) {
      throw "HTTP error: " + response.status;
    }
    response.text().then((responseText) => {
      callback(responseText);
    });
  });
}

export function postData(url, reqData, callback) {
  let options = {
    method: "POST",
    body: JSON.stringify(reqData),
  };

  fetch(url, options).then(response => {
    if (!response.ok) {
      response.text().then(responseText => {
        // if (responseText === '"Deadlock encountered in the database"') {
        //   callback(null);
        //   return;
        // }
        throw (
          "HTTP error " + response.status +
          (responseText ? ": " + responseText : "")
        );
      });
      return;
    }
    response.text().then((responseText) => {
      callback(responseText);
    });
  });
}




export default DBRequestManager;
