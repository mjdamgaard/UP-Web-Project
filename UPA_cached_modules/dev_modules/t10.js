/* A main function */

import * as t1Mod from "/UPA_scripts.php?id=1";
import "/UPA_scripts.php?id=2"; // request t2 immediately.
import {sdbInterfaceCL} from "/UPA_scripts.php?id=3";


export function upa_main(preferenceUserID, termType, termID, userID) {
    if (preferenceUserID !== "1") {
        throw "Unrecognized preference user";
    }

    let contextData = {
        columnContentKey: "TestPages",
        defaultTab: "Subcategories",
        preferenceUser: preferenceUserID,
        termType: termType,
        termID: termID,
        user: userID,
    };
    let contentKey = sdbInterfaceCL.contentKey;
    sdbInterfaceCL.loadAppended($('body'), contentKey, contextData);
}
