upaf_
/* Some developer functions, both private and public */


/* A print hello world function */

export function upaf_appendHelloWorld() {
    $("#upaMainFrame").append("<div><b>Hello, world!</b></div>");
}



/* Some functions to cache and select jQuery objects */

var mainFrameJQueryObj = $("#upaMainFrame");

var jQueryObjCache = {"mainFrame":mainFrameJQueryObj};


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

const typeSelectorRegEx =
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

const pseudoClassRegEx =
    ":((" +
        pseudoClasses.join(")|(") +
    "))";


export const pseudoElements =
    [ +
        "after", "backdrop", "before", "cue", "cue-region",
        "first-letter", "first-line", //TODO: complete this.
    ];

const pseudoElementRegEx =
    "::((" +
        pseudoElements.join(")|(") +
    "))";

const classSelectorRegEx = "(\.\w+)";

const attrSelectorRegEx = "(\[" + "\w+" + "([!\$\|\^~\*]?=\w+)?" + "\])";

const combinatorRegEx = "[ >~\+]";

const compoundSelectorRegEx =
    "((" +
        "\*" +
    ")|("
        typeSelectorRegEx + "?" +
            "((" +
            //     classSelectorRegEx +
            // ")|(" +
                attrSelectorRegEx +
            ")|(" +
                pseudoClassRegEx +
            ")|(" +
                pseudoElementRegEx +
            "))*" +
    "))";


const complexSelectorRegEx =
    compoundSelectorRegEx + "(" +
        combinatorRegEx + compoundSelectorRegEx +
    ")*";

const whitespaceRegEx = "[ \n\r\t]*";

const selectorListRegEx =
    complexSelectorRegEx + "(" +
        whitespaceRegEx + "," + whitespaceRegEx + complexSelectorRegEx +
    ")*";

export const selectorPattern =
    "/^((" +
        "\$\w+" +
    ")|(" +
        selectorListRegEx +
    "))$/";




// Note that since this function does not have the upaf_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
export function getJQueryObj(selector) {
    if (typeof selector !== "string") {
        throw new Exception(
            "getJQueryObj(): selector is not a string"
        );
    }
    if (!selector.test(selectorPattern)) {
        throw new Exception(
            "getJQueryObj(): selector does not match expected pattern"
        );
    }
    // replace all  "[~attr(=value)]" with "[upaa_attr(=value)]"
    selector = selector.replaceAll("[~", "[upaf_");
    // see if the selector is a special selector with a key for a chaced jQuery
    // object. If so return that object (possibly undefined). Else return
    // mainFrameJQueryObj.find(selector).
    if (selector.test("/^\$\w+$/")) {
        return jQueryObjCache[substring(selector, 1)];
    } else {
        // TODO: Test/check that jQuery.find() is safe for any string input
        // such that it always returns a descendent element or null/undefined
        // or throws an exception.
        return mainFrameJQueryObj.find(selector);
    }
}


export function upaf_cacheJQueryObj(selector, key) {
    let jqObj = getJQueryObj(selector);
    if (!key.test("/^\w+$/")) {
        throw new Exception(
            "cacheJQueryObj(): input key is not a valid /^\w+$/ string"
        );
    }
    jQueryObjCache[key] = jqObj;
}












/* Some functions to get and set upaa_ attributes */


const attKeyPattern = "/^upaa_\w+$/";
const attValPattern = "/^\w*$/";


export function upaf_isValidAttKey(key) {
    // if (typeof key !== "string") {
    //     throw new Exception("isValidAttKey(): selector is not a string");
    // }
    return key.test(attKeyPattern);
}

export function upaf_assertValidAttKey(key) {
    if (!upaf_isValidAttKey(key)) {
        throw new Exception(
            "assertValidAttKey(): input is not a valid attribute key"
        );
    }
}

export function upaf_isValidAttVal(val) {
    // if (typeof val !== "string") {
    //     throw new Exception("isValidAttVal(): selector is not a string");
    // }
    return val.test(attValPattern);
}

export function upaf_assertValidAttVal(val) {
    if (!upaf_isValidAttVal(val)) {
        throw new Exception(
            "assertValidAttVal(): input is not a valid attribute value"
        );
    }
}


