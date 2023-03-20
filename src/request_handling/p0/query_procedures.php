<?php namespace p0;

/* Input IDs are always prefixed with a type character in this protocol.
 **/

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "safe_query.php";

function getSetJSON() {
    // verify and get parameters.
    $paramNameArr = array(
        "setID",
        "ratMin", "ratMax",
        "num", "offset",
        "isAsc"
    );
    $typeArr = array(
        "setID",
        "bin", "bin",
        "uint", "uint",
        "tint"
    );
    $errPrefix = "Set request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input as variables with corresponding names.
    for ($i = 0; $i < 6; $i++) {
        ${$paramNameArr[$i]} = $paramValArr[$i];
    }

    // query database.
    $queryRes = \db_io\getSafeSet(
        substr($setID, 1),
        $ratMin, $ratMax,
        $num, $offset,
        $isAsc
    );
    // JSON-encode and return the query result.
    return json_encode($queryRes);
}

function getSetInfoJSON() {
    // verify and get parameters.
    $paramNameArr = array(
        "setID"
    );
    $typeArr = array(
        "setID"
    );
    $errPrefix = "Set info request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);

    // initialize input as variables with corresponding names.
    ${$paramNameArr[0]} = $paramValArr[0];

    // query database.
    $queryRes = \db_io\getSafeSetInfo(
        substr($setID, 1)
    );
    // JSON-encode and return the query result.
    return json_encode($queryRes);
}

function getSetInfoFromSecKeyJSON() {
    // verify and get parameters.
    $paramNameArr = array(
        "userID", "subjID", "relID"
    );
    $typeArr = array(
        "userOrGroupID", "termID", "relID"
    );
    $errPrefix = "Set info from secondary key request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input as variables with corresponding names.
    for ($i = 0; $i < 3; $i++) {
        ${$paramNameArr[$i]} = $paramValArr[$i];
    }

    // query database.
    $queryRes = \db_io\getSafeSetInfoFromSecKey(
        $userID[0], substr($userID, 1),
        $subjID[0], substr($subjID, 1),
        substr($relID, 1)
    );
    // JSON-encode and return the query result.
    return json_encode($queryRes);
}


function getDefJSON() {
    // verify and get parameters.
    $paramNameArr = array("termID");
    $typeArr = array("semTermID");
    $errPrefix = "Definition request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input as variables with corresponding names.
    ${$paramNameArr[0]} = $paramValArr[0];

    $type = $termID[0];
    $id =  substr($termID, 1);
    // branch according to the term type.
    switch ($type) {
        case "c":
            $queryRes = \db_io\getSafeCatDef($id);
            return json_encode($queryRes);
        case "e":
            $queryRes = \db_io\getSafeETermDef($id);
            return json_encode($queryRes);
        case "r":
            $queryRes = \db_io\getSafeRelDef($id);
            return json_encode($queryRes);
        default:
            // echoErrorJSONAndExit($errPrefix . "Unrecognized term type");
            throw new \Exception("getDefJSON(): \$type not of /[cer]/!");
    }
}




function getSuperCatsJSON() {
    // verify and get parameters.
    $paramNameArr = array("catID");
    $typeArr = array("catID");
    $errPrefix = "Supercategories request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);

    // initialize input as variables with corresponding names.
    ${$paramNameArr[0]} = $paramValArr[0];

    // initialize input variables for querying.
    $id = substr($catID, 1);
    // query database.
    $queryRes = \db_io\getSafeCatSuperCats($id);
    // JSON-encode and return the query result.
    return json_encode($queryRes);
}




?>
