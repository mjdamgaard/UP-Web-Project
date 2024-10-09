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



if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = array_map('urldecode', $_GET);
}


// TODO: Consider implementing some limits on the "n"s below (other than just
// the maximal int).. (Well, I *think* we will need to do this...)

// NOTE: When we want to implement queries for private information, which should
// then require a valid session ID, let us create a seperate query handler
// program for this (e.g. "private_query_handler.php").


/* Handling of the qeury request */

// Get request type.
if (!isset($_POST["req"])) {
    echoBadErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["req"];



// Some requests are protected.
if (
    $reqType === "entAsUser" ||
    $reqType === "entFromHashAsUser" ||
    $reqType === "prvCreations"
) {
    // Get the userID and the session ID.
    $paramNameArr = array("u", "ses");
    $typeArr = array("id", "session_id_hex");
    $paramValArr = InputGetter::getParams($paramNameArr);
    InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
    $userID = $paramValArr[0];
    $sesIDHex = $paramValArr[1];
    // // Then authenticate the user.
    // $sesID = hex2bin($sesIDHex);
    // Authenticator::verifySessionID($conn, $userID, $sesID);
    // TODO: Comment in again.
}



// Match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
switch ($reqType) {
    case "instList":
        header("Cache-Control: max-age=3");
        $sql = "CALL selectInstanceList (?, ?, ?, ?, ?, ?, ?)";
        $paramNameArr = array(
            "u", "t",
            "rl", "rh",
            "n", "o",
            "a"
        );
        $typeArr = array(
            "id", "id",
            "rat", "rat",
            "uint", "uint",
            "bool"
        );
        // output: [[ratVal, instID], ...].
        break;
    case "rat":
        header("Cache-Control: max-age=3");
        $sql = "CALL selectRating (?, ?, ?)";
        $paramNameArr = array("u", "t", "i");
        $typeArr = array("id", "id", "id");
        // output: [[ratVal]].
        break;
    case "recInputs":
        header("Cache-Control: max-age=3");
        $sql = "CALL selectRecordedInputs (?, ?)";
        $paramNameArr = array("id", "n");
        $typeArr = array("id", "uint");
        // output: [[userID, stmtID, ratVal], ...].
        break;
    case "recInputsSK":
        header("Cache-Control: max-age=3");
        $sql = "CALL selectRecordedInputsFromSecKey (?, ?, ?, ?)";
        $paramNameArr = array("s", "n", "o", "a");
        $typeArr = array("id", "uint", "uint", "tint");
        // output: [[ratID, userID, stmtID, ratVal], ...].
        break;
    case "recInputsMaxID":
        header("Cache-Control: max-age=3");
        $sql = "CALL selectRecordedInputsMaxID ()";
        $paramNameArr = array();
        $typeArr = array();
        // output: [[maxID]].
        break;
    /* Entity queries */
    case "ent":
        $sql = "CALL selectEntity (?, ?, ?)";
        $paramNameArr = array("id", "m", "s");
        $typeArr = array("id", "uint", "uint");
        // output: [[type, defStr, len, creatorID]].
        break;
    case "entAsUser":
        $sql = "CALL selectEntityAsUser (?, ?, ?, ?)";
        $paramNameArr = array("u", "id", "m", "s");
        $typeArr = array("id", "id", "uint", "uint");
        // output: [[type, defStr, len, creatorID, isPublic]].
        break;
    case "entFromHash":
        $sql = "CALL selectEntityFromHash (?, ?, ?, ?)";
        $paramNameArr = array("h", "c", "m", "s");
        $typeArr = array("hash", "id", "uint", "uint");
        // output: [[type, defStr, len]].
        break;
    case "entFromHashAsUser":
        $sql = "CALL selectEntityFromHashAsUser (?, ?, ?, ?)";
        $paramNameArr = array("h", "u", "m", "s");
        $typeArr = array("hash", "id", "uint", "uint");
        // output: [[type, defStr, len]].
        break;
    case "creations":
        $sql = "CALL selectCreations (?, ?, ?, ?)";
        $paramNameArr = array("c", "m", "o", "a");
        $typeArr = array("id", "uint", "uint", "bool");
        // output: [[ident, entID], ...].
        break;
    case "creationsAsUser":
        $sql = "CALL selectCreationsAsUser (?, ?, ?, ?)";
        $paramNameArr = array("u", "m", "o", "a");
        $typeArr = array("id", "uint", "uint", "bool");
        // output: [[ident, entID], ...].
        break;
    /* User data */
    // case "user":
    //     $sql = "CALL selectUserInfo (?)";
    //     $paramNameArr = array("id");
    //     $typeArr = array("id");
    //     // output: [[username, publicKeys]].
    //     break;
    // case "bot":
    //     $sql = "CALL selectBotInfo (?)";
    //     $paramNameArr = array("id");
    //     $typeArr = array("id");
    //     // output: [[botName, botDescription]].
    //     break;
    // case "userID":
    //     $sql = "CALL selectUserEntityID (?)";
    //     $paramNameArr = array("n");
    //     $typeArr = array("str");
    //     // output: [[entID]].
    //     break;
    // case "botID":
    //     $sql = "CALL selectBotEntityID (?)";
    //     $paramNameArr = array("n");
    //     $typeArr = array("str");
    //     // output: [[entID]].
    //     break;
    // case "ancBotData1e2d":
    //     $sql = "CALL selectAncillaryBotData1e2d (?, ?)";
    //     $paramNameArr = array("n", "e");
    //     $typeArr = array("str", "id");
    //     // output: [[data1, data2]].
    //     break;
    // case "ancBotData1e4d":
    //     $sql = "CALL selectAncillaryBotData1e4d (?, ?)";
    //     $paramNameArr = array("n", "e");
    //     $typeArr = array("str", "id");
    //     // output: [[data1, data2, data3, data4]].
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
$res = $stmt->get_result()->fetch_all();

// Finally echo the JSON-encoded numeric array, containing e.g. the
// columns: ("ratVal", "instID") for $reqType == "set", etc., so look at
// the comments above for what the resulting arrays will contain.
header("Content-Type: text/json");
echo json_encode($res);

// The program exits here, which also closes $conn.
?>
