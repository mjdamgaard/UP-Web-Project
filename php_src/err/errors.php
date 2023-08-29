<?php

function getErrorJSON($msg) {
    return '{"error":"' . $msg . '"}';
}

function echoBadErrorJSONAndExit($msg) {
    header("Content-Type: text/json");
    http_response_code(400); // 400 Bad Request.
    echo getErrorJSON($msg);
    exit;
}

function echoErrorJSONAndExit($msg) {
    header("Content-Type: text/json");
    echo getErrorJSON($msg);
    exit;
}

function echoTypeErrorJSONAndExit($paramName, $paramVal, $expectedType) {
    echoBadErrorJSONAndExit(
        "Parameter ". $paramName . "=" . $paramVal ." has a wrong type; " .
        "expected type is " . $expectedType
    );
}

?>
