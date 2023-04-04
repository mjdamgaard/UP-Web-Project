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
$mainModuleID = "t1";




// echo the div that the UPA scripts are allowed to change internally (as well
// as being able to read and write to a specific "area" of the local storage).
// Also place the script that imports and runs the chosen UPA main module in
// this div.
?>
<div id="upaFrame">
    <div class="ratingQueue"></div>
    <div class="insertQueue"></div>
    <script type="module">
        // import the chosen UPA main module.
        import {
            upaFun_main
        } from "./UPA_modules.php?id=<?php echo $mainModuleID; ?>";
        // run the main function from that module right away.
        upaFun_main(<?php
            echo '{'
                'tid:"' . $termID . '", ' .
                'uid:"' . $userID . '", ' .
                'pid:"' . $preferenceUserOrGroupID . '"' .
            '}';
        ?>);
    </script>
</div>
