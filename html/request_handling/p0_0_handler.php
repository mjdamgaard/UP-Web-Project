<?php

$p0_0_path = $_SERVER['DOCUMENT_ROOT'] . "/src/request_handling/p0_0/";
require_once $p0_0_path . "p0_0_lib.php";

use p0_0 as p;


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
        echo p\getSetJSON();
        exit;
    case "catTitle":
        // TODO..
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
        "char1", "ptr", "char1", "ptr", "ptr",
        "varchar255", "varchar255",
        "int", "int",
        "bool"
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





?>
