
import {
    getJQueryObj
} from "/UPA_scripts.php?id=t1";


/* functions to set and get (unique!) IDs of HTML elements */

export function upaf_setIDAndGetExitCode(selector, id) {
    let jqObj = getJQueryObj(selector);
    // test that id contains only \w characters.
    if (!/^\w+$/.test(id)) {
        throw new Exception(
            "setID(): invalid id pattern (not of /^\\w+$/)"
        );
    }
    // test that the id does not already exist, and return 1 if it does.
    let resultingID = "upai_" + id;
    if ($('#' + resultingID).length > 0) {
        return 1; // EXIT FAILURE.
    }
    // set the id and return 0 for EXIT SUCCESS
    jqObj[0].id = resultingID;
    return 0; // EXIT SUCCESS.
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




/* Functions to set and get the types of <input> HTML elements */

export const legalInputTypes [
    "button", "checkbox", "color", "date", "file", "hidden", "image",
    "month", "number", "radio", "range", "reset", "search", "submit",
    "tel", "text", "time", "url", "week",
];

export function upaf_setInputType(selector, type) {
    let jqObj = getJQueryObj(selector);
    // test type
    if (!(type in legalInputTypes)) {
        throw new Exception(
            "setInputType(): invalid or illegal type"
        );
    }
    // set the input types of all selected <input> elements.
    jqObj.filter('input').attr("type", type);
}

export function upaf_getInputType(selector) {
    let jqObj = getJQueryObj(selector);
    // return the input type of the first <input> element in the selection.
    return jqObj.filter('input').attr("type");
}

// TODO: Add some more functions to set input attributes, such as 'pattern',
// 'placeholder' and 'list'..






/* Functions to set form actions (to javascript functions) */

// Note that upaf_setFormAction(<selector>, "void") is useful to call even
// when submission is set to be almost entirely handled by a jQuery event
// instead.
export function upaf_setFormAction(selector, funName) {
    let jqObj = getJQueryObj(selector);
    // test funName.
    if (!/^[\$\w]+$/.test(funName)) {
        throw new Exception(
            "setFormAction(): function name is not a valid " +
            "/^[\\$\\w]+$/ string"
        );
    }
    // if "void" is given as the "funName," set the action attributes for all
    // selected <form> elements to "javascript:void(0)".
    if (funName === "void") {
        jqObj.filter('form').attr("action", "javascript:void(0)");
    // else set the action attributes to "javascript:upaf_<funName>(<id>),"
    // where id is either the id of the <form> element, or is "" if the
    // element does not have any id set.
    } else {
        let actionStart = "javascript:upaf_" + funName + "(";
        jqObj.filter('form').each(function(){
            var id = "";
            if (typeof this[0].id === "string") {
                id = this[0].id.substring(5); // i.e. without the upai_ prefix.
            }
            this.attr("action", actionStart + id + ")");
        });
    }
}




// TODO: Potentially add some more functions to set HTML attributes..
