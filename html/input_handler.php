<?php

header("Content-Type: text/json");

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputVerifier.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";



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


// match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
switch ($reqType) {
    // case "RSK":
    case "R":
        $sql = "CALL inputOrChangeRating (?, ?, ?, ?, @ec)";
        $paramNameArr = array(
            "uid", "sid", "rid",
            "oid",
            "r"
        );
        $typeArr = array(
            "userID", "termID", "relID",
            "termID",
            "bin"
        );
        break;
    case "C":
        $sql = "CALL insertOrFindCat (?, ?, ?, @outID, @ec)";
        $paramNameArr = array(
            "uid", "scid",
            "t"
        );
        $typeArr = array(
            "userID", "catID",
            "str"
        );
        break;
    case "E":
        $sql = "CALL insertOrFindETerm (?, ?, ?, @outID, @ec)";
        $paramNameArr = array(
            "uid", "cid",
            "t"
        );
        $typeArr = array(
            "userID", "catID",
            "str"
        );
        break;
    case "R":
        $sql = "CALL insertOrFindRel (?, ?, ?, @outID, @ec)";
        $paramNameArr = array(
            "uid", "scid",
            "n"
        );
        $typeArr = array(
            "userID", "catID",
            "str"
        );
        break;
    case "T":
        $sql = "CALL insertText (?, ?, @outID, @ec)";
        $paramNameArr = array(
            "uid",
            "t"
        );
        $typeArr = array(
            "userID",
            "text"
        );
        break;
    case "B":
        $sql = "CALL insertBinary (?, ?, @outID, @ec)";
        $paramNameArr = array(
            "uid",
            "b"
        );
        $typeArr = array(
            "userID",
            "blob"
        );
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
// execute input statement.
DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
// prepare statement to select outID and exitCode.
$stmt = $conn->prepare("SELECT @outID AS outID, @ec AS exitCode");
// execute this select statement.
DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
// fetch the result as a numeric array.
$res = $stmt->get_result()->fetch_all();
// set the Content-Type header to json.
header("Content-Type: text/json");
// finally echo the JSON-encoded result array (containing outID and exitCode).
echo json_encode($res);


// The program exits here, which also closes $conn.

?>
