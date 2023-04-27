/* A main function */

import * as t1Mod from "/UPA_scripts.php?id=t1";
import * as t3Mod from "/UPA_scripts.php?id=t3";


export function upa_main(preferenceUserID, termID, userID) {
    if (preferenceUserID !== "u1") {
        throw "Unrecognized preference user";
    }

    t1Mod.upaFind('main').append('<div id="upa1"></div>');
    let upa1Frame = t1Mod.upaFind('#upa1');
    let contextData = JSON.stringify({termID: termID, userID: userID});
    upa1Frame.attr("contextData", contextData);

    let termType = termID.substring(0, 1);
    switch (termType) {
        case "c":
            upa1_contentLoaderFunctions["categoryTerm"](upa1Frame, contextData);
            break;
        default:
            throw "main(): term type not implemented";
    }
}
