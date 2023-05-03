/* A main function */

import * as t1Mod from "/UPA_scripts.php?id=t1";
import "/UPA_scripts.php?id=t2"; // request t2 immediately.
import {upaCL} from "/UPA_scripts.php?id=t3";


export function upa_main(preferenceUserID, termID, userID) {
    if (preferenceUserID !== "u1") {
        throw "Unrecognized preference user";
    }

    let $upa1Frame = t1Mod.upaFind('main').html('<div id="upa1"></div>')
        .children('#upa1');
    let contextData = {termID: termID, userID: userID};

    upaCL.loadAppended($upa1Frame, contextData);
}
