<?php

$path = "src/database/";
require_once $path . "connect.php";



function insertSimpleTerm($str_lexItem, $str_description, $new_id) {

    $conn = getConnectionOrDie();

    // prepare and bind.
    $stmt = $conn->prepare(
        "CALL insertTerm (?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "ss",
        $str_lexItem, $str_description,
        $new_id,
        $exit_code_lex, $exit_code_dscr
    );

    // set parameters and execute.
    // $lexItem = $str_lexItem;
    // $description = $str_description;
    $stmt->execute();

    return array($exit_code_lex, $exit_code_dscr);
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
