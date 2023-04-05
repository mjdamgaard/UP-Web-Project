
/* Some functions to cache and select jQuery objects */


class JQueryObjCache {
    public static cache = {"mainFrame":$("#upaMainFrame")};
}


// TODO: Construct this pattern.. (Or consider making a parse function instead.)
const selectorPattern =
    "/^((" +
        "\$\w+" +
    ")|("
        "[(div)(a)(p)(#\w+)(\.\w+)]?" + "(\[\w+(=\w+)?\])?" + "([ >][\*])?" +
    "))$/";


export function upaFun_isValidSelector(selector) {
    // if (typeof selector !== "string") {
    //     throw new Exception("isValidSelector(): selector is not a string");
    // }
    return selector.test(selectorPattern);
}

export function upaFun_assertValidSelector(selector) {
    if (!upaFun_isValidSelector(selector)) {
        throw new Exception(
            "assertValidSelector(): input is not a valid selector"
        );
    }
}

function getAbsoluteSelector(selector) {
    // TODO: Change if/when selectors can include commas (unions).
    return "#upaMainFrame " + selector;
}

export function verifySelectorAndGetJQueryObj(selector) {
    upaFun_assertValidSelector(selector);
    if (selector.test("/^\$/")) {
        return JQueryObjCache.cache[substring(selector, 1)];
    } else {
        return $(getAbsoluteSelector(selector));
    }
}


export function upaFun_cacheJQueryObj(selector, key) {
    let jqObj = verifySelectorAndGetJQueryObj(selector);
    if (!key.test("/^\w+$/")) {
        throw new Exception(
            "cacheJQueryObj(): input key is not a valid /^\w+$/ string"
        );
    }
    JQueryObjCache.cache[key] = jqObj;
}
