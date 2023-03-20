<?php

/* In this database interface layer, "ID" refers to un-prefixed (pure
 * hexadecimal) IDs. The functions thus needs types and IDs seperately
 * as their inputs. All IDs are input and output as hexadecimal strings
 * to/from the SQL API. The same goes for the binary rating values. This
 * means that the output IDs and rating values (and the input ones for that
 * matter) is always safe to print.
 * Furthermore, all text outputs are converted to safe html texts (using
 * the htmlspecialchars() function) in this layer!
 **/

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "mysqli_procedures.php";


class SafeQuerier {
    private static $querySQLSpecs = array(
        selectSet => array(
            n => 6,
            sql => "CALL selectSet (?, ?, ?, ?, ?, ?)",
            typeArr => array(
                "setID",
                "bin", "bin",
                "uint", "uint",
                "tint"
            ),
            outputType => "numArr",
            columnNames => array("ratVal", "objID"),
            unsafeColumns => array()
        ),

        selectSetInfo => array(
            n => 1,
            sql => "CALL selectSetInfo (?)",
            typeArr => array(
                "setID"
            ),
            outputType => "assocArr",
            columnNames => array("userID", "subjID", "relID", "elemNum"),
            unsafeColumns => array()
        ),

        selectSetInfoSK => array(
            n => 3,
            sql => "CALL selectSetInfoFromSecKey (?, ?, ?)",
            typeArr => array(
                "userOrGroupID", "termID", "relID"
            ),
            outputType => "assocArr",
            columnNames => array("setID", "elemNum"),
            unsafeColumns => array()
        ),

        selectRating => array(
            n => 4,
            sql => "CALL selectRating (?, ?, ?, ?)",
            typeArr => array(
                "termID", "userOrGroupID", "termID", "relID"
            ),
            outputType => "assocArr",
            columnNames => array("ratVal"),
            unsafeColumns => array()
        ),

        selectCatDef => array(
            n => 1,
            sql => "CALL selectCatDef (?)",
            typeArr => array(
                "catID"
            ),
            outputType => "assocArr",
            columnNames => array("catTitle", "superCatID"),
            unsafeColumns => array(0) // this means that first column has to
            // be sanitized (by calling htmlspecailchars()).
        ),

        selectETermDef => array(
            n => 1,
            sql => "CALL selectETermDef (?)",
            typeArr => array(
                "eTermID"
            ),
            outputType => "assocArr",
            columnNames => array("eTermTitle", "catID"),
            unsafeColumns => array(0)
        ),

        selectRelDef => array(
            n => 1,
            sql => "CALL selectRelDef (?)",
            typeArr => array(
                "eTermID"
            ),
            outputType => "assocArr",
            columnNames => array("objNoun", "subjCatID"),
            unsafeColumns => array(0)
        ),

        selectSuperCatDefs => array(
            n => 1,
            sql => "CALL selectRelDef (?)",
            typeArr => array(
                "catID"
            ),
            outputType => "numArr",
            columnNames => array("catTitle", "superCatID"),
            unsafeColumns => array(0) // this means that the whole first
            // column has to be sanitized (by calling htmlspecailchars()).
        )
    );

    private function verifyInputAndGetMySQLiResult (
        $conn, $sqlSelector, $paramValArr
    ) {
        // lookup SQL specs.
        if (!isset($querySQLSpecs[$sqlSelector])) {
            throw new Exception(
                "verifyInputAndGetMySQLiResult(): " .
                "sqlSelector does not match any selector"
            );
        }
        $sqlSpec = $querySQLSpecs[$sqlSelector];

        // check length of $paramValArr.
        if (count($paramValArr) != $sqlSpec["n"]) {
            throw new Exception(
                "verifyInputAndGetMySQLiResult(): " .
                "paramValArr has incorrect length"
            );
        }

        // verify types of $paramValArr.
        for ($i = 0; $i < $sqlSpec["n"]; $i++) {
            verifyType(
                $paramValArr[$i],
                $sqlSpec["typeArr"][$i],
                strval($i),
                $sqlSelector // sqlSelector must not come from user input!
            );
        }

        // prepare MySQLi statement.
        $stmt = $conn->prepare($sqlSpec["sql"]);
        // execute statement with the (now type verified) input parameters.
        $stmt->execute($paramValArr);

        // return mysqli_result object.
        return $stmt->get_result();
    }

    private function fetchSafeRows() {

    }

}

// const QuerySQLSpecs = {
//     selectSet => array(
//
//         "CALL selectSet (?, ?, ?, ?, ?, ?)",
//     ),
//     selectSetInfo => "CALL selectSetInfo (?)",
//     selectSetInfoSK => "CALL selectSetInfoFromSecKey (?, ?, ?, ?, ?)"
//     // "selectCatDef"
//     // "selectETermDef"
//     // "selectRelDef"
//
// }

function getMySQLiQueryResult ($conn, $sqlSelector, $paramValArr) {
    $stmt = $conn->prepare(
        QuerySQL[$sqlSelector]
    );
    $stmt->execute($paramValArr);

    return $stmt->get_result();
}


/* Sets and set info */

function getSafeSet(
    $setID,
    $ratingRangeMin, $ratingRangeMax,
    $num, $numOffset,
    $isAscOrder
) {
    // get connection.
    $conn = getConnectionOrDie();

    // query database.
    $stmt = $conn->prepare(
        "CALL selectSet (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "ssssss",
        $setID,
        $ratingRangeMin, $ratingRangeMax,
        $num, $numOffset,
        $isAscOrder
    );
    executeSuccessfulOrDie($stmt);

    // return multidimensional array with columns: (ratingVal, objType, objID).
    return $stmt->get_result()->fetch_all();
}

function getSafeSetInfo($setID) {
    // get connection.
    $conn = getConnectionOrDie();

    // query database.
    $stmt = $conn->prepare(
        "CALL selectSetInfo (?)"
    );
    $stmt->bind_param(
        "s",
        $setID
    );
    executeSuccessfulOrDie($stmt);

    // return array with: (userType, userID, subjType, subjID, relID, elemNum).
    return $stmt->get_result()->fetch_assoc();
}


function getSafeSetInfoFromSecKey(
    $userType, $userID, $subjType, $subjID, $relID
) {
    // get connection.
    $conn = getConnectionOrDie();

    // query database.
    $stmt = $conn->prepare(
        "CALL selectSetInfoFromSecKey (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "sssss",
        $userType, $userID, $subjType, $subjID, $relID
    );
    executeSuccessfulOrDie($stmt);

    // return array with: (setID, elemNum).
    return $stmt->get_result()->fetch_assoc();
}



/* Definitions (of categories, relations and elementary terms) */

function getSafeDef($id, $procIdent, $strColumnName, $catColumnName) {
    // get connection.
    $conn = getConnectionOrDie();

    // query database.
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

    // return array with: ($strColumnName, $catColumnName).
    return array($strColumnName => $safeStr, $catColumnName => $catID);

}


function getSafeCatDef($catID) {
    return getSafeDef($catID, "selectCatDef", "title", "superCatID");
}

function getSafeETermDef($catID) {
    return getSafeDef($catID, "selectETermDef", "title", "catID");
}

function getSafeRelDef($catID) {
    return getSafeDef($catID, "selectRelDef", "objNoun", "subjCatID");
}




/* Array of defining supercategories for an input category */

function getSafeCatSuperCats($catID) {
    // get connection.
    $conn = getConnectionOrDie();

    // query database.
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

    // query database.
    $stmt = $conn->prepare(
        "CALL selectText (?)"
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
