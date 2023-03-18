<?php namespace db_io;

/* In this database interface layer, "ID" refers to un-prefixed (pure
 * hexadecimal) IDs. The inputs of the functions are not changed in this
 * layer before they are sent to the procedures in the query API of the
 * database. But the output *IS* changed! All text outputs should be
 * converted to safe html texts (using the htmlspecialchars() function)
 * in this layer!
 **/

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "mysqli_procedures.php";


function getSafeSetFromSecIndex(
    $userType, $userID, $subjType, $subjID, $relID,
    $ratingRangeMin, $ratingRangeMax,
    $num, $numOffset,
    $isAscOrder
) {
    // // convert rating ranges from hexadecimal string to binary strings.
    // $ratingRangeMin = hex2bin($ratingRangeMin);
    // $ratingRangeMax = hex2bin($ratingRangeMax);

    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectSet (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "ssssssssss",
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


function getSafeCatDef($catID) {
    return getSafeDef($catID, "selectCatDef", "title", "superCatID");
}

function getSafeElemDef($catID) {
    return getSafeDef($catID, "selectElemDef", "title", "catID");
}

function getSafeRelDef($catID) {
    return getSafeDef($catID, "selectRelDef", "objNoun", "subjCatID");
}








function getSafeCatSuperCats($catID) {
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









function getSafeText($textID) {

    // get connection.
    $conn = getConnectionOrDie();

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL selectData ('t', ?)"
    );
    $stmt->bind_param(
        "s",
        $textID
    );
    executeSuccessfulOrDie($stmt);

    // fetch and sanitize data.
    $unsafeStr = $stmt->get_result()->fetch_column();
    $safeStr = htmlspecialchars($unsafeStr);

    // return text string.
    return $safeStr;
}



?>
