<?php

$p0_0_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/request_handling/p0_0/";
require_once $p0_0_path . "p0_0.php";
use p0_0 as p;

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "query.php";


// check that http method is the POST method.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    p\echoErrorJSONAndExit("Only the POST method is implemented");
}


// get request type.
if (!isset($_POST["reqType"])) {
    p\echoErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["reqType"];


// branch to corresponding request handling subprocedure and exit afterwards.
switch ($reqType) {
    case "set":
        echo getSetJSON();
        exit;
    case "def":
        echo getDefJSON();
        exit;
    default:
        p\echoErrorJSONAndExit("Unrecognized request type");
}






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
        "int", "int",
        "tint"
    );
    $errPrefix = "Set request error: ";
    $paramArr = p\verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input variables for querying.
    for ($i = 0; $i < 10; $i++) {
        ${$paramNameArr[$i]} = $paramArr[i];
    }
    // query database.
    $queryRes = db_io\getSet(
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
    $paramArr = p\verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);


    // initialize input variables for querying.
    $termType = $paramArr[0];
    $id = $paramArr[1];

    // branch according to the term type.
    switch ($termType) {
        case "c":
            $queryRes = db_io\getCatSafeDef($id);
            return json_encode($queryRes);
        case "s":
            $queryRes = db_io\getStdSafeDef($id);
            return json_encode($queryRes);
        case "r":
            $queryRes = db_io\getRelSafeDef($id);
            return json_encode($queryRes);
        default:
            p\echoErrorJSONAndExit($errPrefix . "Unrecognized term type");
    }
}




?>
