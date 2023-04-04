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
// has whitelisted for the general public to freely use.
// TODO: Implement this such that user is actually authenticated!
;
// TODO: Branch away to login page, if the user cannot be authenticated, but
// keep the parameters in the URL path such that the application can return to
// the same place after authentication.




// query the database for the UPA main module that is the preference of the
// chosen user/user group.
//TODO: For now I am just loading a module in the UPA_dev_modules folder. Change
// this such that the user (group) is queried for their preference instead.
$mainModuleID = "tA";


// The safety of the main module should not be verified here! That is the
// responsibility of UPA_modules.php instead!



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
        upaFun_main
    } from "./UPA_modules.php?id=<?php echo $mainModuleID; ?>";
    // This does not seem to be a good idea after all, so I should either do it
    // in a completely different way, or I should just try to make the server
    // rename UPA_modules.php to UPA_modules.js for HTTP requests.. ..Let me
    // think about it..

    // run the main function from that module right away.
    upaFun_main(<?php
        echo '{' .
            'tid:"' . $termID . '", ' .
            'uid:"' . $userID . '", ' .
            'pid:"' . $preferenceUserOrGroupID . '"' .
        '}';
    ?>);
</script>
<script  id="ratingQueueHandler">
    // TODO: Implement a function that listens to new ratings.
    // In the beginning, I will just let this handler sent the ratings straight
    // to the SDB right away, without further ado.
</script>
<script  id="insertQueueHandler">
    // TODO: Implement a function that listens to new term insert requests.
    // In the beginning, I might implement this handler such that the user
    // has to actively confirm new inserts. But I might also just make it like
    // ratingQueueHandler in the very beginning..
</script>
