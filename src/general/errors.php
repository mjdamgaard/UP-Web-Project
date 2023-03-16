<?php




function getErrorJSON($msg) {
    return '{"Error":"' . $msg . '"}';
}

function echoErrorJSONAndExit($msg) {
    echo getErrorJSON($msg);
    exit;
}

function echoTypeErrorJSONAndExit($errPrefix, $paramName, $expectedType) {
    echoErrorJSONAndExit(
        $errPrefix . "parameter ". $paramName . " has a wrong type; " .
        "expected type is " . $expectedType
    );
}





?>
