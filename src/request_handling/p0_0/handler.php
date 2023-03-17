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


// branch to corresponding request handling subprocedure and exit afterwards.
switch ($reqType) {
    case "q":
        if (!isset($_POST["qType"])) {
            echoErrorJSONAndExit("No request type specified");
        }
        $reqType = $_POST["qType"];
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
        exit;
    case "r":
        // TODO: Implement rating request handling
        exit;
    case "i":
        // TODO: Implement insertion request handling
        exit;
    default:
        echoErrorJSONAndExit("Unrecognized request type");
}





?>
