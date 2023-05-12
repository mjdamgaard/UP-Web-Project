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
        $sql = "CALL selectSet (?, ?, ?, ?, ?, ?)";
        $paramNameArr = array(
            "id",
            "rl", "rh",
            "n", "o",
            "a"
        );
        $typeArr = array(
            "id",
            "tvarbinhex", "tvarbinhex",
            "uint", "uint",
            "tint"
        );
        // output: [[ratVal, objID], ...].
        break;
    case "setInfo":
        $sql = "CALL selectSetInfo (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[setID, userID, subjType, subjID, relID, relObjNoun,
        //     objType, elemNum]].
        break;
    case "setInfoSK":
        $sql = "CALL selectSetInfoFromSecKey (?, ?, ?)";
        $paramNameArr = array("uid", "sid", "rid");
        $typeArr = array("id", "id", "id");
        // output: [[setID, userID, subjType, subjID, relID, relObjNoun,
        //     objType, elemNum]].
        break;
    case "setID":
        $sql = "CALL selectSetID (?, ?, ?)";
        $paramNameArr = array("uid", "sid", "rid");
        $typeArr = array("id", "id", "id");
        // output: [[setID]].
        break;
    case "rat":
        $sql = "CALL selectRating (?, ?)";
        $paramNameArr = array("oid", "sid");
        $typeArr = array("id", "id");
        // output: [[ratVal]].
        break;
    case "recentInputs":
        $sql = "CALL selectRecentInputs (?, ?)";
        $paramNameArr = array("id", "n");
        $typeArr = array("id", "int");
        // output: [[setID, objID, ratVal], ...].
        break;
    case "recordedtInputs":
        $sql = "CALL selectRecordedInputs (?, ?, ?, ?)";
        $paramNameArr = array("sid", "oid", "n", "o");
        $typeArr = array("id", "id", "int", "int");
        // output: [[objID, changedAt, ratVal], ...].
        break;
    case "userInfo":
        $sql = "CALL selectUserInfo (?, ?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[publicKeys]].
        break;
    case "cat":
        $sql = "CALL selectCat (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[title, superCatID]].
        break;
    case "term":
        $sql = "CALL selectTerm (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[title, catID]].
        break;
    case "rel":
        $sql = "CALL selectRel (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[subjType, objType, objNoun]].
        break;
    case "kws":
        $sql = "CALL selectKeywordString (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[str]].
        break;
    case "patt":
        $sql = "CALL selectPattern (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[str]].
        break;
    case "catIDs":
        $sql = "CALL selectCatIDs (?, ?, ?, ?)";
        $paramNameArr = array("s", "scid", "n", "o");
        $typeArr = array("tvarchar", "id", "int", "int");
        // output: [[title, catID], ...].
        break;
    case "termIDs":
        $sql = "CALL selectTermIDs (?, ?, ?, ?)";
        $paramNameArr = array("s", "cid", "n", "o");
        $typeArr = array("tvarchar", "id", "int", "int");
        // output: [[title, termID], ...].
        break;
    case "relIDs":
        $sql = "CALL selectRelIDs (?, ?, ?, ?, ?)";
        $paramNameArr = array("st", "ot", "s", "n", "o");
        $typeArr = array("type", "type", "tvarchar", "int", "int");
        // output: [[objNoun, relID], ...].
        break;
    case "kwsIDs":
        $sql = "CALL selectKeywordStringIDs (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "int", "int");
        // output: [[str, kwsID], ...].
        break;
    case "pattIDs":
        $sql = "CALL selectPatternIDs (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "int", "int");
        // output: [[str, pattID], ...].
        break;
    case "kwsSearch":
        $sql = "CALL searchForKeywordStrings (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "int", "int");
        // output: [[str, kwsID], ...].
        break;
    case "kwsSearchB":
        $sql = "CALL searchForKeywordStringsBooleanMode (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "int", "int");
        // output: [[str, kwsID], ...].
        break;
    case "superCatDefs":
        $sql = "CALL selectSuperCatDefs (?, ?)";
        $paramNameArr = array("id", "n");
        $typeArr = array("id", "int");
        // output: [[title, superCatID], ...].
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
    case "list":
        $sql = "CALL selectList (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[elemTypeStr, elemIDHexStr, tailID]].
        break;
    case "listID":
        $sql = "CALL selectListID (?)";
        $paramNameArr = array("ts", "ids", "t");
        $typeArr = array("elemTypeStr", "elemIDHexStr", "id");
        // output: [[listID,]].
        break;
    case "listRec":
        $sql = "CALL selectList (?, ?)";
        $paramNameArr = array("id", "n");
        $typeArr = array("id", "int");
        // output: [[NULL]] (not implemented yet.).
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
        $typeArr = array("id", "type", "int", "int", "tint");
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
