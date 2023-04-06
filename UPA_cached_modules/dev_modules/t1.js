
/* Some functions to cache and select jQuery objects */


var mainFrameJQueryObj = $("#upaMainFrame");

class JQueryObjCache {
    public static cache = {"mainFrame":mainFrameJQueryObj};
    // public static cache = {};
}


// Note that since this function does not have the upaFun_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
export function getJQueryObj(selector) {
    if (typeof selector !== "string") {
        throw new Exception(
            "getJQueryObj(): input selector is not a string"
        );
    }
    if (selector.test("/^\$\w+$/")) {
        return JQueryObjCache.cache[substring(selector, 1)];
    } else {
        // TODO: Test/check that jQuery.find() is safe for any string input
        // such that it always returns a descendent element or null/undefined
        // or throws an exception.
        return mainFrameJQueryObj.find(selector);
    }
}


export function upaFun_cacheJQueryObj(selector, key) {
    let jqObj = getJQueryObj(selector);
    if (!key.test("/^\w+$/")) {
        throw new Exception(
            "cacheJQueryObj(): input key is not a valid /^\w+$/ string"
        );
    }
    JQueryObjCache.cache[key] = jqObj;
}
