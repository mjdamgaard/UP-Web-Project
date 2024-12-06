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
    echoBadErrorJSONAndExit(
        "Only the POST HTTP method is allowed for this request"
    );
}

if (empty($_POST)) {
    $_POST = json_decode(file_get_contents('php://input'), true);
}


// get the username and password.
$paramNameArr = array("n", "em", "pw");
$typeArr = array("username", "str", "password"); // TODO: Implement email valid.
// validation.
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
$n = $paramValArr[0];
$em = $paramValArr[1];
$pw = $paramValArr[2];


// get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
);

// try to create new user account and get the outID (user ID), sesIDHex (hexed
// session ID) and expTime (expiration time) on succuss and get the exitCode
// on failure.
$res = Authenticator::createNewAccount($conn, $n, $em, $pw);


// finally echo the JSON-encoded result array containing the exitCode, the
// outID (user ID), sesIDHex (hexed session ID) and expTime (expiration time).
header("Content-Type: text/json");
echo json_encode($res);

?>
