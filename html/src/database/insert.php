<?php

$database_path = "";
require_once $database_path . "connect.php";




function insertOrFindCat($titel, $superCatID, $userID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL insertOrFindCat (?, ?, ?, @new_id, @exit_code)"
    );
    $stmt->bind_param(
        "sii",
        $titel,
        $superCatID,
        $userID
    );
    executeSuccessfulOrDie($stmt);

    // get new_id and exit_code from insertion.
    $stmt = $conn->prepare(
        "SELECT @new_id AS id, @exit_code AS ec"
    );
    executeSuccessfulOrDie($stmt);

    // return array("newID" => @new_id, "exitCode" => @exit_code).
    return $stmt->get_result()->fetch_assoc();
}


function insertOrFindStd($titel, $catID, $userID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL insertOrFindStd (?, ?, ?, @new_id, @exit_code)"
    );
    $stmt->bind_param(
        "sii",
        $titel,
        $catID,
        $userID
    );
    executeSuccessfulOrDie($stmt);

    // get new_id and exit_code from insertion.
    $stmt = $conn->prepare(
        "SELECT @new_id AS id, @exit_code AS ec"
    );
    executeSuccessfulOrDie($stmt);

    // return array("newID" => @new_id, "exitCode" => @exit_code).
    return $stmt->get_result()->fetch_assoc();
}


function insertOrFindRel($objNoun, $objCat, $subjCat, $userID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL insertOrFindRel (?, ?, ?, ?, @new_id, @exit_code)"
    );
    $stmt->bind_param(
        "siii",
        $objNoun,
        $objCat,
        $subjCat,
        $userID
    );
    executeSuccessfulOrDie($stmt);

    // get new_id and exit_code from insertion.
    $stmt = $conn->prepare(
        "SELECT @new_id AS id, @exit_code AS ec"
    );
    executeSuccessfulOrDie($stmt);

    // return array("newID" => @new_id, "exitCode" => @exit_code).
    return $stmt->get_result()->fetch_assoc();
}









// function insertSimpleTerm($lexItem, $description, $user_id, $new_id) {
//     $conn = getConnectionOrDie();
//
//
//     $stmt = $conn->prepare(
//         "CALL insertTerm (?, ?, ?, ?, ?, ?)"
//     );
//     $stmt->bind_param(
//         "ssiiii",
//         $lexItem, $description,
//         $user_id,
//         $new_id,
//         $exit_code_lex, $exit_code_dscr
//     );
//
//     $stmt->execute();
//
//     return array($exit_code_lex, $exit_code_dscr);
// }










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
