<?php

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVerifier.php";

$UPA_dev_modules_path = $_SERVER['DOCUMENT_ROOT'] . "/../UPA_dev_modules/";




// I should make sure that binary ressources are always saved with safe (and
// appropriate) file extensions, when users right click on them. (Though this
// might very well be a frontend task..).






?>
