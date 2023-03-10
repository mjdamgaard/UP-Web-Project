<?php

$database_path = $_SERVER['DOCUMENT_ROOT'] . "/src/database_io/";
require_once $database_path . "connect_lib.php";




function getSet(
    $userType, $userID, $subjType, $subjID, $relID,
    $ratingRangeMin, $ratingRangeMax,
    $num, $numOffset,
    $isAscOrder
) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectSet (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "sisiibbiii",
        $userType, $userID, $subjType, $subjID, $relID,
        $ratingRangeMin, $ratingRangeMax,
        $num, $numOffset,
        $isAscOrder
    );
    executeSuccessfulOrDie($stmt);

    // return array("ratingVal" => res, "objType" => res, "objID" => res).
    return $stmt->get_result()->fetch_assoc();
}





function getCatTitle($catID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectCatTitle (?)"
    );
    $stmt->bind_param(
        "i",
        $catID
    );
    executeSuccessfulOrDie($stmt);

    // return array("catTitle" => res).
    return $stmt->get_result()->fetch_column();
}

function getSuperCatID($catID) {
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectCatSuperCat (?)"
    );
    $stmt->bind_param(
        "i",
        $catID
    );
    executeSuccessfulOrDie($stmt);

    // return array("catTitle" => res).
    return $stmt->get_result()->fetch_column();
}


?>
