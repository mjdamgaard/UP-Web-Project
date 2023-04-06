
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

// TODO: Add a toggleAttributes function.







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


export function upaFun_onEvents(selector, eventsDataHandlerTupleArr) {
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

export function upaFun_oneEvents(selector, eventsDataHandlerTupleArr) {
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

export function upaFun_offEvents(selector, eventsHandlerPairArr) {
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

export function upaFun_hide(selector) {
    getJQueryObj(selector).hide();
}
export function upaFun_show(selector) {
    getJQueryObj(selector).show();
}
export function upaFun_toggle(selector) {
    getJQueryObj(selector).toggle();
}

export function upaFun_fade(typeSpeedCallbackDataTuple) {
    let type = typeSpeedCallbackDataTuple[0];
    let speed = typeSpeedCallbackDataTuple[1];
    let callbackKey = typeSpeedCallbackDataTuple[2];
    let callback = verifyFunNameAndGetUPAFunction(callbackKey);
    let data = typeSpeedCallbackDataTuple[3];

    let jqObj = getJQueryObj(selector);
    let resultingCallback = function() {
        callback(data);
    };

    if (!(speed == ~~speed) && !speed.test("/^[(slow)(fast)]$/")) {
        throw new Exception(
            "fade(): invalid speed (2nd) input"
        );
    }

    switch (type) {
        case "in":
            jqObj.fadeIn(speed, resultingCallback);
            break;
        case "out":
            jqObj.fadeOut(speed, resultingCallback);
            break;
        case "toggle":
            jqObj.fadeToggle(speed, resultingCallback);
            break;
        default:
            throw new Exception(
                "fade(): invalid fade type (3rd) input " +
                "(options are 'in', 'out', or 'toggle')"
            );
    }
}

export function upaFun_fadeTo(speedOpacityCallbackDataTuple) {
    let speed = typeSpeedOpacityCallbackDataTuple[0];
    let opacity = typeSpeedOpacityCallbackDataTuple[1];
    let callbackKey = typeSpeedOpacityCallbackDataTuple[2];
    let callback = verifyFunNameAndGetUPAFunction(callbackKey);
    let data = typeSpeedOpacityCallbackDataTuple[3];

    let jqObj = getJQueryObj(selector);
    let resultingCallback = function() {
        callback(data);
    };

    if (!(speed == ~~speed) && !speed.test("/^[(slow)(fast)]$/")) {
        throw new Exception(
            "fadeTo(): invalid speed (1st) input"
        );
    }

    jqObj.fadeTo(speed, opacity, resultingCallback);
}

export function upaFun_slide(typeSpeedCallbackDataTuple) {
    let type = typeSpeedCallbackDataTuple[0];
    let speed = typeSpeedCallbackDataTuple[1];
    let callbackKey = typeSpeedCallbackDataTuple[2];
    let callback = verifyFunNameAndGetUPAFunction(callbackKey);
    let data = typeSpeedCallbackDataTuple[3];

    let jqObj = getJQueryObj(selector);
    let resultingCallback = function() {
        callback(data);
    };

    if (!(speed == ~~speed) && !speed.test("/^[(slow)(fast)]$/")) {
        throw new Exception(
            "fadeTo(): invalid speed (2nd) input"
        );
    }

    switch (type) {
        case "down":
            jqObj.slideDown(speed, resultingCallback);
            break;
        case "up":
            jqObj.slideUp(speed, resultingCallback);
            break;
        case "toggle":
            jqObj.slideToggle(speed, resultingCallback);
            break;
        default:
            throw new Exception(
                "slide(): invalid slide type (3rd) input " +
                "(options are 'down', 'up', or 'toggle')"
            );
    }
}


// TODO: Add jQuery.animate() wrapper.



//
