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
        p\echoErrorJSONAndExit("Unrecognized request type");
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
            p\echoErrorJSONAndExit(
                "Set request error: " .
                "Parameter ". $paramName . " is not specified"
            );
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
