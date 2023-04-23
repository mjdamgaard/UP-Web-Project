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
$paramNameArr = array("tid", "uid", "pid");
$typeArr = array("termID", "userID", "userOrGroupID");
$paramValArr = InputGetter::getParams($paramNameArr);
InputVerifier::verifyTypes($paramValArr, $typeArr, $paramNameArr);
$termID = $paramValArr[0];
$userID = $paramValArr[1];
$preferenceUserID = $paramValArr[2];


// authenticate the user make sure that the uid is either one that user
// has actively whitelisted or one of the standard user groups that the site
// has whitelisted for the general public to use freely.
// TODO: Implement this such that user is actually authenticated! (unless,
// a standard whitelisted user (group) is chosen!)
;
// TODO: Branch away to login page, if the user cannot be authenticated, but
// keep the parameters in the URL path such that the application can return to
// the same place after authentication.



// TODO: The server should also query the database for the chosen user (group)'s
// URL pattern whitelist and blacklist (and send that along to the browser)!
// I should then write some JS functions in html/src to create a little API
// that the UPA developer functions then can call to implement a filter for
// all URLs that can appear in links in the UPA.



// query the database for the UPA main module that is the preference of the
// chosen user/user group.
//TODO: For now I am just loading a module in the UPA_dev_modules folder. Change
// this such that the user (group) is queried for their preference instead.
$mainModuleID = "tA";


// The safety of the main module should not be verified here! That is the
// responsibility of UPA_modules.php instead!


// TODO: Also add a Content Security Policy (CSP), btw. ..Hm, perhaps not,
// except maybe in the beginning, of course.. Yeah..


// echo the div that the UPA scripts are allowed to change internally (as well
// as being able to read and write to a specific "area" of the local storage).
// Also place the script that imports and runs the chosen UPA main module in
// this div.
?>
<div id="upaFrame">
    <main></main>
</div>
<script id="upaMainFunLoader" type="module">
    import {
        upaf_main
    } from "./UPA_scripts.php?id=<?php echo $mainModuleID; ?>";
    upaf_main(<?php
        echo '"' . $preferenceUserID . '", "' . $termID.'", "' . $userID . '"';
    ?>);
</script>
<!-- The following test still throws error, which is nice to know, cause this
  // means that I can run several main functions without collision.
 -->
<!-- <script id="test">
    upaf_main(<?php
        echo '"' . $preferenceUserID . '", "' . $termID.'", "' . $userID . '"';
    ?>);
</script> -->
