/* A main function */

import * as t1Mod from "/UPA_scripts.php?id=t1";
import * as t3Mod from "/UPA_scripts.php?id=t3";


export function upa_main(preferenceUserID, termID, userID) {
    if (preferenceUserID !== "u1") {
        throw "Unrecognized preference user";
    }

    t1Mod.upaFind('main').append('<div id="upa1_0"></div>');
    let upa1Frame = t1Mod.upaFind('#upa1_0');
    let contextData = JSON.stringify({termID: termID, userID: userID});
    upa1Frame.attr("contextData", contextData);

    upa1Frame.attr("content-key", "categoryTerm");

    let termType = termID.substring(0, 1);
    switch (termType) {
        case "c":
            $(function() {
                upa1_loadContent(upa1Frame);
            });
            break;
        default:
            throw "main(): term type not implemented";
    }
}
