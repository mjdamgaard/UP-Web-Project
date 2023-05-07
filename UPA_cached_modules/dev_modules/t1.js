
// import {
//     getJQueryObj, upaf_runResultingFunction
// } from "/UPA_scripts.php?id=t1";


/* Function to upload and query ratings, terms and other info */

export function upa_upload(reqKey, reqDataArr, callback) {
    let reqData = new InputDataConstructors[reqKey + "ReqData"](
        reqDataArr[0], reqDataArr[1], reqDataArr[2], reqDataArr[3],
        reqDataArr[4], reqDataArr[5],
    );
    $.getJSON("input_handler.php", reqData, callback);
}

export function upa_queryAndSanitize(reqKey, reqDataArr, callback) {
    let reqData = new QueryDataConstructors[reqKey + "ReqData"](
        reqDataArr[0], reqDataArr[1], reqDataArr[2], reqDataArr[3],
        reqDataArr[4], reqDataArr[5],
    );
    $.getJSON("query_handler.php", reqData, function(result){
        // unless reqKey == "Set", sanitize the first column of result.
        let resultLen = result.length;
        for (let i = 0; i < resultLen; i++) {
            result[i] = result[i]
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&apos;");
        }
        // then call the callback function on the sanitized result.
        callback(result);
    });
}

export class DBRequestManager {
    constructor() {
        this.cache = {};
    }

    query($obj, reqData, cacheKey, callback) {
        if (typeof callback === "undefined") {
            callback = cacheKey;
            cacheKey = null;
        }
    // else {
    //     let cachedValue = this.cache[cacheKey];
    //     if (typeof cachedValue !== "undefined") {
    //         callback($obj, cachedValue, "success: cached", this.cache);
    //     }
    //     // TODO: Consider a reimplementation where cacheKey can consist of
    //     // several consequtive keys seperated by dots ('.'), where the
    //     // lookup then becomes like this.cache[key1][key2]...[keyN].
    // }
        let thisDBReqManager = this;
        $.getJSON("query_handler.php", reqData, function(result, textStatus) {
            // unless reqKey == "Set", sanitize the first column of result.
            if (reqData.type !== "S") {
                let len = result.length;
                for (let i = 0; i < len; i++) {
                    result[i] = result[i]
                        .replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;")
                        .replaceAll('"', "&quot;")
                        .replaceAll("'", "&apos;");
                }
            }
            // if cacheKey is not nullish, store the result in this.cache.
            if (typeof cacheKey !== "undefined") {
                thisDBReqManager.cache[cacheKey] = result;
            }
            // then call the callback function on the sanitized result.
            callback($obj, result, textStatus, thisDBReqManager.cache);
        });
    }

    // TODO: Add more query methods, preferably some that gathers several
    // requests into one, reading part of the request from the termType..
}







export function upaFind(selector) {
    // return the descendents of #upaFrame that matches the selector.
    return $("#upaFrame").find(selector);
}









/* Functions to verify and load hyperlinks into the UPA, and to follow them */

// TODO: Update these at some point.

var urlRegExCache = urlRegExCache ?? {};

export function upa_cacheURLRegEx(pattID, key, userID) {
    // test key.
    if (typeof key !== "string") {
        throw (
            "cacheURLRegEx(): key is not a string"
        );
    }
    if ( !(/^\w+$/.test(key)) ) {
        throw (
            "cacheURLRegEx(): key does not match the right pattern " +
            '("/^\\w+$/")'
        );
    }
    // query UPA_links.php to see if pattID points to a whitelisted URL
    // pattern, and to get the held pattern string if so.
    // (UPA_links.php also verifies that userID is whitelisted for the
    // requesting user (if logged in; if not, userID has to be whitelisted
    // for public use).)
    let data = {pid: pattID, uid: userID}
    let res = JSON.parse($.getJSON("UPA_link_patterns.php", ).responseText);
    // if the pattern was whitelisted for UPA links, store it in the cache.
    if (res.success) {
        urlRegExCache["upak_" + key] = new RegExp(res.str);
        return 0;
    } else {
        return res.error;
    }
}


export function upa_isACachedURL(key) {
    if (typeof urlRegExCache["upak_" + key] === "undefined") {
        return false;
    } else {
        return true;
    }
}

