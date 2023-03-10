<?php

// check that http method is the POST method.
if ($_SERVER["REQUEST_METHOD"] != "POST") {
   echo "Error: Only the POST method is implemented";
   exit;
}

// initial parsing of protocol.
if (!isset($_POST["p"])) {
   echo "Error: No protocol specified";
   exit;
}
$protocol = intval($_POST["p"]);
switch ($protocol) {
    case "0.0":
        // TODO: Discontinue this protocol.
        protocol_0p0();
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

function protocol_0p0() {
    // this protocol requires a user specification for all request types.
    if (!isset($_POST["userID"])) {
       echo "Error: No user ID specified";
       exit;
    }
    $userID = intval($_POST["userID"]);
    if ($userID <= 0) {
        echo "Error: User ID is not formatted correctly";
        exit;
    }
    // NOTE: This protocol does not authenticate users (and thus should be
    // discontinued at some point).

    // get request type.
    if (!isset($_POST["reqType"])) {
       echo "Error: No request type specified";
       exit;
    }
    $reqType = $_POST["reqType"];

    // branch to handler function for specified request.
    switch ($reqType) {
        case "qs":
            // TODO: Implement "query set" procedure.
            querySet();
            break;
        case "it":
            // TODO: Implement "insert/input term" procedure.
            break;
        case "ir":
            // TODO: Implement "input rating" procedure.
            break;
        default:
            echo "Error: Unrecognized request type";
            exit;
    }

    function querySet() {
        // TODO: Implement.
        
        // if (!isset($_POST["reqType"])) {
        //    echo "Error: No request type specified";
        //    exit;
        // }

    }






}










function test_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}


?>
