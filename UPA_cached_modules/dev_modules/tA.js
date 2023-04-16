/* A main function */

import {
    upaf_appendHelloWorld, upaf_addHTML
} from "/UPA_scripts.php?id=t1";

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
}
