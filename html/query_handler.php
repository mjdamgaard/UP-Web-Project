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
switch ($reqType) {
    case "S":
        $sqlKey = "set";
        break;
    case "SInfo":
        $sqlKey = "setInfo";
        break;
    case "SInfoSK":
        $sqlKey = "setInfoSK";
        break;
    case "R":
        $sqlKey = "rating";
        break;
    case "CDef":
        $sqlKey = "catDef";
        break;
    case "ETDef":
        $sqlKey = "eTermDef";
        break;
    case "RDef":
        $sqlKey = "relDef";
        break;
    case "SCDefs":
        $sqlKey = "superCatDefs";
        break;
    case "T":
        $sqlKey = "text";
        break;
}
if ($sqlKey != "") {
    $paramNameArr = InputVarNamer::getQueryVarNames($sqlKey);
    $paramValArr = InputGetter::getParams($paramNameArr);
    $safeRes = SafeQuerier::query($conn, $sqlKey, $paramValArr);
    echo json_encode($safeRes);
} else {
    // No multiple-query requests are implemented, at least at this point.
    echoErrorJSON("Unrecognized request type");
}

// The program exits here, which also closes $conn.

?>
