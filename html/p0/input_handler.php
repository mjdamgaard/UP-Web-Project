<?php


if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo '{"Error":"GET HTTP method is not allowed for input requests"}';
}


// get the protocol.
$protocol = "";
if (isset($_POST["p"])) {
    $protocol = $_POST["p"];
} else {
    // default protocol.
    $protocol = "0.0";
}

$request_handling_path = $_SERVER['DOCUMENT_ROOT'] .
    "/../src/request_handling/";

// match with a known protocol.
switch ($protocol) {
    case "0.0":
        // TODO: Discontinue this protocol.
        require $request_handling_path . "p0_0/input_handler.php";
        exit;
    case "1.0":
        // TODO: Implement "insert/input term" protocol/procedure.
        echo '{"Error":"Protocol not implemented yet"}';
        exit;
    default:
        echo '{"Error":"Unrecognized protocol"}';
        exit;
}


?>
