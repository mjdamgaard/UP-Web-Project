
/* Some functions to cache and select jQuery objects */



class JQueryObjCache {
    // public static cache = {"mainFrame":$("#upaMainFrame")};
    public static cache = {};
}


export const elementNames =
    [ +
        "address", "article", "aside", "footer", "header", "h[1-6]",
        "hgroup", "main", "nav", "section", "blockquote", "dd",
        "div", "dl", "dt", "figcaption", "figure", "hr",
        "li", "menu", "ol", "p", "pre", "ul",
        "a", "abbr", "b", "bdi", "bdo", // "br" not included
        "cite", "code", "data", "dfn", "em", "i",
        // TODO: complete this.
        "aaa", "aaa", "aaa", "aaa", "aaa", "aaa",
        "aaa", "aaa", "aaa", "aaa", "aaa", "aaa",
        "aaa", "aaa", "aaa", "aaa", "aaa", "aaa",
    ];

export const typeSelectorPattern =
    "((" +
        elementNames.join(")|(") +
    "))";

export const pseudoClasses =
    [ +
        "first", "last", "even", "odd",
        "[(first)(last)(only)]\-[(child)(of\-type)]",
        "nth\-(last\-)?[(child)(of\-type)]\([1-9][0-9]*\)",
        "eq\((0|[1-9][0-9]*)\)",
        "[(gt)(lt)]\(([1-9][0-9]*)\)",
        "header", "animated", "focus", "empty", "parent", "hidden",
        "visible", "input", "text", "password", "radio", "checkbox",
        "submit", "reset", "button", "image", "file",
        "enabled", "diabled", "selected", "checked",
        "lang\(\w+(\-\w+)*\)",
    ];

export const pseudoClassPattern =
    "((" +
        pseudoClasses.join(")|(") +
    "))";

const attSelectorPattern = "(\[" + "\w+" + "([!\$\|\^~\*]?=\w+)?" + "\])";

const combinatorPattern = "[ >~\+(\|\|)]";

const selectorPattern1 =
    "((" +
        "\*" +
    ")|("
        typeSelectorPattern + "?" + attSelectorPattern + "*" +
    "))";

const selectorPattern2 = selectorPattern1 ...

export const selectorPattern =
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

// Note that since this function does not have the upaFun_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
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
