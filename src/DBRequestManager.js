import $ from 'jquery';

// (If it turns out that we'll need manual caching (for more than just
// collapsed forwarding), I will just use a LRU library, e.g.
// https://github.com/rsms/js-lru, to implement that pretty easily.)

export class DBRequestManager {
    constructor() {
        this.ongoingQueries = {};
        this.cache = {}; // Consider replacing with an LRU list, or consider
        // just telling users that a disabled browser cache will slow the app
        // down.
    }

    query(obj, reqData, callbackData, cacheQuery, callback) {
        if (!callback) {
            callback = cacheQuery;
            cacheQuery = false;
            if (!callback) {
                callback = callbackData;
                callbackData = null;
            }
        }
        // URL-encode the request data.
        let encodedReqData = {};
        Object.keys(reqData).forEach(function(key) {
            encodedReqData[key] = encodeURIComponent(reqData[key]);
        });
        // if there is already an ongoing query with this reqData object, simply
        // push the input data and return.
        let reqDataKey = JSON.stringify(reqData);
        let queryQueue = this.ongoingQueries[reqDataKey];
        if (queryQueue) {
            queryQueue.push([obj, callback, callbackData]);
            return;
        }
        // else if the query is already cached, use that result and return.
        let cachedResult = this.cache[reqDataKey];
        if (cachedResult) {
            callback(obj, cachedResult, callbackData);
            return;
        }
        // else initialize an ongoing query data queue, and make an AJAX HTTP
        // call, which runs all the callbacks in the queue on at a time upon
        // receiving the response from the server.
        this.ongoingQueries[reqDataKey] = [[obj, callback, callbackData]];
        let thisDBRM = this;
        $.getJSON("query_handler.php", encodedReqData, function(result) {
            // get and then delete the ongiong query queue.
            let ongoingQueries = thisDBRM.ongoingQueries;
            let queryQueue = ongoingQueries[reqDataKey];
            delete ongoingQueries[reqDataKey];
            // unless reqData.type equals "set", or "bin", sanitize all
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
            // then call all callbacks in queryQueue with their associated data.
            for (let i = 0; i < queryQueue.length; i++) {
                let obj = queryQueue[i][0];
                let callback = queryQueue[i][1];
                let callbackData = queryQueue[i][2];
                callback(obj, result, callbackData);
            }
            // if cacheQuery is true, cache the query.
            if (cacheQuery) {
                thisDBRM.cache[reqDataKey] = result;
            }
        });
    }

    input(obj, reqData, callbackData, callback) {
        if (!callback) {
            callback = callbackData;
            callbackData = null;
        }
        $.post("input_handler.php", reqData, function(result) {
            callback(obj, result, callbackData);
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
