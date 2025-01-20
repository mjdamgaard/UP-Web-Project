<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
// header("Cache-Control: max-age=3");

// TODO: Set a higher "Cache-Control: max-age" than the ones below, and make
// the application control when requests need to have "Cache-Control: no-cache"
// when expecting changes (such as when the user has just submitted an input).

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputValidator.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/db_io/";
require_once $db_io_path . "DBConnector.php";

$auth_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/auth/";
require_once $auth_path . "Authenticator.php";



// if ($_SERVER["REQUEST_METHOD"] != "POST") {
//     $_POST = array_map('urldecode', $_GET);
// }

// if (empty($_POST)) {
//     $_POST = json_decode(file_get_contents('php://input'), true);
// }


if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echoBadErrorJSONAndExit("Only the POST HTTP method is allowed for queries");
}

if (empty($_POST)) {
    $_POST = json_decode(file_get_contents('php://input'), true);
}

/* Verification of the session ID  */

// Get the userID and the session ID.
$paramNameArr = array("u", "ses");
$typeArr = array("id", "session_id_hex");
$paramValArr = InputGetter::getParams($paramNameArr);
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
$userID = $paramValArr[0];
$sesIDHex = $paramValArr[1];

// Get connection to the database.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
);

// // Authenticate the user by verifying the session ID.
// $sesID = hex2bin($sesIDHex);
// $res = Authenticator::verifySessionID($conn, $userID, $sesID);
// TODO: Comment in again.




/* Handling of the query request */

// Get request type.
if (!isset($_POST["req"])) {
    echoBadErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["req"];



// Match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
switch ($reqType) {
    /* Scores */
    case "entList":
        header("Cache-Control: max-age=3"); // TODO: Change/adjust.
        $sql = "CALL selectEntityList (?, ?, ?, ?, ?, ?, ?)";
        $paramNameArr = array(
            "u", "d", "w",
            "hi", "lo",
            "n", "o",
            "a",
            "f", "d"
        );
        $typeArr = array(
            "id", "id", "id",
            "float", "float",
            "uint", "uint",
            "bool",
            "bool", "bool"
        );
        // output: [
        //   [[tagName | null, outID, exitCode]], ...
        //   [( [score1, subjID] | [score1, score2, subjID] ), ...]
        // ].
        break;
    case "score":
        header("Cache-Control: max-age=3"); // TODO: Change/adjust.
        $sql = "CALL selectPublicScore (?, ?, ?)";
        $paramNameArr = array("u", "d", "w", "s");
        $typeArr = array("id", "id", "id", "id");
        // output: [
        //   [[tagName | null, outID, exitCode]], ...
        //   [[score1, score2, otherDataHex]]
        // ].
        break;
    /* Entities */
    case "ent":
        $sql = "CALL selectEntity (?, ?, ?, ?)";
        $paramNameArr = array("u", "e", "m", "s");
        $typeArr = array("id", "id", "uint", "uint");
        // output: [[
        //  [entType, defStr, len, creatorID, isEditable, readerWhitelistID] |
        //  [null, exitCode]
        // ]].
        break;
    case "entRec":
        $sql = "CALL selectEntityRecursively (?, ?, ?, ?, ?)";
        $paramNameArr = array("u", "id", "m", "i", "l");
        $typeArr = array("id", "id", "uint", "rec_instr_list", "utint");
        // output: [[
        //  [entType, defStr, len, creatorID, isEditable, readerWhitelistID] |
        //  [null, exitCode]
        // ], ...].
        break;
    case "entIDFromSK":
        $sql = "CALL selectEntityIDFromSecKey (?, ?, ?, ?)";
        $paramNameArr = array("u", "t", "w", "d");
        $typeArr = array("id", "char", "id", "str");
        // output: [[[entID]]].
        break;
    case "regEnt":
        $sql = "CALL parseAndObtainRegularEntity (?, ?, ?, ?)";
        $paramNameArr = array("u", "t", "w", "d");
        $typeArr = array("id", "char", "id", "str");
        // output: [
        //   [[tagName | null, outID, exitCode]], ...
        // ].
        break;
    // case "entFromSK":
    //     $sql = "CALL selectEntityFromSecKey (?, ?, ?, ?)";
    //     $paramNameArr = array("u", "t", "w", "d");
    //     $typeArr = array("id", "char", "id", "str");
    //     // output: [[entID, creatorID, editableUntil]].
    //     break;
    /* User data */
    // case "user":
    //     $sql = "CALL selectUserInfo (?)";
    //     $paramNameArr = array("id");
    //     $typeArr = array("id");
    //     // output: [[username, publicKeys]].
    //     break;
    default:
        echoBadErrorJSONAndExit("Unrecognized request type");
}

// Get inputs.
$paramValArr = InputGetter::getParams($paramNameArr);
// Validate inputs.
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
// Get connection.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
);
// Prepare input MySQLi statement.
$stmt = $conn->prepare($sql);
// Execute query statement.
DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
// Fetch the result as a numeric array.
$res = array($stmt->get_result()->fetch_all());
// If there are more results, return instead an array of all the results.
while ($stmt->next_result()) {
    array_push($res, $stmt->get_result()->fetch_all());
}

// Finally echo the JSON-encoded numeric array, containing e.g. the
// columns: ("ratVal", "instID") for $reqType == "set", etc., so look at
// the comments above for what the resulting arrays will contain.
header("Content-Type: text/json");
echo json_encode($res);

// The program exits here, which also closes $conn.
?>
