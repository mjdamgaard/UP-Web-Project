<?php

// Set the Content-Type HTTP header to text/json for now.
header('Content-Type: text/json');

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVerifier.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";
require_once $db_io_path . "DBQuerier.php";

$UPA_cached_modules_path = $_SERVER['DOCUMENT_ROOT'] .
    "/../UPA_cached_modules/";
$UPA_dev_modules_path = $UPA_cached_modules_path . "dev_modules/";


if ($_SERVER["REQUEST_METHOD"] != "GET") {
    // header('Content-Type: text/json');
    echoErrorJSONAndExit(
        "Only the GET HTTP method is allowed script requests"
    );
}


$sql = "CALL selectText (?)";
$paramNameArr = array("id");
$typeArr = array(
    "textID"
);

// get inputs.
$paramValArr = InputGetter::getParams($paramNameArr);
// verify inputs.
InputVerifier::verifyTypes($paramValArr, $typeArr, $paramNameArr);
// store input in appropriate variable.
$textID = $paramValArr[0];



// array of text IDs of legal developer-made modules.
$devModuleIDs = array (
    "t[1-5]", "tA"
    //TODO: Change these to match the text IDs in the database of the
    // developer-made modules.
);

$devModuleIDPatt =
    "/^((" .
        implode(")|(", $devModuleIDs) .
    "))$/";

// if the text ID matches the ID of a developer-made module, change the header
// to that module
if (preg_match($devModuleIDPatt, $textID)) {
    header('Content-Type: text/javascript');
    echo file_get_contents($UPA_dev_modules_path . $textID . ".js");
    exit;
} else {
    //TODO: Implement a querier that get texts from the database that are rated
    // as safe by a certain native user and returns them without converting
    // any characters (so without htmlspecialchars()).
    //TODO: Remove the implementation below which does not check the returned
    // texts at all!
    // get connection.
    $conn = DBConnector::getConnectionOrDie();
    // prepare input MySQLi statement.
    $stmt = $conn->prepare($sql);
    // execute query statement.
    DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
    // fetch the result as an numeric array containing the text.
    $res = $stmt->get_result()->fetch_all();
    // finally set the HTTP content type to javascript echo the text.
    header('Content-Type: text/javascript');
    echo $res[0]; //NOTE: No checks have been made in ths dummy implementation.
}
?>
