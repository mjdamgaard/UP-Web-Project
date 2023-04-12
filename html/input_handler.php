<?php

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";
require_once $db_io_path . "DBInputter.php";



// queries can also be GET-gotten.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echoErrorJSONAndExit("Only the POST HTTP method is allowed for inputs");
}


// authenticate the user and match with uid.
// TODO: Implement this such that user is actually authenticated!
;



// get request type.
if (!isset($_POST["type"])) {
    echoErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["type"];

// get connection.
$conn = DBConnector::getConnectionOrDie();

// match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sqlKey = "";
$paramNameArr = "";
switch ($reqType) {
    // case "RSK":
    case "R":
        $sqlKey = "rate";
        $paramNameArr = array(
            "uid", "sid", "rid",
            "oid",
            "r"
        );
        break;
    case "C":
        $sqlKey = "cat";
        $paramNameArr = array(
            "uid", "scid",
            "t"
        );
        break;
    case "E":
        $sqlKey = "eTerm";
        $paramNameArr = array(
            "uid", "cid",
            "t"
        );
        break;
    case "R":
        $sqlKey = "rel";
        $paramNameArr = array(
            "uid", "scid",
            "n"
        );
        break;
    case "T":
        $sqlKey = "text";
        $paramNameArr = array(
            "uid",
            "t"
        );
        break;
    case "B":
        $sqlKey = "binary";
        $paramNameArr = array(
            "uid",
            "b"
        );
        break;
}
if ($sqlKey != "") {
    $paramValArr = InputGetter::getParams($paramNameArr);
    $res = DBInputter::input($conn, $sqlKey, $paramValArr);
    header("Content-Type: text/json");
    echo json_encode($res);
} else {
    // No multiple-input requests are implemented yet. TODO: Implement some..
    header("Content-Type: text/json");
    echoErrorJSON("Unrecognized request type");
}

// The program exits here, which also closes $conn.

?>
