<?php

$request_handling_path = $_SERVER['DOCUMENT_ROOT'] . "/src/request_handling/";


// check that http method is the POST method.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
   echo "Error: Only the POST method is implemented";
   exit;
}

// get the protocol.
$protocol = "";
if (!isset($_POST["p"])) {
    // default protocol.
    $protocol = "0.0";
} else {
    $protocol = intval($_POST["p"]);
}

// match with a known protocol.
switch ($protocol) {
    case "0.0":
        // TODO: Discontinue this protocol.
        require $request_handling_path . "p0_0_handler.php";
    case "1.0":
        // TODO: Implement "insert/input term" protocol/procedure.
        echo "Error: Protocol not implemented yet";
        exit;
        break;
    default:
        echo "Error: Unrecognized protocol";
        exit;
}


?>
