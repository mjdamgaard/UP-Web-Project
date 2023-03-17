<?php namespace p0_0;


$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "query.php";

function getSetJSON() {
    // verify and get parameters.
    $paramNameArr = array(
        "userType", "userID", "subjType", "subjID", "relID",
        "ratingRangeMin", "ratingRangeMax",
        "num", "numOffset",
        "isAscOrder"
    );
    $typeArr = array(
        "t", "id", "t", "id", "id",
        "bin", "bin",
        "uint", "uint",
        "tint"
    );
    $errPrefix = "Set request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input variables for querying.
    for ($i = 0; $i < 10; $i++) {
        ${$paramNameArr[$i]} = $paramValArr[$i];
    }
    // query database.
    $queryRes = \db_io\getSet(
        $userType, $userID, $subjType, $subjID, $relID,
        $ratingRangeMin, $ratingRangeMax,
        $num, $numOffset,
        $isAscOrder
    );
    // JSON-encode and return the query result.
    return json_encode($queryRes);
}





function getDefJSON() {
    // verify and get parameters.
    $paramNameArr = array("termType", "id");
    $typeArr = array("t", "id");
    $errPrefix = "Definition request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input variables for querying.
    $termType = $paramValArr[0];
    $id = $paramValArr[1];

    // branch according to the term type.
    switch ($termType) {
        case "c":
            $queryRes = \db_io\getCatSafeDef($id);
            return json_encode($queryRes);
        case "s":
            $queryRes = \db_io\getStdSafeDef($id);
            return json_encode($queryRes);
        case "r":
            $queryRes = \db_io\getRelSafeDef($id);
            return json_encode($queryRes);
        default:
            echoErrorJSONAndExit($errPrefix . "Unrecognized term type");
    }
}




function getSuperCatsJSON() {
    // verify and get parameters.
    $paramNameArr = array("catID");
    $typeArr = array("id");
    $errPrefix = "Supercategories request error: ";
    $paramValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input variables for querying.
    $catID = $paramValArr[0];
    // query database.
    $queryRes = \db_io\getCatSafeSuperCats($catID);
    // JSON-encode and return the query result.
    return json_encode($queryRes);
}




?>
