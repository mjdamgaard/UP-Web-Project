<?php

header("Access-Control-Allow-Origin: http://localhost:8080");
header("Cache-Control: max-age=3");

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputValidator.php";

$auth_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/auth/";
require_once $auth_path . "Authenticator.php";


if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}

if (empty($_POST)) {
    $_POST = json_decode(file_get_contents('php://input'), true);
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

// Authenticate the user by verifying the session ID.
$sesID = hex2bin($sesIDHex);
$res = Authenticator::verifySessionID($conn, $userID, $sesID);

http_response_code(200);

?>
