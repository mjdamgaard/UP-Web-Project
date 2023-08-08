<?php

function getErrorJSON($msg) {
    return '{"error":"' . $msg . '"}';
}

function echoErrorJSONAndExit($msg) {
    header("Content-Type: text/json");
    http_response_code(400); // 400 Bad Request.
    echo getErrorJSON($msg);
    exit;
}

function echoTypeErrorJSONAndExit($paramName, $paramVal, $expectedType) {
    echoErrorJSONAndExit(
        "Parameter ". $paramName . "=" . $paramVal ." has a wrong type; " .
        "expected type is " . $expectedType
    );
}

?>
