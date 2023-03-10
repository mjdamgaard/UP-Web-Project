<?php

$subroutines_path = $_SERVER['DOCUMENT_ROOT'] . "/src/subroutines/";


// check that http method is the POST method and get $protocol variable.
$protocol = "";
require $subroutines_path . "get_and_check_protocol_from_post.php";


// NOTE: this protocol requires no user authenication.

// get request type.
$reqType = "";
require $subroutines_path . "get_request_type.php";




}










function test_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}


?>
