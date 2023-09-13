import {useState, useEffect, useMemo} from "react";
import $ from 'jquery';

export const useQuery = (results, setResults, reqData) => {
  useMemo(() => {
    if (reqData.req) {
      if (!results.isFetched) {
        DBRequestManager.query(setResults, reqData);
      }
    } else {
      let keys = Object.keys(reqData);
      keys.forEach(key => {
        let data = reqData[key];
        if (data.req) {
          results[key] ??= {}; // (Here we break a rule in a non-harmful way.)
          if (!results[key].isFetched) {
            DBRequestManager.query(setResults, key, data);
          }
        } else if (Array.isArray(data)) {
          results[key] ??= [];
          data.forEach((val, ind) => {
            results[key][ind] ??= [];
            if (val && !results[key][ind].isFetched) {
              DBRequestManager.query(setResults, key, ind, val);
            }
          });
        } else {
          throw "useQuery(): reqData input is ill-formed.";
        }
      });
    }
  }, [reqData]);
};
// export const useQuery = (setResults, key, reqData) => {
//   useMemo(() => {
//     if (Array.isArray(reqData)) {
//       reqData.map((val, ind) => {
//         if (val) {
//           DBRequestManager.query(setResults, key, ind, val);
//         }
//       });
//     } else {
//       DBRequestManager.query(setResults, key, reqData);
//     }
//   }, []);
// };
// export const useInput = (reqData, setResults, ind) => {
//   useEffect(() => {
//     DBRequestManager.input(reqData, setResults, ind);
//   }, []);
// };

// (If it turns out that we'll need manual caching (for more than just
// collapsed forwarding), I will just use a LRU library, e.g.
// https://github.com/rsms/js-lru, to implement that pretty easily.)

export class DBRequestManager {
  static ongoingQueries = {};
  // static cache = {}; // Consider replacing with an LRU list, or consider
  // // just telling users that a disabled browser cache will slow the app
  // // down.

  static query(setResults, key, ind, reqData) {
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

      // Unless reqData.type equals "set", or "bin", sanitize all
      // cells in the result table containing string values.
      if (reqData.type !== "set" && reqData.type !== "bin") {
        // TODO: Investigate how jQuery's automatic JSON-parsing of the
        // numerical data as number types works for BIGINT outputs (will
        // this cause overflow bugs??).
        let colLen = result.length;
        let rowLen = (result[0] ?? []).length;
        for (let i = 0; i < colLen; i++) {
          for (let j = 0; j < rowLen; j++) {
            if (typeof result[i][j] === "string") {
              result[i][j] = sanitize(result[i][j]);
            }
          }
        }
      }

      // Then call all setResults callbacks in queryQueue to change the ind'th
      // entry of the associated results state.
      let len = queryQueue.length;
      for (let i = 0; i < len; i++) {
        let setResults = queryQueue[i][0];
        let key = queryQueue[i][1];
        let ind = queryQueue[i][2];
        if (typeof key === "undefined") {
          setResults({data: result, isFetched: true});
        } else if (typeof ind === "undefined") {
          setResults(prev => {
            let ret = {...prev};
            ret[key] = {data: result, isFetched: true};
            return ret;
          });
        } else {
          setResults(prev => {
            let ret = {...prev};
            ret[key] ??= [];
            ret[key][ind] = {data: result, isFetched: true};
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

  static input(setResults, key, reqData) {
    let url = "http://localhost:80/input_handler.php";
    $.post(url, reqData, result => {
      setResults(prev => {
        let ret = [...prev];
        ret[key] = result;
        return ret;
      });
    });
  }
}

export function sanitize(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export default DBRequestManager;
