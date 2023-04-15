<?php

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputVerifier.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";



// queries can also be GET-gotten.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}


// get request type.
if (!isset($_POST["type"])) {
    echoErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["type"];


// match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
$outputType = "";
switch ($reqType) {
    case "S":
        $sql = "CALL selectSet (?, ?, ?, ?, ?, ?)";
        $paramNameArr = array(
            "id",
            "rl", "rh",
            "n", "o",
            "a"
        );
        $typeArr = array(
            "setID",
            "bin", "bin",
            "uint", "uint",
            "tint"
        );
        $outputType = "array";
        // columns: ("ratVal", "objID"),
        break;
    case "SI":
        $sql = "CALL selectSetInfo (?)";
        $paramNameArr = array("id");
        $typeArr = array(
            "setID"
        );
        $outputType = "array";
        // columns: ("userID", "subjID", "relID", "elemNum"),
        break;
    case "SISK":
        $sql = "CALL selectSetInfoFromSecKey (?, ?, ?)";
        $paramNameArr = array("uid", "sid", "rid");
        $typeArr = array(
            "userOrGroupID", "termID", "relID"
        );
        $outputType = "array";
        // columns: ("setID", "elemNum"),
        break;
    case "R":
        $sql = "CALL selectRating (?, ?)";
        $paramNameArr = array("oid", "sid");
        $typeArr = array(
            "termID", "setID"
        );
        $outputType = "array";
        // columns: ("ratVal"),
        break;
    case "CD":
        $sql = "CALL selectCatDef (?)";
        $paramNameArr = array("id");
        $typeArr = array(
            "catID"
        );
        $outputType = "array";
        // columns: ("catTitle", "superCatID"),
        break;
    case "ED":
        $sql = "CALL selectETermDef (?)";
        $paramNameArr = array("id");
        $typeArr = array(
            "eTermID"
        );
        $outputType = "array";
        // columns: ("eTermTitle", "catID"),
        break;
    case "RD":
        $sql = "CALL selectRelDef (?)";
        $paramNameArr = array("id");
        $typeArr = array(
            "relID"
        );
        $outputType = "array";
        // columns: ("objNoun", "subjCatID"),
        break;
    case "SCD":
        $sql = "CALL selectSuperCatDefs (?)";
        $paramNameArr = array("id");
        $typeArr = array(
            "catID"
        );
        $outputType = "array";
        // columns: ("catTitle", "superCatID"),
        break;
    case "T":
        $sql = "CALL selectText (?)";
        $paramNameArr = array("id");
        $typeArr = array(
            "textID"
        );
        $outputType = "data";
        // columns: ("text"),
        break;
    case "B":
        $sql = "CALL selectBinary (?)";
        $paramNameArr = array("id");
        $typeArr = array(
            "binID"
        );
        $outputType = "data";
        // columns: ("binary"),
        break;
    default:
        header("Content-Type: text/json");
        echoErrorJSONAndExit("Unrecognized request type");
}

// get inputs.
$paramValArr = InputGetter::getParams($paramNameArr);
// verify inputs.
InputVerifier::verifyTypes($paramValArr, $typeArr, $paramNameArr);
// get connection.
$conn = DBConnector::getConnectionOrDie();
// prepare input MySQLi statement.
$stmt = $conn->prepare($sql);
// execute query statement.
DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
// fetch the result as a numric array if $outputType equals "array".
$res = $stmt->get_result();
if ($outputType == "array") {
    $res = $res->fetch_all();
// else if outputType equals "data", fetch the result as the data itself.
} else if ($outputType == "data") {
    $res = $res->fetch_row()[0];
}
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


// The program exits here, which also closes $conn.

?>
