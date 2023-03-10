<?php

$src_path = $_SERVER['DOCUMENT_ROOT'] . "/src/";
require_once $src_path . "query_lib_0_00.php";


// $subroutines_path = $_SERVER['DOCUMENT_ROOT'] . "/src/subroutines/";
//
// // check that http method is the POST method and get $protocol variable.
// $protocol = "";
// require $subroutines_path . "get_and_check_protocol_from_post.php";


// check that http method is the POST method.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
   echo "Error: Only the POST method is implemented";
   exit;
}

// get the protocol.
if (!isset($_POST["p"])) {
   echo "Error: No protocol specified";
   exit;
}
$protocol = intval($_POST["p"]);


// match with known protocols.
switch ($protocol) {
    case "0.0":
        // TODO: Discontinue this protocol.
        safeEcho(p_0_00\getRawQueryResult());
        break;
    case "1.0":
        // TODO: Implement "insert/input term" protocol/procedure.
        echo "Error: Protocol not implemented yet";
        exit;
        break;
    default:
        echo "Error: Unrecognized protocol";
        exit;
}






function safeEcho($str) {
    echo convertToSafeOutputFormat($str);
}

function convertToSafeOutputFormat($str) {
    return htmlspecialchars(stripslashes($str));
}


?>
