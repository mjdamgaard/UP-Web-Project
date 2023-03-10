<?php

$html = "";

// check that http method is the POST method.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
   echo "Error: Only the POST method is implemented";
   exit;
}


// get request type.
if (!isset($_POST["reqType"])) {
   echo "Error: No request type specified";
   exit;
}
$reqType = $_POST["reqType"];

// branch to corresponding request handler.
switch ($reqType) {
    case "set":
        $html = queryAndEchoSet();
        break;
    case "catTitle":
        // TODO..
        echo "";
        break;
    default:
        return "Error: Unrecognized request type";
}


function convertToSafeOutputFormat($str) {
    return htmlspecialchars($str);
}

function safeEcho($str) {
    echo convertToSafeOutputFormat($str);
}

safeEcho($html);








function queryAndEchoSet() {
    
}





?>
