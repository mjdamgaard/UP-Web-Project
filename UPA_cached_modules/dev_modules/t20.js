/* A main function */

import * as t11Mod from "/UPA_scripts.php?id=11";
import "/UPA_scripts.php?id=2"; // request t2 immediately.
import {sdbInterfaceCL} from "/UPA_scripts.php?id=13";
import * as t14Mod from "/UPA_scripts.php?id=14";
import * as t15Mod from "/UPA_scripts.php?id=15";
// import * as t16Mod from "/UPA_scripts.php?id=16";

import * as t19Mod from "/UPA_scripts.php?id=19";


export function upa_main(entityType, entityID, queryUserID, inputUserID) {
    if (queryUserID !== "1") {
        throw "Unrecognized query user";
    }

    let data = {
        entityType: entityType,
        entityID: entityID,
        queryUserID: queryUserID,
        inputUserID: inputUserID,
        columnSpecs: [
            {cl: sdbInterfaceCL.getRelatedCL("EntityColumn")},
        ],
    };
    let contentKey = sdbInterfaceCL.contentKey;
    sdbInterfaceCL.loadAppended($('body'), contentKey, data);
}
