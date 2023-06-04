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
                    echoTypeErrorJSONAndExit($paramName, $paramVal, $pattern);
                }
                break;
            case "id":
                $pattern = "/^[1-9][0-9]*|0$/";
                if (
                    !preg_match($pattern, $paramVal) ||
                    strlen($paramVal) > 20 ||
                    strlen($paramVal) == 20 &&
                        $paramVal > "18446744073709551615"
                ) {
                    echoTypeErrorJSONAndExit(
                        $paramName, $paramVal, "BIGINT UNSIGNED"
                    );
                }
                break;
            case "uint":
                $pattern = "/^[1-9][0-9]*|0$/";
                if (
                    !preg_match($pattern, $paramVal) ||
                    strlen($paramVal) > 10 ||
                    strlen($paramVal) == 10 && $paramVal > "4294967295"
                ) {
                    echoTypeErrorJSONAndExit(
                        $paramName, $paramVal, "INT UNSIGNED"
                    );
                }
                break;
            case "int":
                $pattern = "/^-?[1-9][0-9]{0,9}|0$/";
                $n = intval($paramVal);
                if (
                    !preg_match($pattern, $paramVal) ||
                    $n < -2147483648 ||
                    $n > 2147483647
                ) {
                    echoTypeErrorJSONAndExit($paramName, $paramVal, "INT");
                }
                break;
            case "sint":
                $pattern = "/^-?[1-9][0-9]{0,4}|0$/";
                $n = intval($paramVal);
                if (
                    !preg_match($pattern, $paramVal) ||
                    $n < -32768 ||
                    $n > 32767
                ) {
                    echoTypeErrorJSONAndExit($paramName, $paramVal, "SMALLINT");
                }
                break;
            case "tint":
                $pattern = "/^-?[1-9][0-9]{0,2}|0$/";
                $n = intval($paramVal);
                if (
                    !preg_match($pattern, $paramVal) ||
                    $n < -128 ||
                    $n > 127
                ) {
                    echoTypeErrorJSONAndExit($paramName, $paramVal, "TINYINT");
                }
                break;
            case "tstr":
                if (
                    !is_string($paramVal) ||
                    !ctype_print($paramVal) ||
                    strlen($paramVal) > 255
                ) {
                    echoTypeErrorJSONAndExit(
                        $paramName, $paramVal, "VARCHAR(225)"
                    );
                }
                break;
            case "str":
                if (
                    !is_string($paramVal) ||
                    !ctype_print($paramVal) ||
                    strlen($paramVal) > 768
                ) {
                    echoTypeErrorJSONAndExit(
                        $paramName, $paramVal, "VARCHAR(768)"
                    );
                }
                break;
            case "elemTypeStr":
                if (
                    !is_string($paramVal) ||
                    !ctype_print($paramVal) ||
                    strlen($paramVal) > 31
                ) {
                    echoTypeErrorJSONAndExit(
                        $paramName, $paramVal, "VARCHAR(31)"
                    );
                }
                break;
            case "elemIDHexStr":
                $pattern = "/^([0-9A-Fa-f]{2}){0,248}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $paramVal, $pattern);
                }
                break;
            case "text":
                if (
                    !is_string($paramVal) ||
                    !ctype_print($paramVal) ||
                    strlen($paramVal) > 65535
                ) {
                    echoTypeErrorJSONAndExit($paramName, $paramVal, "TEXT");
                }
                break;
            case "blob":
                if (
                    !is_string($paramVal) ||
                    strlen($paramVal) > 4294967295
                ) {
                    echoTypeErrorJSONAndExit(
                        $paramName, $paramVal, "MEDIUMBLOB"
                    );
                }
                break;
            case "time":
                $pattern =
                    "/^([12]?[0-9] |3[0-4] )?([01][0-9]|2[0-3])(:[0-5][0-9]){2}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $paramVal, $pattern);
                }
                break;
            // case "datetime":
            // //     $pattern = ...
            //     break;
            default:
                throw new \Exception(
                    'verifyAndSetParams(): unknown type ' .
                    $type . ' for ' . $paramName
                );
        }
    }

}


?>