export function upaf_setAttributes(selector, keyValArr) {
    // get the selected HTML element as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // loop through key value pairs and set the attributes of the HTML element
    // accordingly.
    for (let i = 0; i < keyValArr.length; i++) {
        let key = keyValArr[$i][0];
        let val = keyValArr[$i][1];
        // assert that key and val are defined and have the right formats.
        upaf_assertValidAttKey(key);
        upaf_assertValidAttVal(val);
        // set the attributes of the selected HTML element.
        jqObj.attr("upaa_" + key, val);
    }
}

export function upaf_getAttribute(selector, key) {
    // assert that key is defined and has the right format.
    upaf_assertValidAttKey(key);
    // get the selected HTML element as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // return the attribute of the selected HTML element.
    return jqObj.attr("upaa_" + key);
}


export function upaf_getAttributes(selector, keyArr) {
    var ret = [];
    // get the selected HTML element as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // loop through the keys in keyArr and get the corresponding attribute
    // values from the selected HTML element.
    for (let i = 0; i < keyArr.length; i++) {
        let key = keyValArr[$i];
        // assert that key is defined and has the right format.
        upaf_assertValidAttKey(key);
        // get the attribute of the selected HTML element and store it in the
        // return array.
        ret[i] = jqObj.attr("upaa_" + key);
    }
    // return an array of the gotten attribute values.
    return ret;
}









/* A private function to get callback upaFun functions from user-provided key */


// Note that since this function does not have the upaf_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
export function verifyFunNameAndGetUPAFunction(funName) {
    if (!funName.test("/^[\$\w]+$/")) {
        throw new Exception(
            "getUPAFunction(): function name is not a valid /^[\$\w]+$/ string"
        );
    }
    let fullFunName = "upaFun_" + funName;
    if (typeof window[fullFunName] != "function") {
        throw new Exception(
            "verifyAndGetUPAFunction(): function " + fullFunName +
                " is not defined yet"
        );
    }
    return window[fullFunName];
}




/* Some functions to add and remove HTML elements */

//TODO: Make an add and remove function for all element types, where the add
// function can also set some attributes





/* Some functions to add and remove CSS styles */

export const cssUnitRegExs = [
    "em", "ex", "cap", "ch", "ic", "lh", "vw", "vh", "vi", "vb", "vmin", "vmax",
    "cq[whib(min)(max)]",
    "cm", "mm", "Q", "in", "pc", "pt", "px",
    "deg", "grad", "rad", "turn",
    "s", "ms", "Hz", "kHz"
    "flex",
    "dpi", "dpcm", "dppx",
    "%"
];

const cssUnitRegEx =
    "((" +
        cssUnitRegExs.join(")|(") +
    "))";


export const cssNumericRegEx =
    "[\+\-]?[0-9]*\.?[0-9]*" + cssUnitRegEx;

export const cssNumericPattern =
    "/^" +
        cssNumericRegEx +
    "$/";


export const cssHexColorRegEx =
    "#[([0-9a-fA-F]{3,4})([0-9a-fA-F]{6})([0-9a-fA-F]{8})]";

export const cssHexColorPattern =
    "/^" +
        cssHexColorRegEx +
    "$/";
    // TODO: Consider adding more color value syntaxes.


export const cssNumericOrColorPattern =
    "/^((" +
        cssHexColorRegEx +
    ")|(" +
        cssNumericRegEx +
    "))$/";



/* Some CSS keyword values that I hope is safe for all CSS properties */
export const someCSSKeywordValues = [
    "left", "right", "none", "inline-start", "inline-end",
    "repeat-x", "repeat-y", "no-repeat", "top", "bottom", "fixed",
    "scroll", "center", "justify",
    "dotted", "dashed", "solid", "double", "groove", "ridge", "inset",
    "outset", "none", "hidden",
    "thin", "medium", "thick",
    "border-box",
    "baseline", "text-top", "text-bottom", "sub", "super",
    "overline", "underline", "line-through",
    "uppercase", "lowercase", "capitalize",
    "nowrap",
    "sans-serif", "serif", "monospace", "cursive", "fantasy",
    "Arial", "Verdana", "Tahoma", "Trebuchet", "Times",
    "Georgia", "Garamond", "Courier", "Brush",
    "normal", "italic", "oblique", "bold", "small-caps",
    "circle", "square", "upper-roman", "upper-alpha", "lower-alpha",
    "outside", "inside",

    // TODO: Add more.
    // TODO: Verify their safety (or do something different).
];







/* Functions to add events to HTML elements */

