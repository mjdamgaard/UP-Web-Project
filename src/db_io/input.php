<?php namespace db_io;

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "general.php";




function inputOrChangeUserRating(
    $userID, $subjType, $subjID, $relID, $ratingVal, $objType, $objID
) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL inputOrChangeRating ('usr', ?, ?, ?, ?, ?, ?, ?, @exit_code)"
    );
    $stmt->bind_param(
        "isiibsi",
        $userID, $subjType, $subjID, $relID, $ratingVal, $objType, $objID
    );
    executeSuccessfulOrDie($stmt);

    // get new_id and exit_code from insertion.
    $stmt = $conn->prepare(
        "SELECT @exit_code AS ec"
    );
    executeSuccessfulOrDie($stmt);

    // return array("newID" => @new_id, "exitCode" => @exit_code).
    return $stmt->get_result()->fetch_assoc();
}




?>
