
/* Some developer functions, both private and public */


/* A print hello world function */

export function upaf_appendHelloWorld() {
    $("#upaMainFrame").append("<div><b>Hello, world!</b></div>");
}



/* Some functions to cache and select jQuery objects */

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

const elementNamePattern =
    "((" +
        elementNames.join(")|(") +
    "))";

const elementNameRegEx = new RegEx(
    "/^(" +
        elementNamePattern +
    ")$/"
);

export const pseudoClasses =
    [ +
        "first", "last", "even", "odd",
        "[(first)(last)(only)]\\-[(child)(of\\-type)]",
        "nth\\-(last\\-)?[(child)(of\\-type)]\\([1-9][0-9]*\\)",
        "eq\\((0|[1-9][0-9]*)\\)",
        "[(gt)(lt)]\\(([1-9][0-9]*)\\)",
        "header", "animated", "focus", "empty", "parent", "hidden",
        "visible", "input", "text", "password", "radio", "checkbox",
        "submit", "reset", "button", "image", "file",
        "enabled", "diabled", "selected", "checked",
        "lang\\(\\w+(\\-\\w+)*\\)",
        // TODO: add more pseudo classes!
    ];

const pseudoClassPattern =
    ":((" +
        pseudoClasses.join(")|(") +
    "))";


export const pseudoElements =
    [ +
        "after", "backdrop", "before", "cue", "cue-region",
        "first-letter", "first-line", //TODO: complete this.
    ];

const pseudoElementPattern =
    "::((" +
        pseudoElements.join(")|(") +
    "))";

const classSelectorPattern = "(\\.\\w+)";

const attrSelectorPattern =
    "(\\[" +
        "\\w+" + "([!\\$\\|\\^~\\*]?=\\w+)?" +
    "\\])";

const combinatorPattern = "[ >~\\+]";

const compoundSelectorPattern =
    "((" +
        "\\*" +
    ")|("
        elementNamePattern + "?" +
            "((" +
            //     classSelectorPattern +
            // ")|(" +
                attrSelectorPattern +
            ")|(" +
                pseudoClassPattern +
            ")|(" +
                pseudoElementPattern +
            "))*" +
    "))";


const complexSelectorPattern =
    compoundSelectorPattern + "(" +
        combinatorPattern + compoundSelectorPattern +
    ")*";

const whitespacePattern = "[ \\n\\r\\t]*";

const selectorListPattern =
    complexSelectorPattern + "(" +
        whitespacePattern + "," + whitespacePattern + complexSelectorPattern +
    ")*";

export const selectorRegex = new RegExp(
    "/^((" +
        "\\$\\w+" +
    ")|(" +
        "#\\w+" +
    ")|(" +
        selectorListPattern +
    "))$/"
);



var jQueryObjCache = {};

var mainFrameJQueryObj = $("#upaMainFrame");

// Note that since this function does not have the upaf_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
export function getJQueryObj(selector) {
    // test selector.
    if (typeof selector !== "string") {
        throw new Exception(
            "getJQueryObj(): selector has to be a string"
        );
    }
    if (!selectorRegex.test(selector)) {
        throw new Exception(
            "getJQueryObj(): selector does not match expected pattern"
        );
    }
    // replace all  "[~attr(=value)]" with "[upaa_attr(=value)]"
    selector = selector.replaceAll("[~", "[upaa_");
    // see if the selector is a special selector with a key for a chaced jQuery
    // object. If so return that object (possibly undefined). Else return
    // mainFrameJQueryObj.find(selector).
    if (/^\$\w+$/.test(selector)) {
        return jQueryObjCache[selector.substring(1)];

    } else if (/^#\w+$/.test(selector)) {
        return mainFrameJQueryObj.find('#upai_' + selector.substring(1));

    } else {
        // TODO: Test/check that jQuery.find() is safe for any string input
        // such that it always returns a descendent element or null/undefined
        // or throws an exception.
        return mainFrameJQueryObj.find(selector);
    }
}

