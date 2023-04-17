/* A main function */

import {
    upaf_appendHelloWorld, upaf_addHTML
} from "/UPA_scripts.php?id=t1";

import {
    upaf_upload, upaf_query, upaf_getUploadReqDataArr, upaf_getQueryReqDataArr,
} from "/UPA_scripts.php?id=t3";


export function upaf_main(preferenceUserID, termID, userID) {
    // upaf_appendHelloWorld();

    // just a few tests; not meant to be thorough at all.
    let struct1 = [
        ["div", "hello world"]
    ];
    let struct2 = "hello <&>\"'";
    let struct3 = [
        ["div", [["~foo", "bar"], ["~bar", "foo"]], "hello world"]
    ];
    let struct4 = [
        ["div"]
    ];
    upaf_addHTML("main", "append", struct1); // works now.
    upaf_addHTML("main", "append", struct2); // works now.
    upaf_addHTML("main", "append", struct3); // works now.
    upaf_addHTML("main", "append", struct4); // works now.

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
