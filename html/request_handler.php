<?php


if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
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
    case "0.0": throw new \Exception("POST=" . var_dump($_POST));
        // TODO: Discontinue this protocol.
        require $request_handling_path . "p0_0/handler.php";
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
