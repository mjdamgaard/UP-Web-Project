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
    echoErrorJSONAndExit(
        "Only the POST HTTP method is allowed for this request"
    );
}


/* Getting password and either username or user ID */

// get the userID and the password.
$paramNameArr = array("u", "pw");
$paramValArr = InputGetter::getParams($paramNameArr);
$u = $paramValArr[0];
$pw = $paramValArr[1];


/* Getting the user ID if a username was provided */

// get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    $servername, $dbname, $username, $password
);

if (!preg_match("/^[1-9][0-9]*$/", $u)) {
    InputValidator::validateParam($u, "username", "u");

    // TODO: Look up the ID and overwrite it to $u. Handle if user ID lookup
    // failed.

    $paramValArr[0] = $u;
}

$typeArr = array("id", "str");
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);



/* Verification of the password */

// authenticate the user by verifying the password (requires $u, $pw and $conn,
// and sets/overwrites $sql, $stmt and $res).
$auth_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/auth/";
require $auth_path . "verify_password.php";


/* Creating or updating the session and outputting the sesID and expTime */

require $auth_path . "create_or_update_session.php";

// The program exits here, which also closes $conn.

?>
