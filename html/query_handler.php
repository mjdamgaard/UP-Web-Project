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
    $_POST = $_GET;
}


// get request type.
if (!isset($_POST["type"])) {
    echoErrorJSONAndExit("No request type specified");
}
$reqType = $_POST["type"];


// TODO: Also implement some limits on the "n"s below (other than just the
// maximal int).. (Well, I *think* I need to do this..) ..But it will surely
// have to wait until after/during when I implement authentication and such..

// match $reqType against any of the following single-query request types
// and execute the corresponding query if a match is found.
$sql = "";
$paramNameArr = "";
$typeArr = "";
switch ($reqType) {
    case "set":
        $sql = "CALL selectInputSet (?, ?, ?, ?, ?, ?, ?, ?)";
        $paramNameArr = array(
            "uid", "pid", "st",
            "rl", "rh",
            "n", "o",
            "a"
        );
        $typeArr = array(
            "id", "id", "type",
            "rat", "rat",
            "uint", "uint",
            "tint"
        );
        // output: [[ratVal, subjID], ...].
        break;
    case "rat":
        $sql = "CALL selectRating (?, ?)";
        $paramNameArr = array("st", "sid", "pid", "uid");
        $typeArr = array("type", "id", "id", "id");
        // output: [[ratVal]].
        break;
    case "userRats":
        $sql = "CALL selectUsersAndRatings (?, ?)";
        $paramNameArr = array("st", "sid", "pid", "uid", "n", "o");
        $typeArr = array("type", "id", "id", "id", "uint", "unit");
        // output: [[userID, ratVal], ...].
        break;
    case "recentInputs":
        $sql = "CALL selectRecentInputs (?, ?)";
        $paramNameArr = array("id", "n");
        $typeArr = array("id", "uint");
        // output: [[userID, predID, subjType, ratVal, subjID, changedAt], ...].
        break;
    case "recordedtInputs":
        $sql = "CALL selectRecordedInputs (?, ?, ?, ?, ?, ?)";
        $paramNameArr = array("uid", "pid", "st", "sid", "n", "o");
        $typeArr = array("id", "id", "type", "id", "uint", "uint");
        // output: [[subjID, changedAt, ratVal], ...].
        break;
    case "user":
        $sql = "CALL selectUserInfo (?, ?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[username, publicKeys]].
        break;
    case "cxt":
        $sql = "CALL selectContext (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[parentCxtID, title]].
        break;
    case "term":
        $sql = "CALL selectTerm (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[cxtID, title, specType, specID]].
        break;
    case "cxtID":
        $sql = "CALL selectContextID (?, ?)";
        $paramNameArr = array("pid", "s");
        $typeArr = array("id", "tstr");
        // output: [[cxtID]].
        break;
    case "termID":
        $sql = "CALL selectTermID (?, ?, ?, ?)";
        $paramNameArr = array("cid", "spt", "spid", "t");
        $typeArr = array("id", "type", "id", "tstr");
        // output: [[termID]].
        break;
    case "cxtIDs":
        $sql = "CALL selectContextIDs (?, ?, ?, ?)";
        $paramNameArr = array("pid", "s", "n", "o");
        $typeArr = array("id", "tstr", "uint", "uint");
        // output: [[title, cxtID], ...].
        break;
    case "termIDs":
        $sql = "CALL selectTermIDs (?, ?, ?, ?, ?, ?)";
        $paramNameArr = array("cid", "st", "sid", "s", "n", "o");
        $typeArr = array("id", "type", "id", "tstr", "uint", "uint");
        // output: [[title, termID], ...].
        break;
    case "list":
        $sql = "CALL selectList (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[elemTypeStr, elemIDHexStr, tailID]].
        break;
    case "listID":
        $sql = "CALL selectListID (?, ?, ?)";
        $paramNameArr = array("ts", "ids", "tid");
        $typeArr = array("elemTypeStr", "elemIDHexStr", "id");
        // output: [[listID]].
        break;
    case "kws":
        $sql = "CALL searchForKeywordStrings (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "uint", "uint");
        // output: [[str, kwsID], ...].
        break;
    case "kwsB":
        $sql = "CALL searchForKeywordStringsBooleanMode (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "uint", "uint");
        // output: [[str, kwsID], ...].
        break;
    case "kwsIDs":
        $sql = "CALL selectKeywordStringIDs (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "uint", "uint");
        // output: [[str, kwsID], ...].
        break;
    case "text":
        $sql = "CALL selectText (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[text]].
        break;
    case "bin":
        $sql = "CALL selectBinary (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[bin]].
        break;
    case "creator":
        $sql = "CALL selectCreator (?, ?)";
        $paramNameArr = array("t", "id");
        $typeArr = array("type", "id");
        // output: [[userID]].
        break;
    case "creations":
        $sql = "CALL selectCreations (?, ?, ?, ?, ?)";
        $paramNameArr = array("id", "t", "n", "o", "a");
        $typeArr = array("id", "type", "uint", "uint", "tint");
        // output: [[entityType, entityID], ...].
        break;
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
// columns: ("ratVal", "objID") for $reqType == "S", etc., so look at
// the comments above for what the resulting arrays will contain.
echo json_encode($res);

// The program exits here, which also closes $conn.

?>
