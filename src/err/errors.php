<?php



function getErrorJSON($msg) {
    return '{"Error":"' . $msg . '"}';
}

function echoErrorJSON($msg) {
    echo getErrorJSON($msg);
}

function echoErrorJSONAndExit($msg) {
    echo getErrorJSON($msg);
    exit;
}

function echoTypeErrorJSONAndExit($paramName, $expectedType) {
    echoErrorJSONAndExit(
        "Parameter ". $paramName . " has a wrong type; " .
        "expected type is " . $expectedType
    );
}





?>
