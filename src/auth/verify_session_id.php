<?php

// This subprocedure assumes that userID is stored in $u and that the provided
// session ID is stored in $sesID. It also assumed that $conn holds on open
// connection to the database.

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";


// prepare input MySQLi statement to get the correct password hash.
$sql = "SELECT session_id, expiration_time FROM Sessions WHERE user_id <=> ?";
$stmt = $conn->prepare($sql);
// execute the statement with $u as the input parameter.
DBConnector::executeSuccessfulOrDie($stmt, array($u));
// fetch the result as an associative array.
$res = $stmt->get_result()->fetch_assoc();

// check the expiration date and verify the session ID.
if ($res["expiration_time"] > strtotime("now")) {
    header("Content-Type: text/json");
    echoErrorJSONAndExit("Session has expired!");
}
if ($sesID != $res["session_id"])) {
    header("Content-Type: text/json");
    echoErrorJSONAndExit("Session ID was incorrect!");
}

?>
