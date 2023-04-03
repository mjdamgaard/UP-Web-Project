<?php

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVarNamer.php";
require_once $user_input_path . "InputGetter.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";
require_once $db_io_path . "SafeQuerier.php";



// queries can also be GET-gotten.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}


// get request type.
$reqTypeVarName = InputVarNamer::getReqTypeVarName();
if (!isset($_POST[$reqTypeVarName])) {
    echoErrorJSONAndExit("No request type specified");
}
$reqType = $_POST[$reqTypeVarName];

// get connection.
$conn = DBConnector::getConnectionOrDie();

// match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sqlKey = "";
$paramNameArr = "";
switch ($reqType) {
    case "S":
        $sqlKey = "set";
        $paramNameArr = array(
            "id",
            "rl", "rh",
            "n", "o",
            "a"
        );
        break;
    case "SI":
        $sqlKey = "setInfo";
        $paramNameArr = array("id");
        break;
    case "SISK":
        $sqlKey = "setInfoSK";
        $paramNameArr = array("uid", "sid", "rid");
        break;
    case "R":
        $sqlKey = "rating";
        $paramNameArr = array("oid", "sid");
        break;
    case "CD":
        $sqlKey = "catDef";
        $paramNameArr = array("id");
        break;
    case "ED":
        $sqlKey = "eTermDef";
        $paramNameArr = array("id");
        break;
    case "RD":
        $sqlKey = "relDef";
        $paramNameArr = array("id");
        break;
    case "SCD":
        $sqlKey = "superCatDefs";
        $paramNameArr = array("id");
        break;
    case "T":
        $sqlKey = "text";
        $paramNameArr = array("id");
        break;
    // case "B":
    //     $sqlKey = "binary";
    //     $paramNameArr = array("id");
    //     break;
}
if ($sqlKey != "") {
    $paramValArr = InputGetter::getParams($paramNameArr);
    $safeRes = SafeQuerier::query($conn, $sqlKey, $paramValArr);
    echo json_encode($safeRes);
} else {
    // No multiple-query requests are implemented, at least not at this point.
    echoErrorJSON("Unrecognized request type");
}

// The program exits here, which also closes $conn.

?>
