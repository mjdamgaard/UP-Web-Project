<?php namespace db_io;

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/src/db_io/";
require_once $db_io_path . "connect_lib.php";




function insertOrFindCategory($titel, $superCatID, $userID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL insertOrFindCat (?, ?, ?, @newID, @exitCode)"
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
        "SELECT @newID AS id, @exitCode AS ec"
    );
    executeSuccessfulOrDie($stmt);

    // return array("newID" => @new_id, "exitCode" => @exit_code).
    return $stmt->get_result()->fetch_assoc();
}




function insertOrFindStandardTerm($titel, $catID, $userID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL insertOrFindStd (?, ?, ?, @newID, @exitCode)"
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
        "SELECT @newID AS id, @exitCode AS ec"
    );
    executeSuccessfulOrDie($stmt);

    // return array("newID" => @new_id, "exitCode" => @exit_code).
    return $stmt->get_result()->fetch_assoc();
}


function insertOrFindRelation($objNoun, $subjCatID, $userID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL insertOrFindRel (?, ?, ?, @newID, @exitCode)"
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
        "SELECT @newID AS id, @exitCode AS ec"
    );
    executeSuccessfulOrDie($stmt);

    // return array("newID" => @new_id, "exitCode" => @exit_code).
    return $stmt->get_result()->fetch_assoc();
}









function insertText($str, $userID) {
    $conn = getConnectionOrDie();

    // insert term.
    $stmt = $conn->prepare(
        "CALL insertTxt (?, ?, @newID, @exitCode)"
    );
    $stmt->bind_param(
        "si",
        $str,
        $userID
    );
    executeSuccessfulOrDie($stmt);

    // get new_id and exit_code from insertion.
    $stmt = $conn->prepare(
        "SELECT @newID AS id, @exitCode AS ec"
    );
    executeSuccessfulOrDie($stmt);

    // return array("newID" => @new_id, "exitCode" => @exit_code).
    return $stmt->get_result()->fetch_assoc();
}





?>
