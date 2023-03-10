<?php


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

?>
