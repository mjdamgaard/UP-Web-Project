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
$preferenceUserOrGroupID = $paramValArr[2];


// authenticate the user make sure that the uid is either one which that user
// has actively whitelisted or one of the standard user groups that the site
// has whitelisted for the general public to use freely.
// TODO: Implement this such that user is actually authenticated! (Unless,
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


// TODO: Also add a Content Security Policy (CSP), btw.


// echo the div that the UPA scripts are allowed to change internally (as well
// as being able to read and write to a specific "area" of the local storage).
// Also place the script that imports and runs the chosen UPA main module in
// this div.
?>
<div id="upaMainFrame">
    <div upaAtt_class="ratingQueue"></div>
    <div upaAtt_class="insertQueue"></div>
</div>
<script id="upaMainFunLoader" type="module">
    // import the chosen UPA main module.
    import {
        upaf_main
    } from "./UPA_modules.php?id=<?php echo $mainModuleID; ?>";
    // run the main function from that module right away.
    upaf_main(<?php
        echo '{' .
            'tid:"' . $termID . '", ' .
            'uid:"' . $userID . '", ' .
            'pid:"' . $preferenceUserOrGroupID . '"' .
        '}';
    ?>);
</script>
<!--
    TODO: I think I actually have to implement these queues in a semi-private
    database instead (not generally open to the public, but not safe from
    users sniffing.. (via UPA functions).. Hm, or maybe not..).. ..No, cause
    the UPA can only output data.. well, no.. No, cause I will allow
    whitelisted hyperlinks, which means that.. well, that users *might* in
    principle be able to extract this data. But anyway, this doesn't matter
    much; in conclusion, I can call it a "semi-private database"..
    ..Wait is this even worth the effort?.. Can't I just let the UPA input and
    insert freely..? ..Hm.. ..Ah, whatever I do, I should make it so that users
    have to elevate their privileges in order to insert terms!.. ..And ratings
    can be undone as soon as I implement queries for RecentInputs, so therefore,
    shouldn't I just make the UPA free to input ratings and insert terms, as
    long as the user is logged in with high enough privileges to do so?:)..
    ..Yes, let me say that.
-->
<!-- <script  id="ratingQueueHandler">
    // TODO: Implement a function that listens to new ratings.
    // In the beginning, I will just let this handler sent the ratings straight
    // to the SDB right away, without further ado. // No! Users should always
    // have to manually confirm a list of new ratings.
</script>
<script  id="insertQueueHandler">
    // TODO: Implement a function that listens to new term insert requests.
    // In the beginning, I might implement this handler such that the user
    // has to actively confirm new inserts. But I might also just make it like
    // ratingQueueHandler in the very beginning.. // No! I should implement it
    // in the beginning (and keep it like that) such that users should always
    // have to manually confirm a list of new ratings.
</script> -->
