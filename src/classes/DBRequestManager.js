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





  // static queryAndSet(setResults, key, reqData) {
  //   if (!reqData) {
  //     reqData = key;
  //     key = undefined;
  //   }

  //   this.query(reqData, [setResults, key], this.#queryAndSetCallback);
  // }

  // static #queryAndSetCallback = (result, callbackData) => {
  //   let setResults = callbackData[0];
  //   let key = callbackData[1];
  //   if (key === undefined) {
  //     setResults({data: result, isFetched: true, isFetching: false});
  //   } else {
  //     setResults(prev => {
  //       let ret = {...prev};
  //       ret[key] = {data: result, isFetched: true, isFetching: false};
  //       return ret;
  //     });
  //   }
  // };



  // static queryAndSet(setResults, key, reqData) {
  //   if (!reqData) {
  //     reqData = key;
  //     key = undefined;
  //   }

  //   // URL-encode the request data.
  //   let encodedReqData = {};
  //   Object.keys(reqData).forEach(function(key) {
  //     encodedReqData[key] = encodeURIComponent(reqData[key]);
  //   });

  //   // If there is already an ongoing query with this reqData object, simply
  //   // push the insert data and return.
  //   let reqDataKey = JSON.stringify(reqData);
  //   let queryQueue = this.ongoingQueries[reqDataKey];
  //   if (queryQueue) {
  //     queryQueue.push([setResults, key, ind]);
  //     return;
  //   }

  //   // // Else if the query is already cached, use that result and return.
  //   // let cachedResult = this.cache[reqDataKey];
  //   // if (cachedResult) {
  //   //   callback(obj, cachedResult, callbackData);
  //   //   return;
  //   // }

  //   // Else initialize an ongoing query data queue, and make an AJAX HTTP
  //   // call, which runs all the callbacks in the queue on at a time upon
  //   // receiving the response from the server.
  //   this.ongoingQueries[reqDataKey] = [[setResults, key, ind]];
  //   // let thisDBRM = this;
  //   let url = "http://localhost:80/query_handler.php";
  //   $.getJSON(url, encodedReqData, result => {
  //     // Get and then delete the ongiong query queue.
  //     let ongoingQueries = this.ongoingQueries;
  //     let queryQueue = ongoingQueries[reqDataKey];
  //     delete ongoingQueries[reqDataKey];

  //     // Then call all setResults callbacks in queryQueue to change the ind'th
  //     // entry of the associated results state.
  //     let len = queryQueue.length;
  //     for (let i = 0; i < len; i++) {
  //       let setResults = queryQueue[i][0];
  //       let key = queryQueue[i][1];
  //       let ind = queryQueue[i][2];
  //       if (key === undefined) {
  //         setResults({data: result, isFetched: true, isFetching: false});
  //       } else if (ind === undefined) {
  //         setResults(prev => {
  //           let ret = {...prev};
  //           ret[key] = {data: result, isFetched: true, isFetching: false};
  //           return ret;
  //         });
  //       } else {
  //         setResults(prev => {
  //           let ret = {...prev};
  //           ret[key] ??= [];
  //           ret[key][ind] = {data: result, isFetched: true, isFetching: false};
  //           return ret;
  //         });
  //       }
  //     }

  //     // // if cacheQuery is true, cache the query.
  //     // if (cacheQuery) {
  //     //   this.cache[reqDataKey] = result;
  //     // }
  //   });
  // }


  static insertAndSet(setResults, key, reqData) {
    if (!reqData) {
      reqData = key;
      key = undefined;
    }

    let url = "http://localhost:80/insert_handler.php";
    postData(url, reqData, (responseText) => {
      let result = JSON.parse(responseText);
      if (key === undefined) {
        setResults({data: result, isFetched: true, isFetching: false});
      } else {
        setResults(prev => {
          let ret = {...prev};
          ret[key] = {data: result, isFetched: true, isFetching: false};
          return ret;
        });
      }
      // } else if (ind === undefined) {
      //   setResults(prev => {
      //     let ret = {...prev};
      //     ret[key] = {data: result, isFetched: true, isFetching: false};
      //     return ret;
      //   });
      // } else {
      //   setResults(prev => {
      //     let ret = {...prev};
      //     ret[key] ??= [];
      //     ret[key][ind] = {data: result, isFetched: true, isFetching: false};
      //     return ret;
      //   });
      // }
    });
  }
}


// export function sanitize(str) {
//   return str
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;")
//     .replaceAll("'", "&apos;");
// }






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
        if (responseText === '"Deadlock encountered in the database"') {
          callback(null);
          return;
        }
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
