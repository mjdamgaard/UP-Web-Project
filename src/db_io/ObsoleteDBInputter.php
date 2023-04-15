<?php

// TODO: Re-refactor and absorb this into input_handler.

/* All text outputs are converted to safe html texts (using the
 * htmlspecialchars() function) in this layer!
 **/

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVerifier.php";


interface Inputter {
    public static function input($conn, $sqlKey, $paramValArr);
    // public static function inputMultiple($conn, $sqlKey, $paramValArr, $n);
}

class DBInputter implements Inputter {
    private static $querySQLSpecs = array(
        "rate" => array(
            "n" => 5,
            "sql" => "CALL inputOrChangeRating (?, ?, ?, ?, @ec)",
            "typeArr" => array(
                "userID", "termID", "relID",
                "termID",
                "bin"
            )
        ),

        "cat" => array(
            "n" => 3,
            "sql" => "CALL insertOrFindCat (?, ?, ?, @outID, @ec)",
            "typeArr" => array(
                "userID", "catID",
                "str"
            )
        ),

        "eTerm" => array(
            "n" => 3,
            "sql" => "CALL insertOrFindETerm (?, ?, ?, @outID, @ec)",
            "typeArr" => array(
                "userID", "catID",
                "str"
            )
        ),

        "rel" => array(
            "n" => 3,
            "sql" => "CALL insertOrFindRel (?, ?, ?, @outID, @ec)",
            "typeArr" => array(
                "userID", "catID",
                "str"
            )
        ),

        "text" => array(
            "n" => 2,
            "sql" => "CALL insertText (?, ?, @outID, @ec)",
            "typeArr" => array(
                "userID",
                "text"
            )
        ),

        "binary" => array(
            "n" => 2,
            "sql" => "CALL insertBinary (?, ?, @outID, @ec)",
            "typeArr" => array(
                "userID",
                "blob"
            )
        ),

    );

    private static function verifyInputAndGetMySQLiResult (
        $conn, $sqlSpec, $paramValArr
    ) {
        // check length of $paramValArr.
        if (count($paramValArr) != $sqlSpec["n"]) {
            throw new Exception(
                "verifyInputAndGetMySQLiResult(): " .
                "paramValArr has incorrect length"
            );
        }

        // verify types of $paramValArr.
        for ($i = 0; $i < $sqlSpec["n"]; $i++) {
            InputVerifier::verifyType(
                $paramValArr[$i],
                $sqlSpec["typeArr"][$i],
                strval($i)
            );
        }

        // prepare MySQLi statement.
        $stmt = $conn->prepare($sqlSpec["sql"]);
        // execute statement with the (now type verified) input parameters.
        DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
        // prepare the select statement to get the exit code and the potentally
        // new ID, which we will denote as 'outID'.
        $stmt = $conn->prepare("SELECT @outID AS outID, @ec AS exitCode");
        // execute this select statement.
        DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);

        // return mysqli_result object.
        return $stmt->get_result();
    }


    public static function input($conn, $sqlKey, $paramValArr) {
        if (!isset(self::$querySQLSpecs[$sqlKey])) {
            throw new Exception(
                "input(): " .
                "sqlKey does not match any key"
            );
        }
        $sqlSpec = self::$querySQLSpecs[$sqlKey];

        // try to input the requested data into database and get the exit code.
        $res = self::verifyInputAndGetMySQLiResult(
            $conn, $sqlSpec, $paramValArr
        );
        // return the exit code (as an associative array) for the input request.
        return $res->fetch_assoc();
    }

// public static function inputMultiple($conn, $sqlKey, $paramValArr, $i, $n) {
//     if (!isset(self::$querySQLSpecs[$sqlKey])) {
//         throw new Exception(
//             "inputMultiple(): " .
//             "sqlKey does not match any key"
//         );
//     }
//     $sqlSpec = self::$querySQLSpecs[$sqlKey];
//
//     // initialize resulting parameter value array, which is supposed to be
//     // set as the $paramValArr for the query at each iteration of the
//     // loop.
//     $resultingParamValArr = $paramValArr;
//     $resultingParamValArr[$i] = $paramValArr[$i][0];
//     // insert the first term and verify all the != $i indeces.
//     self::verifyInputAndGetMySQLiResult(
//         $conn, $sqlSpec, $resultingParamValArr
//     );
//     // prepare MySQLi statement.
//     $stmt = $conn->prepare($sqlSpec["sql"]);
//     // loop..
//     $len = count($paramValArr[$i]);
//     $m = min($len, $n, 200);
//     for ($j = 1; $j < $m; $j++) {
//         $resultingParamValArr[$i] = $paramValArr[$i][$j];
//         // verify types of $paramValArr.
//         InputVerifier::verifyType(
//             $resultingParamValArr[$i],
//             $sqlSpec["typeArr"][$i],
//             strval($i)
//         );
//         // execute statement with the (now type verified) input parameters.
//         DBConnector::executeSuccessfulOrDie($stmt, $resultingParamValArr);
//     }
//     // return nothing.
// }
}

?>
