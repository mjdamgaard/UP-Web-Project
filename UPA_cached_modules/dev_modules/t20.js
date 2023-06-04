/* A main function */

import "/src/DBRequestManager.js";
import "/src/ContentLoader.js";
import {sdbInterfaceCL} from "/src/Columns.js";
import "/src/PagesWithTabs.js";
import "/src/SetFields.js";
import "/src/Titles.js";
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
