<?php

// This subprocedure assumes that userID is stored in $u and that the provided
// password is stored in $pw. It also assumed that $conn holds on open
// connection to the userDB.

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";


// prepare input MySQLi statement to get the correct password hash.
$sql = "SELECT pw_hash FROM UserCredentials WHERE user_id <=> ?";
$stmt = $conn->prepare($sql);
// execute the statement with $u as the input parameter.
DBConnector::executeSuccessfulOrDie($stmt, array($u));
// fetch the result as an associative array.
$res = $stmt->get_result()->fetch_assoc();

// verify the password.
if (!password_verify($pw, $res["pw_hash"])) {
    header("Content-Type: text/json");
    echoErrorJSONAndExit("Password was incorrect!");
}

?>
