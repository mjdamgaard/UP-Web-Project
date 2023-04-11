<?php

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";
require_once $db_io_path . "DBQuerier.php";



// queries can also be GET-gotten.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}


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
    case "S":
        $sqlKey = "set";
        $paramNameArr = array(
            "id",
            "rl", "rh",
            "n", "o",
            "a"
        );
        // columns: ("ratVal", "objID"),
        break;
    case "SI":
        $sqlKey = "setInfo";
        $paramNameArr = array("id");
        // columns: ("userID", "subjID", "relID", "elemNum"),
        break;
    case "SISK":
        $sqlKey = "setInfoSK";
        $paramNameArr = array("uid", "sid", "rid");
        // columns: ("setID", "elemNum"),
        break;
    case "R":
        $sqlKey = "rating";
        $paramNameArr = array("oid", "sid");
        // columns: ("ratVal"),
        break;
    case "CD":
        $sqlKey = "catDef";
        $paramNameArr = array("id");
        // columns: ("catTitle", "superCatID"),
        break;
    case "ED":
        $sqlKey = "eTermDef";
        $paramNameArr = array("id");
        // columns: ("eTermTitle", "catID"),
        break;
    case "RD":
        $sqlKey = "relDef";
        $paramNameArr = array("id");
        // columns: ("objNoun", "subjCatID"),
        break;
    case "SCD":
        $sqlKey = "superCatDefs";
        $paramNameArr = array("id");
        // columns: ("catTitle", "superCatID"),
        break;
    case "T":
        $sqlKey = "text";
        $paramNameArr = array("id");
        // columns: ("text"),
        break;
    case "B":
        $sqlKey = "binary";
        $paramNameArr = array("id");
        // columns: ("binary"),
        break;
}
if ($sqlKey != "") {
    // query the database and get result.
    $paramValArr = InputGetter::getParams($paramNameArr);
    $res = DBQuerier::query($conn, $sqlKey, $paramValArr);
    // set the "Content-Type" HTTP header and echo the (perhaps JSON-encoded)
    // query result according to the request type.
    switch ($reqType) {
        case "S":
        case "SI":
        case "SISK":
        case "R":
        case "CD":
        case "ED":
        case "RD":
        case "SCD":
            header("Content-Type: text/json");
            echo json_encode($res);
            break;
        case "T":
            header("Content-Type: text/plain");
            echo $res;
            break;
        case "B":
            header("Content-Type: application/octet-stream");
            echo $res;
            break;
    }

} else {
    // No multiple-query requests are implemented, at least not at this point.
    echoErrorJSON("Unrecognized request type");
}

// The program exits here, which also closes $conn.

?>
