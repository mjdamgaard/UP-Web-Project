<?php namespace db_io;


$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "general.php";


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


function getSafeDef(
    $id, $procIdent, $strColumnName, $catColumnName
) {
    // convert ID from hexadecimal string to hexadecimal literal.
// echo $id . ",  ";
// $id = hexdec($id);
    // $id = "0x" . $id;

    // get connection.
    $conn = getConnectionOrDie();

echo $id . "<br>";
    // insert or find term.
    $stmt = $conn->prepare(
        "CALL " . $procIdent . " (?)"
    );
    $stmt->bind_param(
        "s",
        $id
    );
    executeSuccessfulOrDie($stmt);

    // fetch and sanitize data.
    // $res = $stmt->get_result()->fetch_assoc();
$res = $stmt->get_result()->fetch_column();
echo var_dump($res);
    $unsafeStr = $res[0];
    $safeStr = htmlspecialchars($unsafeStr);
    $catID = $res[1];

    // return data as array.
    return array($strColumnName => $safeStr, $catColumnName => $catID);

}


function getCatSafeDef($catID) {
    return getSafeDef($catID, "selectCatDef", "title", "superCatID");
}

function getStdSafeDef($catID) {
    return getSafeDef($catID, "selectStdDef", "title", "catID");
}

function getRelSafeDef($catID) {
    return getSafeDef($catID, "selectRelDef", "objNoun", "subjCatID");
}








function getSafeSuperCats($catID) {
    // convert ID from hexadecimal string to hexadecimal literal.
    $catID = "0x" . $catID;

    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectSuperCats (?)"
    );
    $stmt->bind_param(
        "i",
        $catID
    );
    executeSuccessfulOrDie($stmt);

    // fetch and sanitize data.
    $unsafeStr = $stmt->get_result()->fetch_column();
    $safeStr = htmlspecialchars($unsafeStr);

    // return text string.
    return $safeStr;
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

    // fetch and sanitize data.
    $unsafeStr = $stmt->get_result()->fetch_column();
    $safeStr = htmlspecialchars($unsafeStr);

    // return text string.
    return $safeStr;
}



?>
