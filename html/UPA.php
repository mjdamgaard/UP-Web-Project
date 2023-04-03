<?php


$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputVerifier.php";



if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}


// get and verify the required inputs.
$paramNameArr = array("tid", "uid");
$typeArr = array("termID", "userOrGroupID");
$paramValArr = InputGetter::getParams($paramNameArr);
InputVerifier::verifyTypes($paramValArr, $typeArr, $paramNameArr);


// authenticate the user make sure that the uid is either one which that user
// has actively whitelisted or one of the standard user groups that the site
// has whitelisted for the general public to freely use.
// TODO: Implement this such that user is actually authenticated!
;



// echo the div that the UPA scripts are allowed to change internally (as well
// as a specific "area" of the local storage; they are also allowed to change
// that).
echo '<div id="upaFrame"></div>';


// query the database for the UPA main module that is the preference of the
// chosen user/user group.
;//TODO..

// echo the script that loads said UPA main module.
echo "...";//TODO..


?>
