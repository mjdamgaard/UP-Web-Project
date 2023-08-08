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


// get the userID and the password.
$paramNameArr = array("u", "pw");
$paramValArr = InputGetter::getParams($paramNameArr);
$u = $paramValArr[0];
$pw = $paramValArr[1];


// get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
);

// get the user ID if a username was provided.
if (!preg_match("/^[1-9][0-9]*$/", $u)) {
    // first type check the username.
    InputValidator::validateParam($u, "username", "u");
    // prepare statement to get the user ID.
    $sql = "CALL selectUserID (?)";
    $stmt = $conn->prepare($sql);
    // execute the statement with $u as the input parameter.
    DBConnector::executeSuccessfulOrDie($stmt, array($u));
    // fetch the result as an associative array.
    $res = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    // if the user does not exist, die with an error.
    if (is_null($res)) {
        echoErrorJSONAndExit("Username does not exist");
    }
    // overwrite the $u and $paramValArr[0] with the userID.
    $paramValArr[0] = $u = $res["userID"];
}

// validate types and rename $u as $userID now that can only hold that.
$typeArr = array("id", "str");
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
$userID = $u;


// verify password, login, and get the sesIDHex and expTime.
$res = Authenticator::login($conn, $userID, $pw);

// finally echo the JSON-encoded result containing the expTime (expiration time)
// and sesIDHex (hex string of the session ID).
header("Content-Type: text/json");
echo json_encode($res);

?>
