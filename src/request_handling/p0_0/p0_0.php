<?php namespace p0_0;

/* Error messages */

function getErrorJSON($msg) {
    return '{"Error":"' . $msg . '"}'
}

function echoErrorJSONAndExit($msg) {
    echo getErrorJSON($msg);
    exit;
}

function echoTypeErrorJSONAndExit($errPrefix, $paramName, $expectedType) {
    echoErrorJSONAndExit(
        $errPrefix . "Parameter ". $paramName . " has a wrong type: " .
        "Expected type is " . $expectedType.
    );
}


// /* Output */
//
// function convertToSafeOutputFormat($str) {
//     return htmlspecialchars($str);
//     // stripslashes (if so) happens in app layer.
// }
//
// function safeEcho($str) {
//     echo convertToSafeOutputFormat($str);
// }

/* parameter getting, verifying and setting */

function verifyAndGetParams($paramNameArr, $typeArr, $errPrefix) {
    // initialize return array.
    $paramArr = arrray();

    // get length of array.
    $len = count($paramNameArr);
    // TODO: Out-comment this length check.
    if (count($typeArr) != $len) {
        die("verifyAndSetParams(): count(paramNameArr) != count(typeArr)");
    }
    // get and verify all parameters.
    for ($i = 0; $i <= $len - 1; $i++) {
        // get ith parameter.
        $paramName = $paramNameArr[$i];
        if (!isset($_POST[$paramName])) {
            echoErrorJSONAndExit(
                $errPrefix . "Parameter ". $paramName .
                " is not specified"
            );
        }
        $param = $_POST[$paramName];

        // verify ith parameter type.
        $type = $typeArr[$i];
        verifyType($param, $type, $errPrefix);

        // append ith parameter to return array.
        $paramArr[] = $param;
    }

    return $paramArr;
}

function verifyType($param, $type, $errPrefix) {
    switch($type) {
        case "t":
            if (!is_string($param) || count($param) != 1) {
                echoTypeErrorJSONAndExit(
                    $errPrefix, $paramName, "char(1)"
                );
            }
            break;
        case "str":
            if (!is_string($param) || count($param) > 255) {
                echoTypeErrorJSONAndExit(
                    $errPrefix, $paramName, "char(<226)"
                );
            }
            break;
        case "id":
            $len = count($param);
            if (!ctype_xdigit($param) || $len > 16 || $len % 2 != 0) {
                echoTypeErrorJSONAndExit(
                    $errPrefix, $paramName, "hexadecimal(<17 and even)"
                );
            }
            break;
        case "bin":
            if ($param === "") {
                break;
            }
            $len = count($param);
            if (!ctype_xdigit($param) || $len > 2 * 255 || $len % 2 != 0) {
                echoTypeErrorJSONAndExit(
                    $errPrefix, $paramName, "hexadecimal(<511 and even)"
                );
            }
            break;
        case "int":
            if (
                !is_int($param) ||
                $param < -2147483648 ||
                $param > 2147483647
            ) {
                echoTypeErrorJSONAndExit(
                    $errPrefix, $paramName, "INT"
                );
            }
            break;
        case "tint":
            if (
                !is_int($param) ||
                $param < -128 ||
                $param > 127
            ) {
                echoTypeErrorJSONAndExit(
                    $errPrefix, $paramName, "TINYINT"
                );
            }
            break;
        default:
            die("verifyAndSetParams(): wrong type string");
    }
}



?>
