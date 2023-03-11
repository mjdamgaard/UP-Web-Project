<?php namespace p0_0;

/* Error messages */

function getErrorJSON($msg) {
    return '{"Error":"' . $msg . '"}'
}


/* Output */

function convertToSafeOutputFormat($str) {
    return htmlspecialchars($str); // stripslashes (if so) happens in app layer.
}

function safeEcho($str) {
    echo convertToSafeOutputFormat($str);
}

/* parameter getting, verifying and setting */

function verifyAndSetParams($paramNameArr, $typeArr, $errPrefix) {
    foreach ($paramNameArr as $paramName) {
        // get parameters.
        if (!isset($_POST[$paramName])) {
            echo p\getErrorJSON(
                $errPrefix . "Parameter ". $paramName . " is not specified"
            );
            exit;
        }
        // set parameters.
        $$paramName = $_POST[$paramName];
        // verify parameter types.
        verifyParamTypes($paramNameArr, $typeArr);
    }
}

function verifyParamTypes($paramNameArr, $typeArr) {
    foreach ($paramNameArr as $paramName) {
        // TODO: ...
    }
}





?>