export function upa_loadLink(selector, url, urlRegExKey) {
    let jqObj = getJQueryObj(selector);
    // lookup pattern (will fail if link is not cached, so the users might want
    // to check this first with isACachedLink()).
    let regex = urlRegExCache["upak_" + urlRegExKey];
    // match link againt pattern.
    if (!regex.test(url)) {
        throw (
            "loadLink(): RegEx was cached but did not match the input link"
        );
    }
    // load the link into all selected <a></a> elements.
    jqObj.filter('a').attr("src", url);
}

export function upa_followLink(url, urlRegExKey, target) {
    // test target.
    if (
        typeof target !== "undefined" &&
        !(["_self", "_blank", "_parent", "_top"].includes(target))
    ) {
        throw (
            "loadLink(): invalid target " +
            "(options are '_self', '_blank', '_parent' or '_top')"
        );
    }
    // lookup pattern (will fail if link is not cached, so the users might want
    // to check this first with isACachedLink()).
    let regex = urlRegExCache["upak_" + urlRegExKey];
    // match link againt pattern.
    if (!regex.test(url)) {
        throw (
            "followLink(): RegEx was cached but did not match the input link"
        );
    }
    // follow the link.
    window.open(url, target);
}







/* Functions to load more scripts on-demand */

// TODO: Change..
export function upa_loadScript(
    moduleID, callbackName, funIdentList, asFunIdentList
) {
    // test callback key (which shouldn't necessarily be defined at this point;
    // it can potentially be defined by the loaded module (which can be useful
    // if the function requires no input)).
    if (!/^[\$\w]+$/.test(callbackName)) {
        throw (
            "loadScript(): callback function name is not a valid " +
            "/^[\\$\\w]+$/ string"
        );
    }
    // test mandatory funIdentList and prepend "upaf_" to all the identifiers.
    testFunIdentArrAndPrependUPAFPrefix(funIdentList);
    // test that the length is greater than zero.
    let len = funIdentList.length;
    if (len == 0) {
        throw (
            "loadModule(): function identifier array is empty"
        );
    }
    // do something similar to asFunIdentList if it is supplied.
    if (typeof asFunIdentList !== "undefined") {
        // test asFunIdentList and prepend "upaf_" to all the identifiers.
        testFunIdentArrAndPrependUPAFPrefix(asFunIdentList);
        // test that the length is equal to the length of funIdentList.
        if (!(len === asFunIdentList.length)) {
            throw (
                "loadModule(): function identifier arrays are of different " +
                "sizes"
            );
        }
    }
    // construct the first part of the script html element, including the
    // import statement.
    var html = '<script type="module" async> import {';
    if (typeof asFunIdentList === "undefined") {
        html += funIdentList.join(", ")
    } else {
        html += funIdentList[0] + " as " + asFunIdentList[0];
        for (let i = 1; i < len; i++) {
            html += ", " + funIdentList[i] + " as " + asFunIdentList[i];
        }
    }
    html += '} from "UPA_scripts.php?id=' + moduleID + '"; ';
    // append a call statement to the callback function, which should be
    // defined at this point in the newly loaded script, and append also the
    // closing script tag.
    html += "upaf_" + callbackName + "(); </script>";
    // append a script that imports functions from the module and runs the
    // provided callback function, which can either one of the newly loaded
    // functions, or a function that calls one or several of the newly loaded
    // functions.
    $('#upaFrame').after(html);
}


export function testFunIdentArrAndPrependUPAFPrefix(funIdentList) {
    //test funIdentList and prepend "upaf_" to all the identifiers.
    let len = funIdentList.length;
    let funIdentRegEx = /[\w\$]+/;
    for (let i = 0; i < len; i++) {
        // test identifier.
        if (!funIdentRegEx.test(funIdentList[i])) {
            throw (
                "loadModule(): invalid function identifier at index " +
                i.toString()
            );
        }
        // prepend "upaf_" to it.
        funIdentList[i] = "upaf_" + funIdentList[i];
    }
}






/* Functions to load images into the UPA */

export function upa_loadImage(selector, binID, format, altText, userID) {
    if (binID === "b0") {
        // add null src to <image> elements..
    }
    let data = {bid: binID, f: format, uid: userID}
    // TODO..
}

// TODO: Continue adding more types of binary resources, or add them in another
// file/text.
