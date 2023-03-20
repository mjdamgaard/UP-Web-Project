<?php

if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}


$general_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/general/";
require_once $general_path . "input_verification.php";
require_once $general_path . "errors.php";

$p0_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/request_handling/p0/";
require_once $p0_path . "query_procedures.php";
use p0 as p;



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
    case "setInfo":
        echo p\getSetInfoJSON();
        exit;
    case "setInfoSK":
        echo p\getSetInfoFromSecKeyJSON();
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
