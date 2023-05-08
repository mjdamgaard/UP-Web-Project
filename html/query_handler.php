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
    case "S":
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
    case "SInfo":
        $sql = "CALL selectSetInfo (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[setID, userID, subjType, subjID, relID, relObjNoun,
        //     objType, elemNum]].
        break;
    case "SInfoSK":
        $sql = "CALL selectSetInfoFromSecKey (?, ?, ?)";
        $paramNameArr = array("uid", "sid", "rid");
        $typeArr = array("id", "id", "id");
        // output: [[setID, userID, subjType, subjID, relID, relObjNoun,
        //     objType, elemNum]].
        break;
    case "SID":
        $sql = "CALL selectSetID (?, ?, ?)";
        $paramNameArr = array("uid", "sid", "rid");
        $typeArr = array("id", "id", "id");
        // output: [[setID]].
        break;
    case "R":
        $sql = "CALL selectRating (?, ?)";
        $paramNameArr = array("oid", "sid");
        $typeArr = array("id", "id");
        // output: [[ratVal]].
        break;
    case "RIs":
        $sql = "CALL selectRecentInputs (?, ?)";
        $paramNameArr = array("sid", "oid", "n", "o");
        $typeArr = array("id", "id", "int", "int");
        // output: [[objID, changedAt, oldRatVal, newRatVal], ...].
        break;
    case "UInfo":
        $sql = "CALL selectUserInfo (?, ?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[publicKeys]].
        break;
    case "C":
        $sql = "CALL selectCat (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[title, superCatID]].
        break;
    case "T":
        $sql = "CALL selectTerm (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[title, catID]].
        break;
    case "R":
        $sql = "CALL selectRel (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[subjType, objType, objNoun]].
        break;
    case "K":
        $sql = "CALL selectKeywordString (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[str]].
        break;
    case "P":
        $sql = "CALL selectPattern (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[str]].
        break;
    case "CIDs":
        $sql = "CALL selectCatIDs (?, ?, ?, ?)";
        $paramNameArr = array("s", "scid", "n", "o");
        $typeArr = array("tvarchar", "id", "int", "int");
        // output: [[title, catID], ...].
        break;
    case "TIDs":
        $sql = "CALL selectTermIDs (?, ?, ?, ?)";
        $paramNameArr = array("s", "cid", "n", "o");
        $typeArr = array("tvarchar", "id", "int", "int");
        // output: [[title, termID], ...].
        break;
    case "RIDs":
        $sql = "CALL selectRelIDs (?, ?, ?, ?, ?)";
        $paramNameArr = array("st", "ot", "s", "n", "o");
        $typeArr = array("type", "type", "tvarchar", "int", "int");
        // output: [[objNoun, relID], ...].
        break;
    case "KIDs":
        $sql = "CALL selectKeywordStringIDs (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "int", "int");
        // output: [[str, kwsID], ...].
        break;
    case "PIDs":
        $sql = "CALL selectPatternIDs (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "int", "int");
        // output: [[str, pattID], ...].
        break;
    case "KSearch":
        $sql = "CALL searchForKeywordStrings (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "int", "int");
        // output: [[str, kwsID], ...].
        break;
    case "KSearchB":
        $sql = "CALL searchForKeywordStringsBooleanMode (?, ?, ?)";
        $paramNameArr = array("s", "n", "o");
        $typeArr = array("str", "int", "int");
        // output: [[str, kwsID], ...].
        break;
    case "SCDefs":
        $sql = "CALL selectSuperCatDefs (?, ?)";
        $paramNameArr = array("id", "n");
        $typeArr = array("id", "int");
        // output: [[title, superCatID], ...].
        break;
    case "X":
        $sql = "CALL selectText (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[text]].
        break;
    case "B":
        $sql = "CALL selectBinary (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[bin]].
        break;
    case "L":
        $sql = "CALL selectList (?)";
        $paramNameArr = array("id");
        $typeArr = array("id");
        // output: [[len, elemTypes, elemIDs, tailID]].
        break;
    case "Creator":
        $sql = "CALL selectCreator (?, ?)";
        $paramNameArr = array("t", "id");
        $typeArr = array("type", "id");
        // output: [[userID]].
        break;
    case "Creations":
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
