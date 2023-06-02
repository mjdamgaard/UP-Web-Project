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
    case "rat":
        $sql = "CALL inputOrChangeRating (?, ?, ?, ?, ?, ?)";
        $paramNameArr = array("uid", "pid", "st", "sid", "r", "l");
        $typeArr = array("id", "id", "type", "id", "rat", "datetime");
        break;
    case "cxt":
        // $sql = "CALL insertOrFindCat (?, ?, ?)";
        $sql = "CALL insertOrFindContext (?, ?, ?)";
        $paramNameArr = array("uid", "pid", "t");
        $typeArr = array("id", "id", "tstr");
        break;
    case "term":
        $sql = "CALL insertOrFindTerm (?, ?, ?, ?, ?)";
        $paramNameArr = array("uid", "cid", "t", "spt", "spid");
        $typeArr = array("id", "id", "tstr", "type", "id");
        break;
    case "list":
        $sql = "CALL insertOrFindList (?, ?, ?, ?)";
        $paramNameArr = array("uid", "ts", "ids", "tid");
        $typeArr = array("id", "elemTypeStr", "elemIDHexStr", "id");
        break;
    case "kws":
        $sql = "CALL insertOrFindKeywordString (?, ?)";
        $paramNameArr = array("uid", "s");
        $typeArr = array("id", "str");
        break;
    case "text":
        $sql = "CALL insertText (?, ?)";
        $paramNameArr = array("uid", "s");
        $typeArr = array("id", "text");
        break;
    case "bin":
        $sql = "CALL insertBinary (?, ?)";
        $paramNameArr = array("uid", "b");
        $typeArr = array("id", "blob");
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
// fetch the result as a numeric array.
$res = $stmt->get_result()->fetch_assoc();
// set the Content-Type header to json.
header("Content-Type: text/json");
// finally echo the JSON-encoded result array (containing outID and exitCode).
echo json_encode($res);


// The program exits here, which also closes $conn.

?>
