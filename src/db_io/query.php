<?php namespace db_io;


$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "general.php";


function getSet(
    $userType, $userID, $subjType, $subjID, $relID,
    $ratingRangeMin, $ratingRangeMax,
    $num, $numOffset,
    $isAscOrder
) {
    // convert rating ranges from hexadecimal string to binary strings
    $ratingRangeMin = hex2bin($ratingRangeMin);
    $ratingRangeMax = hex2bin($ratingRangeMax);

    echo print_r(array($ratingRangeMin, $ratingRangeMax)) . "<br>";
    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectSet (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "sssssbbiii",
        $userType, $userID, $subjType, $subjID, $relID,
        $ratingRangeMin, $ratingRangeMax,
        $num, $numOffset,
        $isAscOrder
    );
    executeSuccessfulOrDie($stmt);

    // return multidimensional array with columns: (ratingVal, objType, objID).
    return $stmt->get_result()->fetch_all();
}


function getSafeDef($id, $procIdent, $strColumnName, $catColumnName) {
    // get connection.
    $conn = getConnectionOrDie();

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
    $res = $stmt->get_result()->fetch_assoc();
    $res = array_values($res);
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








function getCatSafeSuperCats($catID) {
    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectSuperCatDefs (?)"
    );
    $stmt->bind_param(
        "s",
        $catID
    );
    executeSuccessfulOrDie($stmt);

    // fetch and sanitize data.
    $res = $stmt->get_result()->fetch_all();
    $ret = array(
        array($catID, htmlspecialchars($res[0][0]))
    );
    $len = count($res);
    for ($i = 1; $i < $len; $i++) {
        $ret[] = array($res[$i - 1][1], htmlspecialchars($res[$i][0]));
    }

    // return multi-dimensional array of category IDs and corresponding
    // titles starting from an array of the ID and title of the input
    // category and ending with array("1", "Terms").
    return $ret;
}









function getSafeText($txtID) {

    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectData ('t', ?)"
    );
    $stmt->bind_param(
        "s",
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
