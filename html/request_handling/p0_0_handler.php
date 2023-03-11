<?php

$p0_0_path = $_SERVER['DOCUMENT_ROOT'] . "/src/request_handling/p0_0/";
require_once $p0_0_path . "p0_0_lib.php";

use p0_0 as p;


// check that http method is the POST method.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo p\getErrorJSON("Only the POST method is implemented");
    exit;
}


// get request type.
if (!isset($_POST["reqType"])) {
    echo p\getErrorJSON("No request type specified");
    exit;
}
$reqType = $_POST["reqType"];


// branch to corresponding request handler.
$unsafeJSON = "";
switch ($reqType) {
    case "set":
        $unsafeJSON = getSetUnsafeJSON();
        break;
    case "catTitle":
        // TODO..
        p\safeEcho("...");
        exit;
        break;
    default:
        echo p\getErrorJSON("Unrecognized request type");
        exit;
}

p\safeEcho($unsafeJSON);
exit;








function getSetUnsafeJSON() {
    // get, verify and set parameters.
    foreach (
        array(
            "userType", "userID", "subjType", "subjID", "relID",
            "ratingRangeMin", "ratingRangeMax",
            "num", "numOffset",
            "isAscOrder"
        )
        as $paramName
    ) {
        if (!isset($_POST[$paramName])) {
            echo p\getErrorJSON(
                "Set request error: " .
                "Parameter ". $paramName . " is not specified"
            );
            exit;
        }
        $$paramName = $_POST[$paramName];
    }
    // query database.
    $queryRes =
        db_io\getSet(
            $userType, $userID, $subjType, $subjID, $relID,
            $ratingRangeMin, $ratingRangeMax,
            $num, $numOffset,
            $isAscOrder
        );
    // JSON-encode and return the query result.
    return json_encode($queryRes);
}





?>
