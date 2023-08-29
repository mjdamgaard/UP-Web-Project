<?php

// TODO: Set a higher "Cache-Control: max-age" than the ones below, and make
// the application control when requests need to have "Cache-Control: no-cache"
// when expecting changes (such as when the user has just submitted an input).

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../php_src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../php_src/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputValidator.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../php_src/db_io/";
require_once $db_io_path . "DBConnector.php";

$auth_path = $_SERVER['DOCUMENT_ROOT'] . "/../php_src/auth/";
require_once $auth_path . "Authenticator.php";



// queries can also be GET-gotten.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = array_map('urldecode', $_GET);
}


// TODO: Consider implementing some limits on the "n"s below (other than just
// the maximal int).. (Well, I *think* we will need to do this...)

// NOTE: When we want to implement queries for private information, which should
// then require a valid session ID, let us create a seperate query handler
// program for this (e.g. "private_query_handler.php").


/* Handling of the qeury request */

// get request type.
if (!isset($_POST["req"])) {
    echoBadErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["req"];


// match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
switch ($reqType) {
    case "set":
        header("Cache-Control: max-age=3");
        $sql = "CALL selectInputSet (?, ?, ?, ?, ?, ?, ?)";
        $paramNameArr = array(
            "u", "c",
            "rl", "rh",
            "n", "o",
            "a"
        );
        $typeArr = array(
            "id", "id",
            "rat", "rat",
            "uint", "uint",
            "tint"
        );
        // output: [[ratVal, instID], ...].
        break;
    case "rat":
        header("Cache-Control: max-age=3");
        $sql = "CALL selectRating (?, ?, ?)";
        $paramNameArr = array("u", "c", "i");
        $typeArr = array("id", "id", "id");
        // output: [[ratVal]].
        break;
    case "recentInputs":
        header("Cache-Control: max-age=3");
        $sql = "CALL selectRecentInputs (?, ?)";
        $paramNameArr = array("id", "n");
        $typeArr = array("id", "uint");
        // output: [[userID, catID, ratVal, instID, changedAt], ...].
        break;
    case "ent":
        $sql = "CALL selectEntity (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[typeID, cxtID, defStr]].
        break;
    case "entID":
        $sql = "CALL selectEntityID (?, ?, ?)";
        $paramNameArr = array("t", "c", "s");
        $typeArr = array("id", "id", "str");
        // output: [[entID]].
        break;
    case "username":
        $sql = "CALL selectUsername (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[username]].
        break;
    case "userInfo":
        $sql = "CALL selectUserInfo (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[username, publicKeys]].
        break;
    case "userID":
        $sql = "CALL selectUserID (?)";
        $paramNameArr = array("n");
        $typeArr = array("username");
        // output: [[userID]].
        break;
    case "text":
        $sql = "CALL selectText (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[text]].
        break;
    case "textSub":
        $sql = "CALL selectTextSubstring (?, ?, ?)";
        $paramNameArr = array("id", "l", "s");
        $typeArr = array("id", "ushort", "int");
        // output: [[text]].
        break;
    case "bin":
        $sql = "CALL selectBinary (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[bin]].
        break;
    case "binSub":
        $sql = "CALL selectBinarySubstring (?, ?, ?)";
        $paramNameArr = array("id", "l", "s");
        $typeArr = array("id", "ushort", "int");
        // output: [[bin]].
        break;
    // case "creator":
    //     $sql = "CALL selectCreator (?, ?)";
    //     $paramNameArr = array("t", "id");
    //     $typeArr = array("type", "id");
    //     // output: [[userID]].
    //     break;
    // case "creations":
    //     $sql = "CALL selectCreations (?, ?, ?, ?, ?)";
    //     $paramNameArr = array("id", "t", "n", "o", "a");
    //     $typeArr = array("id", "type", "uint", "uint", "tint");
    //     // output: [[entityType, entityID], ...].
    //     break;
    default:
        echoBadErrorJSONAndExit("Unrecognized request type");
}

// get inputs.
$paramValArr = InputGetter::getParams($paramNameArr);
// validate inputs.
InputValidator::validateParams($paramValArr, $typeArr, $paramNameArr);
// get connection.
require $db_io_path . "sdb_config.php";
$conn = DBConnector::getConnectionOrDie(
    DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
);
// prepare input MySQLi statement.
$stmt = $conn->prepare($sql);
// execute query statement.
DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
// fetch the result as a numeric array.
$res = $stmt->get_result()->fetch_all();
// finally echo the JSON-encoded numeric array, containing e.g. the
// columns: ("ratVal", "instID") for $reqType == "set", etc., so look at
// the comments above for what the resulting arrays will contain.
header("Content-Type: text/json");
echo json_encode($res);

// The program exits here, which also closes $conn.
?>
