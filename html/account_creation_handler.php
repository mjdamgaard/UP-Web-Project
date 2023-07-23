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


/* Getting the input */

// get the username and password.
$paramNameArr = array("n", "em", "pw");
$typeArr = array("username", "str", "password"); // TODO: Implement e-mail
// validation.
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);

// create the password hash.
$pwHash = password_hash($pw);


/* Trying to create a new user account */

// get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    $servername, $dbname, $username, $password
);

// prepare input MySQLi statement to create the new user.
$sql = "CALL createNewUser (?, ?, ?)";
$stmt = $conn->prepare($sql);
// execute input statement.
DBConnector::executeSuccessfulOrDie($stmt, array($u, $em, $pwHash));
// fetch the result as a numeric array.
$res = $stmt->get_result()->fetch_assoc();
// die with an error message if the user could not be created.
if ($res["exitCode"] != 0) {
    echoErrorJSONAndExit("User could not be created");
}


/* Creating a session ID for the new user account */

// prepare input MySQLi statement to create the session.
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


/* Output the results */

// add the session ID to $res.
$res["sesID"] = $sesID;
// finally echo the JSON-encoded result array (containing the new user ID, the
// session ID and the exitCode).
echo json_encode($res);

// The program exits here, which also closes $conn.

?>
