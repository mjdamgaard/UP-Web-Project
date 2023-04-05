
/* Some functions to get and set upaAtt_ attributes */

import {
    verifySelectorAndGetJQueryObj
} from "/UPA_modules.php?id=t1";



const attKeyPattern = "/^upaAtt_\w+$/";
const attKeyPattern = "/^\w*$/";


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
    let jqObj = verifySelectorAndGetJQueryObj(selector);
    // loop through key value pairs and set the attributes of the HTML element
    // accordingly.
    for (let i = 0; i < keyValArr.length; i++)) {
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
    let jqObj = verifySelectorAndGetJQueryObj(selector);
    // return the attribute of the selected HTML element.
    return jqObj.attr("upaAtt_" + key);
}


export function upaFun_getAttributes(selector, keyArr) {
    var ret = [];
    // get the selected HTML element as a jQuery object.
    let jqObj = verifySelectorAndGetJQueryObj(selector);
    // loop through the keys in keyArr and get the corresponding attribute
    // values from the selected HTML element.
    for (let i = 0; i < keyArr.length; i++)) {
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
