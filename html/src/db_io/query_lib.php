<?php  namespace db_io;

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/src/db_io/";
require_once $db_io_path . "connect_lib.php";




function getSet(
    $userType, $userID, $subjType, $subjID, $relID,
    $ratingRangeMin, $ratingRangeMax,
    $num, $numOffset,
    $isAscOrder
) {
    // convert IDs from hexadecimal strings to hexadecimal literals.
    $userID = "0x" . $userID;
    $subjID = "0x" . $subjID;
    $relID = "0x" . $relID;

    // get connection.
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





function getCatSafeTitle($catID) {
    // convert ID from hexadecimal string to hexadecimal literal.
    $catID = "0x" . $catID;

    // get connection.
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

    // return array("title" => res).
    $unsafeTitle = $stmt->get_result()->fetch_column();
    return htmlspecialchars($unsafeTitle);
}


function getStdTermSafeTitle($stdTermID) {
    // convert ID from hexadecimal string to hexadecimal literal.
    $stdTermID = "0x" . $stdTermID;

    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectStdTitle (?)"
    );
    $stmt->bind_param(
        "i",
        $stdTermID
    );
    executeSuccessfulOrDie($stmt);

    // return array("title" => res).
    $unsafeTitle = $stmt->get_result()->fetch_column();
    return htmlspecialchars($unsafeTitle);
}



function getCatSuperCatID($catID) {
    // convert ID from hexadecimal string to hexadecimal literal.
    $catID = "0x" . $catID;

    // get connection.
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

    // return array("superCatID" => res).
    return $stmt->get_result()->fetch_column();
}


function getStdTermCatID($stdTermID) {
    // convert ID from hexadecimal string to hexadecimal literal.
    $stdTermID = "0x" . $stdTermID;

    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectStdCat (?)"
    );
    $stmt->bind_param(
        "i",
        $stdTermID
    );
    executeSuccessfulOrDie($stmt);

    // return array("catID" => res).
    return $stmt->get_result()->fetch_column();
}






function getSafeText($txtID) {
    // convert ID from hexadecimal string to hexadecimal literal.
    $txtID = "0x" . $txtID;

    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectData ('t', ?)"
    );
    $stmt->bind_param(
        "i",
        $txtID
    );
    executeSuccessfulOrDie($stmt);

    // return array("str" => res).
    $unsafeText = $stmt->get_result()->fetch_column();
    return htmlspecialchars($unsafeText);
}







?>
