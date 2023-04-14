
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
    // return the id of the first element in the selection.
    return jqObj[0].id;
}




/* Functions to set and get the types of input HTML elements */

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



// TODO: Add some more functions to set HTML attributes, such that 'list' for
// <input>'s and 'id' for <datalist>'s. *Never mind about ids, I will make a
// function to set these now..
