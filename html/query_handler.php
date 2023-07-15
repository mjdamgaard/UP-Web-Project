<?php

header("Content-Type: text/json");

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputVerifier.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";



// queries can also be GET-gotten.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = array_map('urldecode', $_GET);
}


// get request type.
if (!isset($_POST["type"])) {
    echoErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["type"];


// TODO: Also implement some limits on the "n"s below (other than just the
// maximal int).. (Well, I *think* we will need to do this...)

// match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
switch ($reqType) {
    case "set":
        $sql = "CALL selectInputSet (?, ?, ?, ?, ?, ?, ?)";
        $paramNameArr = array(
            "u", "p",
            "rl", "rh",
            "n", "o",
            "a"
        );
        $typeArr = array(
            "id", "id",
            "ushort", "ushort",
            "uint", "uint",
            "tint"
        );
        // output: [[ratVal, subjID], ...].
        break;
    case "rat":
        $sql = "CALL selectRating (?, ?, ?)";
        $paramNameArr = array("u", "p", "s");
        $typeArr = array("id", "id", "id");
        // output: [[ratVal]].
        break;
    case "recentInputs":
        $sql = "CALL selectRecentInputs (?, ?)";
        $paramNameArr = array("id", "n");
        $typeArr = array("id", "uint");
        // output: [[userID, predID, ratVal, subjID, changedAt], ...].
        break;
    case "ent":
        $sql = "CALL selectEntity (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[type, tmplID, defStr]].
        break;
    case "entID":
        $sql = "CALL selectEntityID (?, ?, ?)";
        $paramNameArr = array("ty", "tm", "s");
        $typeArr = array("type", "id", "str");
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
        header("Content-Type: text/json");
        echoErrorJSONAndExit("Unrecognized request type");
}

// get inputs.
$paramValArr = InputGetter::getParams($paramNameArr);
// verify inputs.
InputVerifier::verifyTypes($paramValArr, $typeArr, $paramNameArr);
// get connection.
$conn = DBConnector::getConnectionOrDie();
// prepare input MySQLi statement.
$stmt = $conn->prepare($sql);
// execute query statement.
DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
// fetch the result as a numeric array.
$res = $stmt->get_result()->fetch_all();
// finally echo the JSON-encoded numeric array, containing e.g. the
// columns: ("ratVal", "subjID") for $reqType == "set", etc., so look at
// the comments above for what the resulting arrays will contain.
echo json_encode($res);

// The program exits here, which also closes $conn.

?>
