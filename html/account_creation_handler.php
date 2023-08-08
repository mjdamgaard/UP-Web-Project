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


// get the username and password.
$paramNameArr = array("n", "em", "pw");
$typeArr = array("username", "str", "password"); // TODO: Implement email valid.
// validation.
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
$n = $paramValArr[0];
$em = $paramValArr[1];
$pw = $paramValArr[2];

// compute the password hash.
$pwHash = password_hash($pw,  PASSWORD_DEFAULT);


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
