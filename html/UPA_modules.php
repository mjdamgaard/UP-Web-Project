<?php

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVerifier.php";

$UPA_dev_modules_path = $_SERVER['DOCUMENT_ROOT'] . "/../UPA_dev_modules/";



// modules can only be GET-gotten.
// if ($_SERVER["REQUEST_METHOD"] != "GET") {
//     $_POST = $_GET;
// }

// modules can only be GET-gotten.
$textID = "";
if (!isset($_GET["tid"])) {
    echoTypeErrorJSONAndExit("No text ID (tid) specified");
} else {
    $textID = $_GET["tid"];
}

// verify the input text ID.
InputVerifier::verifyType($textID, "textID", "tid");

// array of text IDs of legal developer-made modules.
$devModuleIDs = array (
    "t1", "t2" //TODO: Change these to match the text IDs in the database of the
    // developer-made modules.
);

$devModuleIDPatt =
    "/^((" .
    implode(")|(", $devModuleIDs) .
    "))$/"

// if the text ID matches the ID of a developer-made module, change the header
// to that module
if (preg_match($devModuleIDPatt, $textID)) {
    //TODO: Change this!
    header("Location: " . "localhost" . "/UPA_dev_modules/" . $textID . ".js");

} else {
    //TODO: Implement a querier that get texts from the database that are rated
    // as safe by a certain native user and returns them without converting
    // any characters (so without htmlspecialchars()).
    echoTypeErrorJSONAndExit("User-made modules are not implemented yet!");
}



?>