const jQueryEvents = [
    "blur", "change", "focus", "focusin", "focusout", "select", "submit",
    "keydown", "keypress", "keyup",
    "click", "dblclick", "hover", "mousedown", "mouseenter", "mouseleave",
    "mousemove", "mouseout", "mouseover", "mouseup",
    "toggle", "resize", "scroll", "load", "ready", "unload",
];

const singleEventRegEx =
    "((" +
        jQueryEvents.join(")|(") +
    "))";

const eventsPattern =
    "/^" +
        singleEventRegEx + "(" + " " +  singleEventRegEx + ")*" +
    "$/";

export function upaf_verifyEvents(events) {
    if (!events.test(eventsPattern)) {
        throw new Exception(
            "verifyEvents(): unrecognized events pattern"
        );
    }
}


export function upaf_on(selector, eventsDataHandlerTupleArr) {
    let jqObj = getJQueryObj(selector);

    for (let i = 0; i < eventsDataHandlerTupleArr.length; i++) {
        let events = eventsDataHandlerTupleArr[$i][0];
        let data = eventsDataHandlerTupleArr[$i][1];
        let handlerKey = eventsDataHandlerTupleArr[$i][2];
        let handler = verifyFunNameAndGetUPAFunction(handlerKey);

        upaf_verifyEvents(events);

        jqObj.on(events, null, data, handler);
    }
}

export function upaf_one(selector, eventsDataHandlerTupleArr) {
    let jqObj = getJQueryObj(selector);

    for (let i = 0; i < eventsDataHandlerTupleArr.length; i++) {
        let events = eventsDataHandlerTupleArr[$i][0];
        let data = eventsDataHandlerTupleArr[$i][1];
        let handlerKey = eventsDataHandlerTupleArr[$i][2];
        let handler = verifyFunNameAndGetUPAFunction(handlerKey);

        upaf_verifyEvents(events);

        jqObj.one(events, null, data, handler);
    }
}

export function upaf_off(selector, eventsHandlerPairArr) {
    let jqObj = getJQueryObj(selector);

    for (let i = 0; i < eventsHandlerPairArr.length; i++) {
        let events = eventsHandlerPairArr[$i][0];
        let handlerKey = eventsHandlerPairArr[$i][1];
        if (typeof eventsHandlerPairArr[$i][2] !== "undefined") {
            handlerKey = eventsHandlerPairArr[$i][2];
        }
        let handler = verifyFunNameAndGetUPAFunction(handlerKey);

        upaf_verifyEvents(events);

        jqObj.off(events, null, handler);
    }
}

// TODO: Consider adding a jQuery.trigger() wrapper also.






/* Some functions that add jQuery effects to HTML elements */


/* << jQuery show/hide/fade/slide wrapper >>
 * input = [selector, effectTypeString, speed, callbackFunction,
 *     inputDataForCallbackFunction],
 * or
 * input = [selector, effectTypeString, [speed (, opacity)], callbackFunction,
 *     inputDataForCallbackFunction].
 **/
export function upaf_visibilityEffect(
    selectorEffectTypeSettingsCallbackDataTuple
) {
    // get variables from input array.
    let selector = typeSpeedCallbackDataTuple[0];
    let effectType = typeSpeedCallbackDataTuple[1];
    let settings = typeSpeedCallbackDataTuple[2];
    let callbackKey = typeSpeedCallbackDataTuple[3];
    let data = typeSpeedCallbackDataTuple[4];
    // get the selected descendents of #upaMainFrame as a jQuery object .
    let jqObj = getJQueryObj(selector);
    let resultingCallback = function() {
        callback(data);
    };
    // get the optional callback function pointed to by the optionally provided
    // function key (string).
    var resultingCallback;
    if (typeof callbackKey === "string") {
        callback = verifyFunNameAndGetUPAFunction(callbackKey);
        resultingCallback = function() {
            callback(data);
        };
    }
    // verify the speed and opacity inputs if some are provided.
    var speed, opacity;
    // get these variables from input array.
    if (typeof settings === "object") {
        speed = settings[0];
        opacity = settings[1];
    } else {
        speed = settings;
    }
    // verify the speed input if one is provided.
    if (
        !(typeof speed === "undefined") &&
        !(speed == ~~speed) &&
        !speed.test("/^[(slow)(fast)]$/")
    ) {
        throw new Exception(
            "visibilityEffect(): invalid speed input " +
            "(contained in input[2] or input[2][0])"
        );
    }
    // verify the opacity input if one is provided and the effect type is
    // "fadeTo".
    if (
        effectType === "fadeTo" &&
        !opacity.toString().test("/^[01(0?\.[0-9]+)]$/")
    ) {
        throw new Exception(
            "visibilityEffect(): invalid opacity input " +
            "(contained in input[2][2])"
        );
    }
    // match the provided effect type an initiate the effect.
    switch (effectType) {
        case "show":
        case "hide":
        case "toggle":
        case "fadeIn":
        case "fadeOut":
        case "fadeToggle":
        case "slideDown":
        case "slideUp":
        case "slideToggle":
            jqObj[effectType](speed, resultingCallback);
            break;
        case "fadeTo":
            jqObj[effectType](speed, opacity, resultingCallback);
            break;
        default:
            throw new Exception(
                "visibilityEffect(): invalid effect type input " +
                "(contained in input[1])"
            );
    }
}


