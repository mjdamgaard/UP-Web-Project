/* A main function */

import * as t3Mod from "/UPA_scripts.php?id=t3";



export function upa_main(preferenceUserID, termID, userID) {

    t3Mod.upa_getJQueryObj('main').append('<div></div>');
    let initialDiv = t3Mod.upa_getJQueryObj('main > div:last-of-type');

    let termType = termID.substring(0, 1);
    switch (termType) {
        case "c":
            upa_insertCategoryHTML(initialDiv);
            break;
        default:
            throw "main(): term type not implemented";
    }
}

function upa_insertCategoryHTML(jqObj) {


    jqObj.html("<b>Hellos</b>");
}
