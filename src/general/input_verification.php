<?php


$general_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/general/";
require_once $general_path . "errors.php";


function verifyAndGetParams($paramNameArr, $typeArr, $errPrefix) {
    // initialize return array.
    $paramValArr = array();

    // get length of array.
    $len = count($paramNameArr);
    // TODO: Out-comment this length check.
    if (count($typeArr) != $len) {
        throw new \Exception('verifyAndSetParams(): ' .
            'count(paramNameArr) != count(typeArr).');
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
        $paramVal = $_POST[$paramName];

        // verify ith parameter type.
        $type = $typeArr[$i];
        verifyType($paramVal, $type, $paramName, $errPrefix);

        // append ith parameter to return array.
        $paramValArr[] = $paramVal;
    }

    return $paramValArr;
}

function verifyType($paramVal, $type, $paramName, $errPrefix) {
    switch($type) {
        case "t":
            $pattern = "/^[crsugkltb]$/";
            if (!preg_match($pattern, $paramVal)) {
                echoTypeErrorJSONAndExit($errPrefix, $paramName, $pattern);
            }
            break;
        case "str":
            if (!is_string($param) || strlen($param) > 255) {
                echoTypeErrorJSONAndExit(
                    $errPrefix, $paramName, "char(<226)"
                );
            }
            break;
        case "id":
            $pattern = "/^[0-9a-fA-F]{1,16}$/";
            if (!preg_match($pattern, $paramVal)) {
                echoTypeErrorJSONAndExit($errPrefix, $paramName, $pattern);
            }
            break;
        case "bin":
            $pattern = "/^([0-9a-fA-F]{2}){0,255}$/";
            if (!preg_match($pattern, $paramVal)) {
                echoTypeErrorJSONAndExit($errPrefix, $paramName, $pattern);
            }
            break;
        case "uint":
            $pattern = "/^([1-9][0-9]*|0)$/";
            $n = intval($paramVal);
            if (
                !preg_match($pattern, $paramVal) ||
                $n < 0 ||
                $n > 4294967295
            ) {
                echoTypeErrorJSONAndExit($errPrefix, $paramName, "UINT");
            }
            break;
        case "int":
            $pattern = "/^-?([1-9][0-9]*|0)$/"; // this allows "-0", why not?..
            $n = intval($paramVal);
            if (
                !preg_match($pattern, $paramVal) ||
                $n < -2147483648 ||
                $n > 2147483647
            ) {
                echoTypeErrorJSONAndExit($errPrefix, $paramName, "INT");
            }
            break;
        case "tint":
            $pattern = "/^-?([1-9][0-9]*|0)$/"; // this allows "-0", why not?..
            $n = intval($paramVal);
            if (
                !preg_match($pattern, $paramVal) ||
                $n < -128 ||
                $n > 127
            ) {
                echoTypeErrorJSONAndExit(
                    $errPrefix, $paramName, "TINYINT"
                );
            }
            break;
        default:
            throw new \Exception('verifyAndSetParams(): unknown type.');
    }
}



?>
