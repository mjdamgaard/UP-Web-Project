<?php

$database_path = "";
require_once $database_path . "connect.php";




function insertOrFindCategory($titel, $superCatID, $userID) {
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




function insertOrFindStandard($titel, $catID, $userID) {
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


function insertOrFindRelation($objNoun, $subjCatID, $userID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL insertOrFindRel (?, ?, ?, @new_id, @exit_code)"
    );
    $stmt->bind_param(
        "sii",
        $objNoun,
        $subjCatID,
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









function insertText($str, $userID) {
    $conn = getConnectionOrDie();

    // insert term.
    $stmt = $conn->prepare(
        "CALL insertTxt (?, ?, @new_id, @exit_code)"
    );
    $stmt->bind_param(
        "si",
        $str,
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






?>
