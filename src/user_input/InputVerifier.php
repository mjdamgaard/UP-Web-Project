<?php


$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";


class InputVerifier {

    public static function verifyTypes($paramValArr, $typeArr, $paramNameArr) {
        $len = count($paramValArr);
        for ($i = 0; $i < $len; $i++) {
            InputVerifier::verifyType(
                $paramValArr[$i], $typeArr[$i], $paramNameArr[$i]
            );
        }
    }

    public static function verifyType($paramVal, $type, $paramName) {
        switch($type) {
            /* Type and ID input */
            case "type":
                $pattern = "/^[suctrkpxbl]$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "id":
                $pattern = "/^[1-9][0-9]*|0$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "uint":
                $pattern = "/^[1-9][0-9]*|0$/";
                $n = intval($paramVal);
                if (
                    !preg_match($pattern, $paramVal) ||
                    $n < 0 ||
                    $n > 4294967295
                ) {
                    echoTypeErrorJSONAndExit($paramName, "UINT");
                }
                break;
            case "int":
                $pattern = "/^-?[1-9][0-9]*|0$/"; // this allows "-0", why not?..
                $n = intval($paramVal);
                if (
                    !preg_match($pattern, $paramVal) ||
                    $n < -2147483648 ||
                    $n > 2147483647
                ) {
                    echoTypeErrorJSONAndExit($paramName, "INT");
                }
                break;
            case "tint":
                $pattern = "/^-?[1-9][0-9]*|0$/"; // this allows "-0", why not?..
                $n = intval($paramVal);
                if (
                    !preg_match($pattern, $paramVal) ||
                    $n < -128 ||
                    $n > 127
                ) {
                    echoTypeErrorJSONAndExit($paramName, "TINYINT");
                }
                break;
            case "tvarchar":
                if (
                    !is_string($paramVal) ||
                    !ctype_print($paramVal) ||
                    strlen($paramVal) > 255
                ) {
                    echoTypeErrorJSONAndExit($paramName, "VARCHAR(225)");
                }
                break;
            case "str":
                if (
                    !is_string($paramVal) ||
                    !ctype_print($paramVal) ||
                    strlen($paramVal) > 768
                ) {
                    echoTypeErrorJSONAndExit($paramName, "VARCHAR(768)");
                }
                break;
            case "text":
                if (
                    !is_string($paramVal) ||
                    !ctype_print($paramVal) ||
                    strlen($paramVal) > 65535
                ) {
                    echoTypeErrorJSONAndExit($paramName, "TEXT");
                }
                break;
            case "bin":
                $pattern = "/^([0-9A-F]{2}){0,255}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "blob":
                if (
                    !is_string($paramVal) ||
                    strlen($paramVal) > 65535
                ) {
                    echoTypeErrorJSONAndExit($paramName, "BLOB");
                }
                break;
            default:
                throw new \Exception(
                    'verifyAndSetParams(): unknown type ' .
                    $type . ' for ' . $paramName
                );
        }
    }

}


?>
