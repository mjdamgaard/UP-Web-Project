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

// get the userID and the password.
$paramNameArr = array("u", "pw");
$typeArr = array("id", "str");
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);

// get connection to the userDB.
require $db_io_path . "userdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    $servername, $dbname, $username, $password
);

// authenticate the user by verifying the password (requires $u, $pw and $conn,
// and sets/overwrites $sql, $stmt and $res).
$auth_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/auth/";
require $auth_path . "verify_password.php";


/* Creating or updating the session */

// prepare input MySQLi statement to create or update the session.
$sql = "CALL createOrUpdateSession (?, ?, ?)";
$stmt = $conn->prepare($sql);

// generate the session ID.
$sesID = random_bytes(50);
// generate the expiration date.
$expDate = date("Y-m-d", strtotime("+14 days"));

// execute input statement.
DBConnector::executeSuccessfulOrDie($stmt, array($u, $sesID, $expDate));
// fetch the result as a numeric array.
$res = $stmt->get_result()->fetch_assoc();
// finally echo the JSON-encoded result array (containing the exitCode).
echo json_encode($res);

// The program exits here, which also closes $conn.

?>
