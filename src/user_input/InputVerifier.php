<?php


$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";


class InputVerifier {

    public static function verifyType(
        $paramVal, $type, $paramName
    ) {
        switch($type) {
            /* Type and ID input */
            case "type":
                $pattern = "/^[cerugkltb]$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "id":
                $pattern = "/^[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "termID":
                $pattern = "/^[scerugkltb]self::$$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "setID":
                $pattern = "/^s[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "semTermID":
                $pattern = "/^[cer][1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "catID":
                $pattern = "/^c[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "eTermID":
                $pattern = "/^e[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "relID":
                $pattern = "/^r[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "userOrGroupID":
                $pattern = "/^[ug][1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "userID":
                $pattern = "/^u[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "groupID":
                $pattern = "/^g[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "kwStringID":
                $pattern = "/^k[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "listID":
                $pattern = "/^l[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "textID":
                $pattern = "/^t[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "binID":
                $pattern = "/^b[1-9A-F][0-9A-F]{0,15}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            /* Data input */
            case "str":
                if (
                    !is_string($paramVal) ||
                    !ctype_print($paramVal) ||
                    strlen($paramVal) > 255
                ) {
                    echoTypeErrorJSONAndExit($paramName, "VARCHAR(225)");
                }
                break;
            case "bin":
                $pattern = "/^([0-9A-F]{2}){0,255}$/";
                if (!preg_match($pattern, $paramVal)) {
                    echoTypeErrorJSONAndExit($paramName, $pattern);
                }
                break;
            case "blob":
                // TODO: Implement.
                echoErrorJSONAndExit("BLOB types are not implemented yet!");
                break;
            case "text":
                // TODO: Implement soon.
                echoErrorJSONAndExit("Text types are not implemented yet!");
                break;
            case "uint":
                $pattern = "/^([1-9][0-9]*|0)$/";
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
                $pattern = "/^-?([1-9][0-9]*|0)$/"; // this allows "-0", why not?..
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
                $pattern = "/^-?([1-9][0-9]*|0)$/"; // this allows "-0", why not?..
                $n = intval($paramVal);
                if (
                    !preg_match($pattern, $paramVal) ||
                    $n < -128 ||
                    $n > 127
                ) {
                    echoTypeErrorJSONAndExit($paramName, "TINYINT");
                }
                break;
            default:
                throw new \Exception(
                    'verifyAndSetParams(): unknown type for ' . $paramName
                );
        }
    }

}


?>