export const noParameterCommands = [
    "parent", "parents", "children", "siblings", "next", "prev",
    "first", "last"
];

export const oneParameterCommands = [
    "eq", "filter", "not", "find"
];

export function getChangedJQueryObj(jqObj, commandArr) {
    // initialize the return jQuery object.
    var ret = jqObj;
    let len = commandArr.length;
    for (let i = 0; i < len; i++) {
        // if commandArr[i] is a string, expect a selector for the find()
        // method.
        if (typeof commandArr[i] === "string") {
            // test that the string is a valid selector.
            if (!selectorRegex.test(commandArr[i])) {
                throw new Exception(
                    "getChangedJQueryObj(): invalid selector in " +
                    "commandArr[" + i.toString() + "]";
                );
            }
            // change ret with a call to find() method.
            ret = ret.find(commandArr[i]);
        // if commandArr[i] has length 1, expect no-parameter command.
        } else if (commandArr[i].length === 1) {
            if (!(commandArr[i][0] in noParameterCommands)) {
                throw new Exception(
                    "getChangedJQueryObj(): " +
                    "invalid no-parameter command in " +
                    "commandArr[" + i.toString() + "]";
                );
            }
            // change ret with a call to a method in noParameterCommands.
            ret = ret.[commandArr[i][0]](); // NO. Remember that I would need to append
            // "Until" to parent and next/prev etc. with this method. Perhaps I will do
            // something else..
        // if commandArr[i] has length 2, expect one-parameter command.
        } else {
            if (!(commandArr[i][0] in oneParameterCommands)) {
                throw new Exception(
                    "getChangedJQueryObj(): " +
                    "invalid command in " +
                    "commandArr[" + i.toString() + "]";
                );
            }
            // if "eq" is chosen, change ret with a call to the eq() method,
            // and make sure that the input is numeric by adding ~~ in front.
            if (commandArr[i][0] === "eq") {
                ret = ret.eq(~~commandArr[i][1]);
                continue;
            }
            // else, test that commandArr[i][1] is a selector.
            if (!selectorRegex.test(commandArr[i][1]) {
                throw new Exception(
                    "getChangedJQueryObj(): invalid selector in " +
                    "commandArr[" + i.toString() + "][1]";
                );
            }
            // change ret with a call to the chosen filter method.
            ret = ret[commandArr[i][0]](commandArr[i][1]);
        }
    }
    // finally return the changed jQuery object.
    return ret;
}


export function upaf_cacheJQueryObj(selector, key) {
    let jqObj = getJQueryObj(selector);
    // test key.
    if (!(/^\w+$/.test(key)) {
        throw new Exception(
            "cacheJQueryObj(): input key is not a valid /^\\w+$/ string"
        );
    }
    // cache jQuery object.
    jQueryObjCache[key] = jqObj;
}

export function upaf_uncacheJQueryObj(key) {
    jQueryObjCache[key] = undefined;
}











/* Some functions to get and set upaa_ attributes */


const attrKeyRegEx =  new RegExp("/^\\w+$/");
const attrValRegEx =  new RegExp("/^\\w*$/");


export function upaf_setAttributes(selector, keyValArr) {
    // get the selected HTML element as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // loop through key value pairs and set the attributes of the HTML element
    // accordingly.
    for (let i = 0; i < keyValArr.length; i++) {
        let key = keyValArr[$i][0];
        let val = keyValArr[$i][1];
        // verify that key and val are defined and have the right formats.
        if (!attrKeyRegEx.test(key)) {
            throw new Exception(
                "setAttributes(): input is not a valid attribute key"
            );
        }
        if (!attrValRegEx.test(val)) {
            throw new Exception(
                "setAttributes(): input is not a valid attribute value"
            );
        }
        // set the attributes of the selected HTML element.
        jqObj.attr("upaa_" + key, val);
    }
}

export function upaf_getAttribute(selector, key) {
    // assert that key is defined and has the right format.
    if (!attrKeyRegEx.test(key)) {
        throw new Exception(
            "getAttribute(): input is not a valid attribute key"
        );
    }
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
        if (!attrKeyRegEx.test(key)) {
            throw new Exception(
                "getAttributes(): input is not a valid attribute key"
            );
        }
        // get the attribute of the selected HTML element and store it in the
        // return array.
        ret[i] = jqObj.attr("upaa_" + key);
    }
    // return an array of the gotten attribute values.
    return ret;
}




/* Functions to set and get (unique!) IDs of HTML elements */

export function upaf_setID(selector, id) {
    let jqObj = getJQueryObj(selector);
    // test that id contains only \w characters.
    if (!/^\w+$/.test(id)) {
        throw new Exception(
            "setID(): invalid id pattern (not of /^\\w+$/)"
        );
    }
    // test that the id does not already exist.
    let resultingID = "upai_" + id;
    if ($('#upaMainFrame #' + resultingID).length > 0) {
        throw new Exception(
            "setID(): id is already given to an element"
        );
    }
    // set the id.
    jqObj[0].id = resultingID;
}

export function upaf_isExistingID(id) {
    let resultingID = "upai_" + id;
    return $('#upaMainFrame #' + resultingID).length > 0;
}

export function upaf_getID(selector) {
    let jqObj = getJQueryObj(selector);
    // if id of the first element in the selection is not set, return false.
    if (typeof jqObj[0].id === "undefined") {
        return false;
    }
    // return the id of the first element in the selection without the "upai_"
    // prefix.
    return jqObj[0].id.substring(5);
}








/* A private function to get callback upaf_ functions from user-provided key */

// Note that since this function does not have the upaf_ prefix, it cannot
// be exported to the final user modules (but only to other developer modules).
export function verifyFunNameAndGetUPAFunction(funName) {
    if (!/^[\$\w]+$/.test(funName)) {
        throw new Exception(
            "getUPAFunction(): function name is not a valid " +
            "/^[\\$\\w]+$/ string"
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

/* A private function to get a resulting function from key and a data array
 * containing the input parameters.
 **/
export function getResultingFunction(funName, dataArr) {
    var fun = verifyFunNameAndGetUPAFunction(funName);
    return function() {
        fun.apply(null, dataArr ?? []);
    };
}

/* A public function run a upaf_ function pointed to by a key */

export function upaf_runResultingFunction(funName, dataArr) {
    var fun = verifyFunNameAndGetUPAFunction(funName);
    fun.apply(null, dataArr);
}








/* Some functions to add and remove HTML elements */

/* << addHTML() >>
 * input = (selector, method, content),
 * where
 * method = "append" | "prepend" | "before" | "after",
 * and where
 * content = undefined | contentText | [(tagAttributesContentTuple,)*],
 * where
 * tagAttributesContentTuple =
 *     [content] | [tagName, content] | [tagName, attributes, content],
 * where
 * attributes = undefined | [([key, value],)*].
 **/
export function upaf_addHTML(selector, method, content) {
    let jqObj = getJQueryObj(selector);
    let html = upaf_getHTML(content);
    switch (method) {
        case "append":
        case "prepend":
        case "before":
        case "after":
            return jqObj[method](html);
            break;
        default:
            throw new Exception(
                "addHTML(): method name not recognized"
            );
    }
}


export function upaf_getHTML(content) {
    // if content is a string, return the converted (HTML safe) string.
    if (typeof content === "string") {
        return upaf_convertHTMLSpecialChars(content);
    }
    // if content is undefined or an empty array, return "".
    var len;
    if (
        typeof content === "undefined" ||
        (len = content.length) == 0
    ) {
        return "";
    }
    // loop through tag--attribute--content tuples and append the resulting
    // html to a return variable, ret.
    var ret = "";
    for (let i = 0; i < len; i++) {
        // get the variables.
        var tag, attributes, content;
        let tupleLen = tagAttributesContentTupleArr[i];
        if (tupleLen === 3) {
            tag = tagAttributesContentTupleArr[i][0];
            attributes = tagAttributesContentTupleArr[i][1];
            content = tagAttributesContentTupleArr[i][2];
        } else if (tupleLen === 2) {
            tag = tagAttributesContentTupleArr[i][0];
            content = tagAttributesContentTupleArr[i][1];
        } else if (tupleLen === 1) {
            content = tagAttributesContentTupleArr[i][0];
        }
        // if tag input is undefined, simply append the converted content to
        // ret.
        if (typeof tag === "undefined") {
            ret = ret + upaf_getHTML(content);
            continue;
        }
        // else, test tag input.
        if (!elementNameRegEx.test(tag)) {
            throw new Exception(
                "getHTML(): unrecognized tag: " + tag.toString()
            );
        }
        // initialize new HTML element.
        var htmlElem = document.createElement(tag);
        // test each attribute input and add the attribute key--value pair to
        // the new HTML element.
        if (typeof attributes !== "undefined") {
            let lenAttr = attributes.length;
            for (let j = 0; j < lenAttr; j++) {
                // get attribute key and value.
                let key = attributes[j][0];
                let val = attributes[j][1];
                // verify that key and val are defined and have the right
                // formats.
                if (!attrKeyRegEx.test(key)) {
                    throw new Exception(
                        "getHTML(): input contains an invalid attribute key"
                    );
                }
                if (!attrValRegEx.test(val)) {
                    throw new Exception(
                        "getHTML(): input contains an invalid attribute value"
                    );
                }
                // set a new upaa_ attribute for the new HTML element.
                htmlElem.setAttribute("upaa_" + key, val);
            }
        }
        // test and convert content, and add it inside the new HTML element.
        htmlElem.innerHTML = upaf_getHTML(content);
        // append the new HTML element to ret.
        ret = ret + htmlElem.outerHTML;
    }
    // return the resulting HTML string.
    return ret;
}


export function upaf_convertHTMLSpecialChars(str) {
    // verify that input is a string.
    if (typeof str !== "string") {
        throw new Exception(
            "convertHTMLSpecialChars(): input is not a string"
        );
    }
    // return the converted (HTML safe) string.
    return str
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}



export function upaf_removeHTML(selector, method, content) {
    let jqObj = getJQueryObj(selector);
    jqObj.remove();
}

export function upaf_emptyHTML(selector, method, content) {
    let jqObj = getJQueryObj(selector);
    jqObj.empty();
}



/* Function to get inner and outer HTML (of the first matched element only) */

export upaf_getInnerHTML(selector) {
    let jqObj = getJQueryObj(selector);
    return jqObj[0].innerHTML;
}

export upaf_getOuterHTML(selector) {
    let jqObj = getJQueryObj(selector);
    return jqObj[0].outerHTML;
}










/* Some functions to get, add and remove CSS styles */

const cssPropRegEx = new RegExp("/^@?[[a-zA-Z]\\-]+$/");


export const cssUnitPatterns = [
    "em", "ex", "cap", "ch", "ic", "lh", "vw", "vh", "vi", "vb", "vmin", "vmax",
    "cq[whib(min)(max)]",
    "cm", "mm", "Q", "in", "pc", "pt", "px",
    "deg", "grad", "rad", "turn",
    "s", "ms", "Hz", "kHz"
    "flex",
    "dpi", "dpcm", "dppx",
    "%"
];

const cssUnitPattern =
    "((" +
        cssUnitPatterns.join(")|(") +
    "))";


export const cssNumericPattern =
    "[\\+\\-]?[0-9]*\\.?[0-9]*" + cssUnitPattern;

export const cssNumericRegEx = new RegExp(
    "/^" +
        cssNumericPattern +
    "$/"
);


export const cssHexColorPattern =
    "#[([0-9a-fA-F]{3,4})([0-9a-fA-F]{6})([0-9a-fA-F]{8})]";

export const cssHexColorRegEx = new RegExp(
    "/^" +
        cssHexColorPattern +
    "$/"
);
// TODO: Consider adding more color value syntaxes.


export const cssNumericOrColorPattern =
    "((" +
        cssHexColorPattern +
    ")|(" +
        cssNumericPattern +
    "))";


export const cssGradientValuePattern =
    "((" +
        "linear-gradient\\(" +
            "[0-9]+deg" + "(" + whitespacePattern +
                "[, \\n]" + whitespacePattern + cssNumericOrColorPattern +
            ")+" +
        "\\)" +
    ")|(" +
        cssNumericPattern +
    "))";


/* Some CSS keyword values that I hope is safe for all CSS properties */
export const cssSomeKeywordValues = [
    "left", "right", "none", "inline-start", "inline-end",
// "inline-table"
// "table-row"
// "table-row-group"
// "table-column"
// "table-column-group"
// "table-cell"
// "table-caption"
// "table-header-group"
// "table-footer-group"
// "inline-flex"
// "inline-grid"
    "repeat-x", "repeat-y", "no-repeat", "repeat",
    "top", "bottom", "fixed",
    "scroll", "center", "justify",
    "dotted", "dashed", "solid", "double", "groove", "ridge", "inset",
    "outset", "none", "hidden",
    "thin", "medium", "thick",
    "border-box",
    "baseline", "text-top", "text-bottom", "sub", "super",
    "overline", "underline", "line-through",
    "uppercase", "lowercase", "capitalize",
    "nowrap", "clip",
    "sans-serif", "serif", "monospace", "cursive", "fantasy",
    "Arial", "Verdana", "Tahoma", "Trebuchet", "Times",
    "Georgia", "Garamond", "Courier", "Brush",
    "normal", "italic", "oblique", "bold", "small-caps",
    "circle", "ellipse", "square",
    "upper-roman", "upper-alpha", "lower-alpha",
    "outside", "inside",
    "collapse",
    "inline", "block", "inline-block",
    "static", "relative", "fixed", "absolute", "sticky",
    "visible", "auto", "both", "table",
    "cover", "contain", "content-box",
    "ellipsis", "break-word", "break-all", "keep-all",
    // "ltr", "rtl",
    "width", "height",
    "ease", "linear", "ease-in", "ease-out", "ease-in-out",
    "transform",
    "fill", "scale-down",
    "not-allowed",
    "horizontal", "vertical",
    "farthest-corner", "closest-side", "closest-corner", "farthest-side",
    "at" // this is not actually a *value* keyword.
    "normal", "reverse", "alternate", "alternate-reverse",
    "forwards", "backwards",
    "infinite", "example",
    // TODO: Consider adding more.
    // TODO: Verify their safety of these keyword values!
];

export const cssSomeKeywordValuesPattern =
    "((" +
        cssSomeKeywordValues.join(")|(") +
    "))";

export


export const cssACombinedValuePattern =
    "((" +
        cssHexColorPattern +
    ")|(" +
        cssNumericPattern +
    ")|(" +
        cssSomeKeywordValuesPattern +
    "))"

export const cssAComplexValuePattern =
    "(" +
        cssACombinedValuePattern + "(" + whitespacePattern +
            "[, \\n]" + whitespacePattern + cssACombinedValuePattern +
        ")*" +
    ")";

export const cssSomeFunctions = [
    "linear-gradient", "radial-gradient", "conic-gradient",
    "translate", "rotate", "scale", "scaleX", "scaleY",
    "skew", "skewX", "skewY", "matrix",
];

export const cssSomeFunctionsPattern =
    "((" +
        cssSomeFunctions.join(")|(") +
    "))";

export const cssAFunctionalValuePattern =
    "(" +
        cssSomeFunctionsPattern + "\\(" + cssAComplexValuePattern + "\\)" +
    ")";

export const cssAComplexRegEx = new RegExp(
    "/^(" +
        "(" + cssAComplexValuePattern + "|" + cssAFunctionalValuePattern + ")+"
    ")$/"
);


/* A function to add CSS styles to a selection of elements */

export function upaf_css(selector, propertyOrPropertyValuePairArr) {
    // get the selected descendents of #upaMainFrame as a jQuery object.
    let jqObj = getJQueryObj(selector);
    if (typeof propertyOrPropertyValuePairArr === "string") {
        let property = propertyOrPropertyValuePairArr;
        if (!/^@?[[a-zA-Z]\-]+$/.test(property)) {
            throw new Exception(
                "css(): properties can only contain letters, '-' and '@'"
            );
        }
        return jqObj.css(property);
    } else {
        let propertyValuePairArr = propertyOrPropertyValuePairArr;
        // verify all values to be (PERHAPS! (TODO: verify this!)) safe.
        let len = propertyValuePairArr.length;
        for (let i = 0; i < len; i++) {
            let property = propertyValuePairArr[i][0];
            let value = propertyValuePairArr[i][1];
            // test property.
            if (!cssPropRegEx.test(property)) {
                throw new Exception(
                    "css(): property" + i.toString() +
                    "can only contain letters, '-' and '@'"
                );
            }
            // test value.
            if (!cssAComplexRegEx.test(value)) {
                throw new Exception(
                    "css(): property value " + i.toString() +
                    " is either invalid or not implemented yet"
                );
            }
            // test that this nested array is a pair.
            if (!propertyValuePairArr[i].length === 2) {
                throw new Exception(
                    "css(): propertyValuePairArr[" + i.toString() + "] " +
                    "did not have a length of 2"
                );
            }
        }
        // convert the property--value array to a plain object
        let stylesObj = Object.fromEntries(styles);
        // set the css properties.
        jqObj.css(stylesObj);
    }
}


/* Function to add and remove CSS style tags to document head */

export function upaf_addCSS(selector, propertyValuePairArr) {
    // test the selector.
    if (!selectorRegex.test(selector)) {
        throw new Exception(
            "addCSS(): selector does not match expected pattern"
        );
    }
    // initialize styleElem as the first part of the desired HTML string.
    var styleElem =
        '<style class="upas" selector="' +
            upaf_convertHTMLSpecialChars(selector) +
        '"> ' +
        "#upaMainFrame { " + selector + " { ";
    // loop through property--value pairs and append them to styleElem.
    let len = propertyValuePairArr.length;
    for (let i = 0; i < len; i++) {
        let property = propertyValuePairArr[i][0];
        let value = propertyValuePairArr[i][1];
        // test property.
        if (!cssPropRegEx.test(property)) {
            throw new Exception(
                "addCSS(): property" + i.toString() +
                "can only contain letters, '-' and '@'"
            );
        }
        // test value.
        if (!cssAComplexRegEx.test(value)) {
            throw new Exception(
                "addCSS(): property value " + i.toString() +
                " is either invalid or not implemented yet"
            );
        }
        // append property and value to styleElem.
        styleElem += property + ": " + value + "; ";
    }
    // append the final part of the style tag.
    styleElem += "}}</style>";
    // append the resulting style element to the document head.
    $(":root > head").append(styleElem);
}


export function upaf_removeCSS(selector) {
    // remove all UPA style tags with the given selector.
    $(
        ':root > head > .upas[' +
            'selector="' + upaf_convertHTMLSpecialChars(selector) +
        '"]'
    ).remove();
}

export function upaf_removeLastCSS(selector) {
    // remove the last UPA style tag with the given selector.
    $(
        ':root > head > .upas[' +
            'selector="' + upaf_convertHTMLSpecialChars(selector) +
        '"]:last-of-type'
    ).remove();
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

const eventsRegEx = new RegExp(
    "/^" +
        singleEventPattern + "(" + " " +  singleEventPattern + ")*" +
    "$/"
);

export function upaf_verifyEvents(events) {
    if (!eventsRegEx.test(events)) {
        throw new Exception(
            "verifyEvents(): unrecognized events pattern"
        );
    }
}


export function upaf_on(selector, eventsDataHandlerTupleArr) {
    let jqObj = getJQueryObj(selector);

    for (let i = 0; i < eventsDataHandlerTupleArr.length; i++) {
        let events = eventsDataHandlerTupleArr[$i][0];
        let data = eventsDataHandlerTupleArr[$i][1] ?? "";
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
        let data = eventsDataHandlerTupleArr[$i][1] ?? "";
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
 * input = (selector, effectTypeString, speed, callbackFunction,
 *     inputDataForCallbackFunction),
 * or
 * input = (selector, effectTypeString, [speed (, opacity)], callbackFunction,
 *     inputDataForCallbackFunction).
 **/
export function upaf_visibilityEffect(
    selector, effectType, settings, callbackKey, callbackDataArr
) {
    // get the selected descendents of #upaMainFrame as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // get the optional callback function pointed to by the optionally provided
    // function key (string).
    var resultingCallback;
    if (typeof callbackKey === "string") {
        resultingCallback = getResultingFunction(callbackKey, callbackDataArr);
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
        !(speed in ["slow", "fast"])
    ) {
        throw new Exception(
            "visibilityEffect(): invalid speed input " +
            "(contained in settings or settings[0])"
        );
    }
    // verify the opacity input if one is provided and the effect type is
    // "fadeTo".
    if (
        effectType === "fadeTo" &&
        !/^[01(0?\.[0-9]+)]$/.test(opacity)
    ) {
        throw new Exception(
            "visibilityEffect(): invalid opacity input " +
            "(contained in settings[1])"
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
                "visibilityEffect(): invalid effect type input"
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

export const cssCCasePropertiesForAnimateRegEx = new RegExp(
    "/^((" +
        cssPropertiesForAnimate.join(")|(") +
    "))$/"
);

/* << jQuery.animate wrapper >>
 * input = [selector, ...]..
 **/
export function upaf_animate(
    selector, styles, settings, callbackKey, callbackDataArr
) {
    // get the selected descendents of #upaMainFrame as a jQuery object.
    let jqObj = getJQueryObj(selector);
    // get the optional callback function pointed to by the optionally provided
    // function key (string).
    var resultingCallback;
    if (typeof callbackKey === "string") {
        resultingCallback = getResultingFunction(callbackKey, callbackDataArr);
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
        !(speed in ["slow", "fast"])
    ) {
        throw new Exception(
            "animate(): invalid speed input " +
            "(contained in settings or settings[0])"
        );
    }
    // verify the easing input if one is provided.
    if (
        typeof easing !== "undefined" &&
        !(easing in ["swing", "linear"])
    ) {
        throw new Exception(
            "animate(): invalid easing input " +
            "(contained in settings[1])" +
            "(options are 'swing' or 'linear' or undefined)"
        );
    }
    // verify the styles array.
    let len = styles.length;
    for (let i = 0; i < len; i++) {
        if (!cssCCasePropertiesForAnimateRegEx.test(styles[0])) {
            throw new Exception(
                "animate(): invalid property for animation " +
                "(contained in styles[" + i.toString() + "][0])"
            );
        }
        if (!cssNumericRegEx.test(styles[1])) {
            throw new Exception(
                "animate(): invalid property value for animation " +
                "(contained in styles[" + i.toString() + "][1]), " +
                "expects a numeric value"
            );
        }
    }
    // convert the styles array to a plain object
    let stylesObj = Object.fromEntries(styles);
    // initiate the animation.
    jqObj.animate(stylesObj, speed, easing, resultingCallback);
}




// TODO: Make an each() wrapper, possibly using the "upai_" IDs.
