<?php

// This subprocedure assumes that the user IS ALREADY VERIFIED, that userID is
// stored in $u, and that $conn holds on open connection to the database.

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";



// prepare input MySQLi statement to create or update the session.
$sql = "CALL createOrUpdateSession (?, ?, ?)";
$stmt = $conn->prepare($sql);

// generate the session ID.
$sesID = random_bytes(50);
// generate the expiration date.
$expTime = strtotime("+14 days");

// execute input statement.
DBConnector::executeSuccessfulOrDie($stmt, array($u, $sesID, $expTime));
// fetch the result as a numeric array.
$res = $stmt->get_result()->fetch_assoc();


/* Output the results */

// add the userID, session ID and expiration time to $res.
$res["userID"] = $u;
$res["expTime"] = $expTime;
$res["expTime"] = $expTime;
// finally echo the JSON-encoded result array (containing the session ID and
// the exitCode).
header("Content-Type: text/json");
echo json_encode($res);

?>
