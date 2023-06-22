/* A main function */

import "/src/DBRequestManager.js";
import "/src/ContentLoader.js";
import {sdbInterfaceCL} from "/src/content_loaders/ColumnInterface.js";
import "/src/content_loaders/PagesWithTabs.js";
import "/src/content_loaders/SetLists.js";
import "/src/content_loaders/SetView.js";
import "/src/content_loaders/TermElements.js";
import "/src/content_loaders/TermPages.js";
import "/src/content_loaders/Titles.js";
// import "/src/content_loaders/SetElements.js";
// import "/src/content_loaders/SubmitFields.js";
// import * as t16Mod from "/UPA_scripts.php?id=16";

import * as t19Mod from "/UPA_scripts.php?id=19";


export function upa_main(termID, queryUserID, inputUserID) {
    if (queryUserID !== "3") {
        throw "Unrecognized query user";
    }

    let data = {
        termID: termID,
        queryUserID: queryUserID,
        inputUserID: inputUserID,
        defaultUserWeightArr: [{userID: 3, weight: 1}],
        cl: sdbInterfaceCL.getRelatedCL("TermPage"),
    };
    let contentKey = sdbInterfaceCL.contentKey;
    sdbInterfaceCL.loadAppended($('body'), contentKey, data);
}
