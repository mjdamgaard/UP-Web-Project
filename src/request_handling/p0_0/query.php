<?php namespace p0_0;

/* Input IDs are always prefixed with a type character in this protocol.
 **/

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "safe_query.php";

function getSetJSON() {
    // verify and get parameters.
    $paramNameArr = array(
        "userID", "subjID", "relID",
        "ratMin", "ratMax",
        "num", "offset",
        "isAsc"
    );
    $typeArr = array(
        "userOrGroupID", "termID", "relID",
        "bin", "bin",
        "uint", "uint",
        "tint"
    );
    $errPrefix = "Set request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input as variables with corresponding names.
    for ($i = 0; $i < 10; $i++) {
        ${$paramNameArr[$i]} = $paramValArr[$i];
    }

    // convert rating ranges from hexadecimal string to binary strings.
    $ratMin = hex2bin($ratMin);
    $ratMax = hex2bin($ratMax); throw new \Exception("POST=" . print_r($_POST));

    // query database.
    $queryRes = \db_io\getSafeSet(
        $userID[0], substr($userID, 1),
        $subjID[0], substr($subjID, 1),
        $relID[0], substr($relID, 1),
        $ratMin, $ratMax,
        $num, $offset,
        $isAsc
    );
    // JSON-encode and return the query result.
    return json_encode($queryRes);
}





function getDefJSON() {
    // verify and get parameters.
    $paramNameArr = array("termID");
    $typeArr = array("termID");
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
            $queryRes = \db_io\getSafeElemDef($id);
            return json_encode($queryRes);
        case "r":
            $queryRes = \db_io\getSafeRelDef($id);
            return json_encode($queryRes);
        default:
            echoErrorJSONAndExit($errPrefix . "Unrecognized term type");
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
