<?php


$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

class InputGetter {

    public static function getParams($paramNameArr) {
        // initialize return array.
        $paramValArr = array();

        // get and verify all parameters.
        $len = count($paramNameArr);
        for ($i = 0; $i <= $len - 1; $i++) {
            // get ith parameter.
            $paramName = $paramNameArr[$i];
            if (!isset($_POST[$paramName])) {
                echoBadErrorJSONAndExit(
                    "Parameter " . $paramName . " is not specified"
                );
            }
            // append parameter to output array.
            $paramValArr[] = $_POST[$paramName];
        }

        return $paramValArr;
    }

}

?>
