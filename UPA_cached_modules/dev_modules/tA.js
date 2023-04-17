/* A main function */

import {
    upaf_appendHelloWorld, upaf_addHTML
} from "/UPA_scripts.php?id=t1";

import {
    upaf_uploadRating, upaf_uploadProtectedRating, upaf_uploadSemanticTerm,
    upaf_uploadCat, upaf_uploadETerm, upaf_uploadRel, upaf_uploadText,
    upaf_uploadBinary,
    upaf_querySet, upaf_querySetInfo, upaf_querySetInfoFromSecKey,
    upaf_queryRating, upaf_queryCatDef, upaf_queryETermDef,
    upaf_queryRelDef, upaf_querySuperCatDefs,
    upaf_queryText, upaf_queryBinary, upaf_queryKeywordString,
    upaf_queryPattern,
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
            let catDef = upaf_queryCatDef(termID);
            break;
        default:
            throw "main(): termType not implemented";
    }
}
