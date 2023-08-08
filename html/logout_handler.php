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
    echoErrorJSONAndExit(
        "Only the POST HTTP method is allowed for this request"
    );
}


// get the userID and the session ID.
$paramNameArr = array("u", "s");
$typeArr = array("id", "session_id_hex");
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
$userID = $paramValArr[0];
$sesIDHex = $paramValArr[1];

// get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    $servername, $dbname, $username, $password
);

// authenticate the user by verifying the session ID.
$sesID = hex2bin($sesIDHex);
Authenticator::verifySessionID($conn, $userID, $sesID);


// prepare input MySQLi statement to destroy the session.
$sql = "DELETE FROM Sessions WHERE user_id <=> ?";
$stmt = $conn->prepare($sql);

// execute that statement.
DBConnector::executeSuccessfulOrDie($stmt, array($userID));

// output array("exitCode"=>"0") on success (JSON-encoded).
header("Content-Type: text/json");
echo json_encode(array("exitCode"=>"0"));

?>
