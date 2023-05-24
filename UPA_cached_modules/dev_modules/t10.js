/* A main function */

import * as t1Mod from "/UPA_scripts.php?id=1";
import "/UPA_scripts.php?id=2"; // request t2 immediately.
import {sdbInterfaceCL} from "/UPA_scripts.php?id=3";
import * as t4Mod from "/UPA_scripts.php?id=4";
import * as t5Mod from "/UPA_scripts.php?id=5";

import * as t9Mod from "/UPA_scripts.php?id=9";


export function upa_main(queryUserID, entityType, entityID, inputUserID) {
    if (queryUserID !== "1") {
        throw "Unrecognized query user";
    }

    let data = {
        queryUserID: queryUserID,
        entityType: entityType,
        entityID: entityID,
        inputUserID: inputUserID,
        columnSpecs: [
            {cl: sdbInterfaceCL.getRelatedCL("EntityColumn")},
        ],
    };
    let contentKey = sdbInterfaceCL.contentKey;
    sdbInterfaceCL.loadAppended($('body'), contentKey, data);
}
