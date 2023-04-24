/* A main function */



import {
    upaf_upload, upaf_queryAndSanitize,
} from "/UPA_scripts.php?id=t3";


let helloHTML = "<b>Hello, world</b>";

export function upaf_main(preferenceUserID, termID, userID) {

    

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
