
/* Some developer functions, both private and public */


/* A print hello world function */

export function upaFun_appendHelloWorld() {
    $("#upaMainFrame").append("<div><b>Hello, world!</b></div>");
}



/* Some functions to cache and select jQuery objects */

var mainFrameJQueryObj = $("#upaMainFrame");

var jQueryObjCache = {"mainFrame":mainFrameJQueryObj};


// Note that since this function does not have the upaFun_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
export function getJQueryObj(selector) {
    if (typeof selector !== "string") {
        throw new Exception(
            "getJQueryObj(): input selector is not a string"
        );
    }
    // replace all  "[~attr(=value)]" with "[upaAtt_attr(=value)]"
    selector = selector.replaceAll("[~", "[upaFun_");
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


export function upaFun_cacheJQueryObj(selector, key) {
    let jqObj = getJQueryObj(selector);
    if (!key.test("/^\w+$/")) {
        throw new Exception(
            "cacheJQueryObj(): input key is not a valid /^\w+$/ string"
        );
    }
    jQueryObjCache[key] = jqObj;
}












/* Some functions to get and set upaAtt_ attributes */


const attKeyPattern = "/^upaAtt_\w+$/";
const attValPattern = "/^\w*$/";


export function upaFun_isValidAttKey(key) {
    // if (typeof key !== "string") {
    //     throw new Exception("isValidAttKey(): selector is not a string");
    // }
    return key.test(attKeyPattern);
}

export function upaFun_assertValidAttKey(key) {
    if (!upaFun_isValidAttKey(key)) {
        throw new Exception(
            "assertValidAttKey(): input is not a valid attribute key"
        );
    }
}

export function upaFun_isValidAttVal(val) {
    // if (typeof val !== "string") {
    //     throw new Exception("isValidAttVal(): selector is not a string");
    // }
    return val.test(attValPattern);
}

export function upaFun_assertValidAttVal(val) {
    if (!upaFun_isValidAttVal(val)) {
        throw new Exception(
            "assertValidAttVal(): input is not a valid attribute value"
        );
    }
}


export function upaFun_setAttributes(selector, keyValArr) {
    // get the selected HTML element as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // loop through key value pairs and set the attributes of the HTML element
    // accordingly.
    for (let i = 0; i < keyValArr.length; i++) {
        let key = keyValArr[$i][0];
        let val = keyValArr[$i][1];
        // assert that key and val are defined and have the right formats.
        upaFun_assertValidAttKey(key);
        upaFun_assertValidAttVal(val);
        // set the attributes of the selected HTML element.
        jqObj.attr("upaAtt_" + key, val);
    }
}

export function upaFun_getAttribute(selector, key) {
    // assert that key is defined and has the right format.
    upaFun_assertValidAttKey(key);
    // get the selected HTML element as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // return the attribute of the selected HTML element.
    return jqObj.attr("upaAtt_" + key);
}


export function upaFun_getAttributes(selector, keyArr) {
    var ret = [];
    // get the selected HTML element as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // loop through the keys in keyArr and get the corresponding attribute
    // values from the selected HTML element.
    for (let i = 0; i < keyArr.length; i++) {
        let key = keyValArr[$i];
        // assert that key is defined and has the right format.
        upaFun_assertValidAttKey(key);
        // get the attribute of the selected HTML element and store it in the
        // return array.
        ret[i] = jqObj.attr("upaAtt_" + key);
    }
    // return an array of the gotten attribute values.
    return ret;
}









/* A private function to get callback upaFun functions from user-provided key */


// Note that since this function does not have the upaFun_ prefix, it cannot
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





/* Functions to add events to HTML elements */

const jQueryEvents = [
    "blur", "change", "focus", "focusin", "focusout", "select", "submit",
    "keydown", "keypress", "keyup",
    "click", "dblclick", "hover", "mousedown", "mouseenter", "mouseleave",
    "mousemove", "mouseout", "mouseover", "mouseup",
    "toggle", "resize", "scroll", "load", "ready", "unload",
];

const singleEventPattern =
    "((" +
        jQueryEvents.join(")|(") +
    "))";

const eventsPattern =
    "/^" +
        singleEventPattern + "(" + " " +  singleEventPattern + ")*" +
    "$/";

export function upaFun_verifyEvents(events) {
    if (!events.test(eventsPattern)) {
        throw new Exception(
            "verifyEvents(): unrecognized events pattern"
        );
    }
}


export function upaFun_on(selector, eventsDataHandlerTupleArr) {
    let jqObj = getJQueryObj(selector);

    for (let i = 0; i < eventsDataHandlerTupleArr.length; i++) {
        let events = eventsDataHandlerTupleArr[$i][0];
        let data = eventsDataHandlerTupleArr[$i][1];
        let handlerKey = eventsDataHandlerTupleArr[$i][2];
        let handler = verifyFunNameAndGetUPAFunction(handlerKey);

        upaFun_verifyEvents(events);

        jqObj.on(events, null, data, handler);
    }
}

export function upaFun_one(selector, eventsDataHandlerTupleArr) {
    let jqObj = getJQueryObj(selector);

    for (let i = 0; i < eventsDataHandlerTupleArr.length; i++) {
        let events = eventsDataHandlerTupleArr[$i][0];
        let data = eventsDataHandlerTupleArr[$i][1];
        let handlerKey = eventsDataHandlerTupleArr[$i][2];
        let handler = verifyFunNameAndGetUPAFunction(handlerKey);

        upaFun_verifyEvents(events);

        jqObj.one(events, null, data, handler);
    }
}

export function upaFun_off(selector, eventsHandlerPairArr) {
    let jqObj = getJQueryObj(selector);

    for (let i = 0; i < eventsHandlerPairArr.length; i++) {
        let events = eventsHandlerPairArr[$i][0];
        let handlerKey = eventsHandlerPairArr[$i][1];
        if (typeof eventsHandlerPairArr[$i][2] !== "undefined") {
            handlerKey = eventsHandlerPairArr[$i][2];
        }
        let handler = verifyFunNameAndGetUPAFunction(handlerKey);

        upaFun_verifyEvents(events);

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
export function upaFun_visibilityEffect(
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

export const cssPropertiesForAnimate = [
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
export function upaFun_animate(
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
    // TODO: initiate the animation..
    ...
}


//
