<?php

$database_path = "";
require_once $database_path . "connect.php";



function insertSimpleTerm($lexItem, $description, $user_id, $new_id) {
    $conn = getConnectionOrDie();


    $stmt = $conn->prepare(
        "CALL insertTerm (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "ssiiii",
        $lexItem, $description,
        $user_id,
        $new_id,
        $exit_code_lex, $exit_code_dscr
    );

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
