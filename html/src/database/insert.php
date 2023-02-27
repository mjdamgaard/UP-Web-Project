<?php

$path = "src/database/";
require_once $path . "connect.php";



function insertSimpleTerm(str_lexItem, str_description) {
    $sql =
        'CALL insertTerm (\"' .
            str_lexItem . '\", \"' .
            str_description .
        '\")';

    $conn = "";
    if (makeConnection($conn)) {
        error_log("connection failed!");
        return 1; // EXIT_FAILURE.
    }

    $conn->query($sql);
}





// function appendSQL_addObjNounRelation(
//     $subjType, $objNoun, $objType, $dscrptn
// ) {
//     $sql = "";
//     if (strlen($subjType) != 0) {
//         $sql .= "(".$subjType.") ";
//     }
//     $sql .= "has ".$objNoun . " ";
//     if (strlen($objType) != 0) {
//         $sql .= "(".$objType.") ";
//     }
//     $sql .= "=";
//
//     if (strlen($dscrptn) != 0) {
//
//     }
//
//     return $sql;
// }

?>
