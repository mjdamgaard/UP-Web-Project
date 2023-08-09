<?php

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputValidator.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";

$auth_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/auth/";
require_once $auth_path . "Authenticator.php";


if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echoBadErrorJSONAndExit("Only the POST HTTP method is allowed for inputs");
}

// TODO: In-comment.
// /* Verification of the session ID  */
//
// // get the userID and the session ID.
// $paramNameArr = array("u", "sidh");
// $typeArr = array("id", "session_id_hex");
// $paramValArr = InputGetter::getParams($paramNameArr);
// InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
// $userID = $paramValArr[0];
// $sesIDHex = $paramValArr[1];

// get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
);

// // authenticate the user by verifying the session ID.
// $sesID = hex2bin($sesIDHex);
// $res = Authenticator::verifySessionID($conn, $userID, $sesID);




/* Handling of the input request */

// get request type.
if (!isset($_POST["req"])) {
    echoBadErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["req"];


// match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
switch ($reqType) {
    case "rat":
        $sql = "CALL insertOrUpdateRating (?, ?, ?, ?, ?)";
        $paramNameArr = array("u", "c", "i", "r", "l");
        $typeArr = array("id", "id", "id", "rat", "unix_time");
        break;
    case "ent":
        $sql = "CALL insertOrFindEntity (?, ?, ?, ?, ?)";
        $paramNameArr = array("u", "r", "t", "c", "s");
        $typeArr = array("id", "tint", "id", "id", "str");
        break;
    case "tmpl":
        $sql = "CALL insertOrFindTemplate (?, ?, ?, ?)";
        $paramNameArr = array("u", "r", "c", "s");
        $typeArr = array("id", "tint", "id", "str");
        break;
    case "type":
        $sql = "CALL insertOrFindType (?, ?, ?)";
        $paramNameArr = array("u", "r", "s");
        $typeArr = array("id", "tint", "id", "id", "str");
        break;
    case "text":
        // $sql = "CALL insertText (?, ?, ?)";
        // $paramNameArr = array("u", "n", "s");
        // $typeArr = array("id", "str", "text");
        // break;
        echoErrorJSONAndExit('The "text" request type is not implemented yet');
    case "bin":
        // $sql = "CALL insertBinary (?, ?, ?)";
        // $paramNameArr = array("u", "n", "b");
        // $typeArr = array("id", "str", "blob");
        echoErrorJSONAndExit('The "bin" request type is not implemented yet');
        break;
    default:
        echoBadErrorJSONAndExit("Unrecognized request type");
}

// get inputs.
$paramValArr = InputGetter::getParams($paramNameArr);
// validate inputs.
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
// prepare input MySQLi statement.
$stmt = $conn->prepare($sql);
// execute statement.
DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
// fetch the result as an associative array.
$res = $stmt->get_result()->fetch_assoc();
// finally echo the JSON-encoded result array (containing outID and exitCode).
header("Content-Type: text/json");
echo json_encode($res);

// The program exits here, which also closes $conn.
?>
