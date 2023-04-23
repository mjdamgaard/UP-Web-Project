/* A main function */

import {
    upaf_appendHelloWorld,
    upaf_html, upaf_attr, upaf_css, upaf_addCSS, upaf_removeCSS,
} from "/UPA_scripts.php?id=t1";

import {
    upaf_upload, upaf_query, upaf_getUploadReqDataArr, upaf_getQueryReqDataArr,
} from "/UPA_scripts.php?id=t3";


let helloHTML = "<b>Hello, world</b>";

export function upaf_main(preferenceUserID, termID, userID) {
    upaf_appendHelloWorld();

    // just a few CSS tests.
    upaf_addCSS('* { background-color: #FF0000; }');
    // Apart from the bug, why is this so slow?!!
    // ..Hm, it seems to be the cssAComplexRegEx match.. ..Hm, let me debug
    // and then look at the speed, I guess..
    upaf_addCSS('[~foo="bar"]', [["background-color", "#FF0000"]]);

    let termType = termID.substring(0, 1);
    switch (termType) {
        case "c":
            storeFunction(upaf_appendDataHTML, "appendDataHTML");
            let reqDataArr = upaf_getQueryReqDataArr("CatDef", termID);
            let catDef = upaf_query(reqDataArr, "appendDataHTML");
            break;
        default:
            throw "main(): termType not implemented";
    }
}

function upaf_appendDataHTML(dataArr) {
    upaf_addHTML("main", "append", dataArr[~~(0)] + ", " + dataArr[~~(1)]);
}
