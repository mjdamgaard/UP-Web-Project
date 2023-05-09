/* A main function */

import * as t1Mod from "/UPA_scripts.php?id=1";
import "/UPA_scripts.php?id=2"; // request t2 immediately.
import {sdbInterfaceCL} from "/UPA_scripts.php?id=3";


export function upa_main(preferenceUserID, termID, userID) {
    if (preferenceUserID !== "1") {
        throw "Unrecognized preference user";
    }

    let $upa1Frame = t1Mod.upaFind('main').html('<div id="upa1"></div>')
        .children('#upa1');
    let contextData = {
        columnContentKey: "TestPages",
        termID: termID,
        userID: userID
    };

    let contentKey = sdbInterfaceCL.contentKey;
    sdbInterfaceCL.loadAppended($upa1Frame, contentKey, contextData);
}
