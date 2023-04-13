
import {
    getJQueryObj
} from "/UPA_scripts.php?id=t1";


/* Functions to verify and load hyperlinks into the UPA, and to follow them */

var urlRegExCache = {};

export function upaf_cacheURLRegEx(userID, pattID, key) {
    // test key.
    if (typeof key !== "string") {
        throw new Exception(
            "cacheURLRegEx(): key is not a string"
        );
    }
    if ( !(new RegExp("/^\\w+$/")).test(key) ) {
        throw new Exception(
            "cacheURLRegEx(): key does not match the right pattern " +
            '("/^\\w+$/")'
        );
    }
    // query UPA_links.php to see if pattID points to a whitelisted URL
    // pattern, and to get the held pattern string if so.
    // (UPA_links.php also verifies that userID is whitelisted for the
    // requesting user (if logged in; if not, userID has to be whitelisted
    // for public use).)
    let data = {uid: userID, pid: pattID}
    let res = JSON.parse($.getJSON("UPA_links.php", ).responseText);
    // if the pattern was whitelisted for UPA links, store it in the cache.
    if (res.success) {
        urlRegExCache[key] = new RegExp(res.pattern);
        return 0;
    } else {
        return res.error;
    }
}


export function upaf_isACachedURL(key) {
    if (typeof urlRegExCache[key] === "undefined") {
        return false;
    } else {
        return true;
    }
}

export function upaf_loadLink(selector, url, urlRegExKey) {
    let jqObj = getJQueryObj(selector);
    // lookup pattern (will fail if link is not cached, so the users might want
    // to check this first with isACachedLink()).
    let regex = urlRegExCache[urlRegExKey];
    // match link againt pattern.
    if (!regex.test(url)) {
        throw new Exception(
            "loadLink(): RegEx was cached but did not match the input link"
        );
    }
    // load the link into all selected <a></a> elements.
    jqObj.filter('a').attr("src", url});
}

export function upaf_followLink(url, urlRegExKey, target) {
    // test target.
    if (
        typeof target !== "undefined" &&
        !(target in ["_self", "_blank", "_parent", "_top"])
    ) {
        throw new Exception(
            "loadLink(): invalid target " +
            "(options are '_self', '_blank', '_parent' or '_top')"
        );
    }
    // lookup pattern (will fail if link is not cached, so the users might want
    // to check this first with isACachedLink()).
    let regex = urlRegExCache[urlRegExKey];
    // match link againt pattern.
    if (!regex.test(url)) {
        throw new Exception(
            "followLink(): RegEx was cached but did not match the input link"
        );
    }
    // follow the link.
    window.open(url, target);
}







/* Functions to load more scripts on-demand */

export function upaf_loadModule(textID, funIdentList, asFunIdentList) {
    // request the module script from server through UPA_scripts.php.
    let data = {id: textID};
    let res = $.get("UPA_scripts.php", data).responseText;
    // check for returned error JSON.
    // (This check is not very robust, but the server will never send any script
    // that hasn't been whitelisted, so a bug here shouldn't be harmful.)
    if (res.substring(0, 6) == '{error') {
        throw new Exception(
            "loadModule(): input text ID does not point to a valid module"
        );
    }
    // test mandatory funIdentList and prepend "upaf_" to all the identifiers.
    testFunIdentArrAndPrependUPAFPrefix(funIdentList);
    // test that the length is greater than zero.
    let len = funIdentList.length;
    if (len == 0) {
        throw new Exception(
            "loadModule(): function identifier array is empty"
        );
    }
    // do something similar to asFunIdentList if it is supplied.
    if (typeof asFunIdentList !== "undefined") {
        // test asFunIdentList and prepend "upaf_" to all the identifiers.
        testFunIdentArrAndPrependUPAFPrefix(asFunIdentList);
        // test that the length is equal to the length of funIdentList.
        if (!(len === asFunIdentList.length)) {
            throw new Exception(
                "loadModule(): function identifier arrays are of different "
                "sizes"
            );
        }
    }
    // construct the module loading script html.
    var html = '<script type="module"> import {';
    if (typeof asFunIdentList === "undefined") {
        html += funIdentList.join(", ")
    } else {
        html += funIdentList[0] + " as " + asFunIdentList[0];
        for (let i = 0; i < len; i++) {
            html += ", " + funIdentList[i] + " as " + asFunIdentList[i];
        }
    }
    html += "} from UPA_scripts.php?id=" + textID + "; </script>";
    // append a script that imports functions from the result module (which
    // the browser has hopefully cached such that the HTTP request does not
    // need to be sent again).
    $('#upaMainFrame').after(html);
    // return the script just in case users have to take care to keep it in
    // memory to ensure that the HTTP request is still cached when needed
    // again.
    return res;
}


export function testFunIdentArrAndPrependUPAFPrefix(funIdentList) {
    //test funIdentList and prepend "upaf_" to all the identifiers.
    let len = funIdentList.length;
    let funIdentRegEx = new RegExp("/[\\w\\$]+/");
    for (let i = 0; i < len; i++) {
        // test identifier.
        if (!funIdentRegEx.test(funIdentList[i])) {
            throw new Exception(
                "loadModule(): invalid function identifier at index " +
                i.toString()
            );
        }
        // prepend "upaf_" to it.
        funIdentList[i] = "upaf_" + funIdentList[i];
    }
}






/* Functions to load images into the UPA */

// TODO: Make these at some point, perhaps after UPA_data.php has been made.
