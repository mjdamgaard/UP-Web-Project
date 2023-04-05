
/* Some functions for the JS subset to use */

// Note that these function definitions o not follow my JS subset restrictions.

export function upaFun_appendHelloWorld() {
    $("#upaMainFrame").append("<div><b>Hello, World!</b></div>");
}



class JQueryObjCache {
    public static cache = {"mainFrame":$("#upaMainFrame")};
}


// TODO: Construct this pattern.. (Or consider making a parse function instead.)
const selectorPatt =
    "/^((" +
        "\$\w+" +
    ")|("
        "[(div)(a)(p)(#\w+)(\.\w+)]?" + "(\[\w+(=\w+)?\])?" + "([ >][\*])" +
    "))$/"

export function upaFun_isValidSelector(selector) {
    if (typeof selector !== "string") {
        throw new Exception("isValidSelector(): selector is not a string");
    }
    return selector.test(selectorPatt);
}


export function upaFun_assertValidSelector(selector) {
    if (!upaFun_isValidSelector(selector)) {
        throw new Exception(
            "assertValidSelector(): input is not a valid selector"
        );
    }
}


export function upaFun_isValidAttKey(selector) {

}

export function upaFun_assertValidAttKey(selector) {

}

export function upaFun_isValidAttVal(selector) {

}

export function upaFun_assertValidAttVal(selector) {

}



export function upaFun_setAttributes(selector, keyValArr) {
    upaFun_assertValidSelector(selector);
    var jqObj;
    if (selector.test("/^\$/")) {
        jqObj = JQueryObjCache.cache[substring(selector, 1)];
    } else {
        jqObj = $(selector);
    }

    if (typeof keyValArr !== "array") {
        throw new Exception(
            "setAttributes(): second input is not an array"
        );
    }
    for (let $i = 0; $i < keyValArr.length; $i++)) {
        let key = keyValArr[$i][0];
        let val = keyValArr[$i][1];
        upaFun_assertValidAttKey(key);
        upaFun_assertValidAttVal(val);

        jqObj.attr("upaAtt_" + key, val);
    }
}