/* jQuery.animate wrapper */

export const cssCCasePropertiesForAnimate = [
    "backgroundPositionX", "backgroundPositionY", "borderWidth",
    "borderBottomWidth", "borderLeftWidth", "borderRightWidth",
    "borderTopWidth", "borderSpacing", "margin", "marginBottom",
    "marginLeft", "marginRight", "marginTop", "opacity", "outlineWidth",
    "padding", "paddingBottom", "paddingLeft", "paddingRight",
    "paddingTop", "height", "width", "maxHeight", "maxWidth",
    "minHeight", "minWidth", "fontSize", "bottom", "left", "right", "top",
    "letterSpacing", "wordSpacing", "lineHeight", "textIndent"
];

export const cssPropertiesForAnimatePattern =
    "/^((" +
        cssPropertiesForAnimate.join(")|(") +
    "))$/";

/* << jQuery.animate wrapper >>
 * input = [selector, ...]..
 **/
export function upaf_animate(
    selectorStylesSettingsCallbackDataTuple
) {
    // get variables from input array.
    let selector = typeSpeedCallbackDataTuple[0];
    let styles = typeSpeedCallbackDataTuple[1];
    let settings = typeSpeedCallbackDataTuple[2];
    let callbackKey = typeSpeedCallbackDataTuple[3];
    let data = typeSpeedCallbackDataTuple[4];
    // get the selected descendents of #upaMainFrame as a jQuery object .
    let jqObj = getJQueryObj(selector);
    let resultingCallback = function() {
        callback(data);
    };
    // get the optional callback function pointed to by the optionally provided
    // function key (string).
    var resultingCallback; // = function(){};
    if (typeof callbackKey === "string") {
        callback = verifyFunNameAndGetUPAFunction(callbackKey);
        resultingCallback = function() {
            callback(data);
        };
    }
    // verify the speed and easing inputs if some are provided.
    var speed, easing;
    // get these variables from input array.
    if (typeof settings === "object") {
        speed = settings[0];
        easing = settings[1];
    } else {
        speed = settings;
    }
    // verify the speed input if one is provided.
    if (
        !(typeof speed === "undefined") &&
        !(speed == ~~speed) &&
        !speed.test("/^[(slow)(fast)]$/")
    ) {
        throw new Exception(
            "animate(): invalid speed input " +
            "(contained in input[2] or input[2][0])"
        );
    }
    // verify the easing input if one is provided.
    if (
        typeof easing !== "undefined" &&
        !easing.test("/^[(swing)(linear)]$/")
    ) {
        throw new Exception(
            "animate(): invalid easing input " +
            "(contained in input[2][1])" +
            "(options are 'swing' or 'linear' or undefined)"
        );
    }
    // verify the styles array.
    let len = styles.length;
    for (let i = 0; i < len; i++) {
        if (!styles[0].test(cssCCasePropertiesForAnimate)) {
            throw new Exception(
                "animate(): invalid property for animation " +
                "(contained in input[1][" + i.toString() + "][0])"
            );
        }
        if (!styles[1].test(cssNumericPattern)) {
            throw new Exception(
                "animate(): invalid property value for animation " +
                "(contained in input[1][" + i.toString() + "][1]), " +
                "expects a numeric value"
            );
        }
    }
    // convert the styles array to a plain object
    let stylesObj = Object.fromEntries(styles);
    // initiate the animation.
    jqObj.animate(stylesObj, speed, easing, resultingCallback);
}
