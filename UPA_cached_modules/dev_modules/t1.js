
/* Some functions for the JS subset to use */

// Note that these function definitions o not follow my JS subset restrictions.

export function upaFun_appendHelloWorld() {
    $("#upaMainFrame").append("<div><b>Hello, World!</b></div>");
}



export function upaFun_isUPAjQueryElement(obj) {
    // This is unafe..:\..
    // return
    //     obj instanceof jQuery &&
    //     obj.is("#upaMainFrame *");
}

export function upaFun_assertUPAjQueryElement(obj) {
    if (
        !(obj instanceof jQuery) ||
        !obj.is("#upaMainFrame *")
    ) {
        throw new Exception(
            "assertUPAjQueryElement(): input is not both a jQuery object " +
            "and a descendent of #upaMainFrame"
        );
    }
}

export function upaFun_setAtts(obj, attObj) {
    upaFun_assertUPAjQueryElement(obj);
    "...";
}
