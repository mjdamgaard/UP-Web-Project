<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Cache-Control: max-age=3");

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputValidator.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/db_io/";
require_once $db_io_path . "DBConnector.php";

$auth_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/auth/";
require_once $auth_path . "Authenticator.php";


if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echoBadErrorJSONAndExit("Only the POST HTTP method is allowed for inputs");
}


/* Verification of the session ID  */

// Get the userID and the session ID.
$paramNameArr = array("u", "ses");
$typeArr = array("id", "session_id_hex");
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
$userID = $paramValArr[0];
$sesIDHex = $paramValArr[1];

// Get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
);

// // Authenticate the user by verifying the session ID.
// $sesID = hex2bin($sesIDHex);
// $res = Authenticator::verifySessionID($conn, $userID, $sesID);
// TODO: Comment in again.




/* Handling of the input request */

// Get request type.
if (!isset($_POST["req"])) {
    echoBadErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["req"];


// Match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
switch ($reqType) {
    case "score":
        $sql = "CALL insertOrUpdateScore (?, ?, ?, ?)";
        $paramNameArr = array("u", "s", "e", "v");
        $typeArr = array("id", "id", "id", "float");
        break;
    case "delScore":
        $sql = "CALL deleteScore (?, ?, ?)";
        $paramNameArr = array("u", "s", "e");
        $typeArr = array("id", "id", "id");
        break;
    case "ent":
        $sql = "CALL insertOrFindEntity (?, ?, ?, ?, ?, ?, ?)";
        $paramNameArr = array("u", "t", "d", "prv", "ed", "a", "h");
        $typeArr = array(
            "id", "char", "text", "bool", "bool", "bool", "bool"
        );
        break;
    case "editEnt":
        $sql = "CALL editOrFindEntity (?, ?, ?, ?, ?, ?, ?, ?)";
        $paramNameArr = array("u", "e", "t", "d", "prv", "ed", "a", "h");
        $typeArr = array(
            "id", "id", "char", "text", "bool", "bool", "bool", "bool"
        );
        break;
    default:
        echoBadErrorJSONAndExit("Unrecognized request type");
}

// Get inputs.
$paramValArr = InputGetter::getParams($paramNameArr);
// Validate inputs.
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
// Prepare input MySQLi statement.
$stmt = $conn->prepare($sql);
// Execute statement.
DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
// Fetch the result as an associative array.
$res = $stmt->get_result()->fetch_assoc();
// Finally echo the JSON-encoded result array (containing outID and exitCode).
header("Content-Type: text/json");
echo json_encode($res);

// The program exits here, which also closes $conn.
?>
