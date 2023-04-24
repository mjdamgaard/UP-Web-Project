/* A main function */

import {
    upa_upload, upa_queryAndSanitize, upa_getJQueryObj
} from "/UPA_scripts.php?id=t3";



export function upa_main(preferenceUserID, termID, userID) {

    upa_getJQueryObj('main').append('<div></div>');

    let termType = termID.substring(0, 1);
    switch (termType) {
        case "c":
            upa_getJQueryObj('main > div:last-of-type').append(
                upa_getCategoryHTML(termID)
            );
            break;
        default:
            throw "main(): term type not implemented";
    }
}

function upa_getCategoryHTML(catID) {


    return "<b>Hellos</b>";
}
