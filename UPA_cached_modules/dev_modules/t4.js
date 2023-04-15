
import {
    getJQueryObj
} from "/UPA_scripts.php?id=t1";


/* Functions to verify and load hyperlinks into the UPA, and to follow them */

var urlRegExCache = urlRegExCache ?? {};

export function upaf_cacheURLRegEx(pattID, key, userID) {
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
    let data = {pid: pattID, uid: userID}
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
        !(["_self", "_blank", "_parent", "_top"].includes(target))
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

export function upaf_loadScript(
    textID, callbackName, funIdentList, asFunIdentList
) {
    // test callback key (which shouldn't necessarily be defined at this point;
    // it can potentially be defined by the loaded module (which can be useful
    // if the function requires no input)).
    if (!/^[\$\w]+$/.test(callbackName)) {
        throw new Exception(
            "loadScript(): callback function name is not a valid " +
            "/^[\\$\\w]+$/ string"
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
    html += '} from "UPA_scripts.php?id=' + textID + '"; ';
    // append a call statement to the callback function, which should be
    // defined at this point in the newly loaded script, and append also the
    // closing script tag.
    html += "upaf_" + callbackName + "(); </script>";
    // append a script that imports functions from the module and runs the
    // provided callback function, which can either one of the newly loaded
    // functions, or a function that calls one or several of the newly loaded
    // functions.
    $('#upaMainFrame').after(html);
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

export function upaf_loadImage(selector, binID, format, altText, userID) {
    let data = {bid: binID, f: format, uid: userID}
    // TODO..
}

// TODO: Continue adding more types of binary resources, or add them in another
// file/text.
