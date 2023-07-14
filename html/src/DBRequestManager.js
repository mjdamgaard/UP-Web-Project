
// (If it turns out that we'll need manual caching (for more than just
// collapsed forwarding), I will just use a LRU library, e.g.
// https://github.com/rsms/js-lru, to implement that pretty easily.)

export class DBRequestManager {
    constructor() {
        this.ongoingQueries = {};
    }

    query(obj, reqData, callbackData, callback) {
        if (!callback) {
            callback = callbackData;
            callbackData = null;
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
        // else initialize an ongoing query data queue, and make a $.getJSON()
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
                            result[i][j] = result[i][j]
                                .replaceAll("&", "&amp;")
                                .replaceAll("<", "&lt;")
                                .replaceAll(">", "&gt;")
                                .replaceAll('"', "&quot;")
                                .replaceAll("'", "&apos;");
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
