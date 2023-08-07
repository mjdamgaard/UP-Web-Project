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
$sesID = random_bytes(60);
// generate the expiration date.
$expTime = strtotime("+2 months");
// append these to $res.
//     $res = array();
// $res["sesID"] = $sesID;
// $res["expTime"] = $expTime;
$res = array("sesID"=>$sesID, "expTime"=>$expTime);
throw new Exception(">>>" . json_encode($sesID) . "<<<");

// execute input statement.
DBConnector::executeSuccessfulOrDie($stmt, array($u, $sesID, $expTime));

?>
