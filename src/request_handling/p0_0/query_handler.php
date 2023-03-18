<?php

$general_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/general/";
require_once $general_path . "input_verification.php";
require_once $general_path . "errors.php";


require_once "query.php";
use p0_0 as p;



// get request type.
if (!isset($_POST["reqType"])) {
    echoErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["reqType"];


// branch to corresponding query type and exit afterwards.
switch ($reqType) {
    case "set":
        echo p\getSetJSON();
        exit;
    case "def":
        echo p\getDefJSON();
        exit;
    case "sup":
        echo p\getSuperCatsJSON();
        exit;
    default:
        echoErrorJSONAndExit("Unrecognized request type");
}





?>
