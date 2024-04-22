import $ from 'jquery';


// (If it turns out that we'll need manual caching (for more than just
// collapsed forwarding), I will just use a LRU library, e.g.
// https://github.com/rsms/js-lru, to implement that pretty easily.)

export class DBRequestManager {
  static ongoingQueries = {};
  // static cache = {}; // Consider replacing with an LRU list, or consider
  // // just telling users that a disabled browser cache will slow the app
  // // down.


  static query(obj, reqData, callbackData, callback) {
    if (!callback) {
      callback = callbackData;
      callbackData = null;
    }
    // URL-encode the request data.
    let encodedReqData = {};
    Object.keys(reqData).forEach(function(key) {
      encodedReqData[key] = encodeURIComponent(reqData[key]);
    });
    // If there is already an ongoing query with this reqData object, simply
    // push the input data and return.
    let reqDataKey = JSON.stringify(reqData);
    let queryQueue = this.ongoingQueries[reqDataKey];
    if (queryQueue) {
      queryQueue.push([obj, callback, callbackData]);
      return;
    }
    
    // Else initialize an ongoing query data queue, and make a $.getJSON()
    // call, which runs all the callbacks in the queue on at a time upon
    // receiving the response from the server.
    this.ongoingQueries[reqDataKey] = [[obj, callback, callbackData]];
    let thisDBRM = this;
    let url = "http://localhost:80/query_handler.php";
    $.getJSON(url, encodedReqData, function(result) {
      // Get and then delete the ongiong query queue.
      let ongoingQueries = thisDBRM.ongoingQueries;
      let queryQueue = ongoingQueries[reqDataKey];
      delete ongoingQueries[reqDataKey];

      // Then call all callbacks in queryQueue with their associated data.
      for (let i = 0; i < queryQueue.length; i++) {
        let obj = queryQueue[i][0];
        let callback = queryQueue[i][1];
        let callbackData = queryQueue[i][2];
        callback(obj, result, callbackData);
      }
      // // If cacheQuery is true, cache the query.
      // if (cacheQuery) {
      //   thisDBRM.cache[reqDataKey] = result;
      // }
    });
  }

  static input(obj, reqData, callbackData, callback) {
    if (!callback) {
      callback = callbackData;
      callbackData = null;
    }
    let url = "http://localhost:80/input_handler.php";
    $.post(url, reqData, function(result) {
      callback(obj, result, callbackData);
    });
  }



  static queryAndSet(setResults, key, ind, reqData) { 
    if (!reqData) {
      reqData = ind;
      ind = undefined;
      if (!reqData) {
        reqData = key;
        key = undefined;
      }
    }

    // URL-encode the request data.
    let encodedReqData = {};
    Object.keys(reqData).forEach(function(key) {
      encodedReqData[key] = encodeURIComponent(reqData[key]);
    });

    // If there is already an ongoing query with this reqData object, simply
    // push the input data and return.
    let reqDataKey = JSON.stringify(reqData);
    let queryQueue = this.ongoingQueries[reqDataKey];
    if (queryQueue) {
      queryQueue.push([setResults, key, ind]);
      return;
    }

    // // Else if the query is already cached, use that result and return.
    // let cachedResult = this.cache[reqDataKey];
    // if (cachedResult) {
    //   callback(obj, cachedResult, callbackData);
    //   return;
    // }

    // Else initialize an ongoing query data queue, and make an AJAX HTTP
    // call, which runs all the callbacks in the queue on at a time upon
    // receiving the response from the server.
    this.ongoingQueries[reqDataKey] = [[setResults, key, ind]];
    // let thisDBRM = this;
    let url = "http://localhost:80/query_handler.php";
    $.getJSON(url, encodedReqData, result => {
      // Get and then delete the ongiong query queue.
      let ongoingQueries = this.ongoingQueries;
      let queryQueue = ongoingQueries[reqDataKey];
      delete ongoingQueries[reqDataKey];

      // Then call all setResults callbacks in queryQueue to change the ind'th
      // entry of the associated results state.
      let len = queryQueue.length;
      for (let i = 0; i < len; i++) {
        let setResults = queryQueue[i][0];
        let key = queryQueue[i][1];
        let ind = queryQueue[i][2];
        if (key === undefined) {
          setResults({data: result, isFetched: true, isFetching: false});
        } else if (ind === undefined) {
          setResults(prev => {
            let ret = {...prev};
            ret[key] = {data: result, isFetched: true, isFetching: false};
            return ret;
          });
        } else {
          setResults(prev => {
            let ret = {...prev};
            ret[key] ??= [];
            ret[key][ind] = {data: result, isFetched: true, isFetching: false};
            return ret;
          });
        }
      }

      // // if cacheQuery is true, cache the query.
      // if (cacheQuery) {
      //   this.cache[reqDataKey] = result;
      // }
    });
  }


  static inputAndSet(setResults, key, ind, reqData) {
    if (!reqData) {
      reqData = ind;
      ind = undefined;
      if (!reqData) {
        reqData = key;
        key = undefined;
      }
    }

    let url = "http://localhost:80/input_handler.php";
    $.post(url, reqData, result => {
      if (key === undefined) {
        setResults({data: result, isFetched: true, isFetching: false});
      } else if (ind === undefined) {
        setResults(prev => {
          let ret = {...prev};
          ret[key] = {data: result, isFetched: true, isFetching: false};
          return ret;
        });
      } else {
        setResults(prev => {
          let ret = {...prev};
          ret[key] ??= [];
          ret[key][ind] = {data: result, isFetched: true, isFetching: false};
          return ret;
        });
      }
    });
  }
}

// Hm, if react always sanitizes automatically, should I just not sanitize,
// then? ..I guess not..

export function sanitize(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}


export default DBRequestManager;
