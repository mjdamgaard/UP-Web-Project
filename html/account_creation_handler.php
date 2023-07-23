<?php

header("Content-Type: text/json");

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputValidator.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";



if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echoErrorJSONAndExit("Only the POST HTTP method is allowed for inputs");
}


/* Validation of the password */

// get the username and password.
$paramNameArr = array("n", "em", "pw");
$typeArr = array("username", "str", "password"); // TODO: Implement e-mail
// validation.
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);

// // get connection to the userDB.
// require $db_io_path . "userdb_config.php";
// $conn = DBConnector::getConnectionOrDie(
//     $servername, $dbname, $username, $password
// );



?>
