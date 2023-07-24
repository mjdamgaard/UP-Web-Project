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


/* Validation of the session ID */

// get the userID and the session ID.
$paramNameArr = array("u", "sesID");
$typeArr = array("id", "any");
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);

// get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    $servername, $dbname, $username, $password
);

// authenticate the user by verifying the session ID (requires $u, $sesID and
// $conn, and sets/overwrites $sql, $stmt and $res).
$auth_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/auth/";
require $auth_path . "verify_session_id.php";



/* Destroying the session */

// prepare input MySQLi statement to create or update the session.
$sql = "DELETE FROM Sessions WHERE user_id <=> ?";
$stmt = $conn->prepare($sql);

// execute input statement.
DBConnector::executeSuccessfulOrDie($stmt, array($u));

// output array("exitCode"=>"0") on success (JSON-encoded).
$res = array("exitCode"=>"0");
echo json_encode($res);

// The program exits here, which also closes $conn.

?>
