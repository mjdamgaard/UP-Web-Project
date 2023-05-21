/* A main function */

import * as t1Mod from "/UPA_scripts.php?id=1";
import "/UPA_scripts.php?id=2"; // request t2 immediately.
import {sdbInterfaceCL} from "/UPA_scripts.php?id=3";
import * as t4Mod from "/UPA_scripts.php?id=4";
import * as t5Mod from "/UPA_scripts.php?id=5";


export function upa_main(preferenceUserID, entityType, entityID, userID) {
    if (preferenceUserID !== "1") {
        throw "Unrecognized preference user";
    }

    let initialData = {
        preferenceUser: preferenceUserID,
        entityType: entityType,
        entityID: entityID,
        user: userID,
    };
    let data = {
        columnSpecs: [
            {
                cl: sdbInterfaceCL.getRelatedCL("CategoryColumn"),
                data: Object.assign(initialData, {catID: entityID}),
            },
        ],
    };
    let contentKey = sdbInterfaceCL.contentKey;
    sdbInterfaceCL.loadAppended($('body'), contentKey, data);
}
