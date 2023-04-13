
import {
    getJQueryObj
} from "/UPA_scripts.php?id=t1";


/* Functions to load hyperlinks into the UPA */

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
    // ..window.open()..
}




/* Functions to load images into the UPA */
