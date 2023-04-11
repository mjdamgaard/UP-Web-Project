<?php

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


// modules can only be GET-gotten.
// if ($_SERVER["REQUEST_METHOD"] != "GET") {
//     $_POST = $_GET;
// }

// modules can only be GET-gotten.
$textID = "";
if (!isset($_GET["id"])) {
    header('Content-Type: text/json');
    echoTypeErrorJSONAndExit("No text ID (id) specified");
} else {
    $textID = $_GET["id"];
}

// verify the input text ID.
InputVerifier::verifyType($textID, "textID", "id");

// array of text IDs of legal developer-made modules.
$devModuleIDs = array (
    "t1", "tA" //TODO: Change these to match the text IDs in the database of the
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
    // define the parameters used to get the (unsanitized!) text.
    $sqlKey = "text";
    $paramValArr = array($textID);
    $res = DBQuerier::query($conn, $sqlKey, $paramValArr);
    // return the text as is. //TODO: Is is important that I change this impl.
    header('Content-Type: text/javascript');
    echo $res;
    exit;
}
?>
