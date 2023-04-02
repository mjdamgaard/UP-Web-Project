<?php


$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVerifier.php";


interface Querier {
    public static function query($conn, $sqlKey, $paramValArr);
}

class UnsafeQuerier implements Querier {
    private static $querySQLSpecs = array(
        "text" => array(
            "n" => 1,
            "sql" => "CALL selectText (?)",
            "typeArr" => array(
                "textID"
            ),
            "outputType" => "assocArr",
            "columnNames" => array("text")
        )
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

        // return mysqli_result object.
        return $stmt->get_result();
    }


    public static function query($conn, $sqlKey, $paramValArr) {
        if (!isset(self::$querySQLSpecs[$sqlKey])) {
            throw new Exception(
                "verifyInputAndGetMySQLiResult(): " .
                "sqlKey does not match any key"
            );
        }
        $sqlSpec = self::$querySQLSpecs[$sqlKey];

        $res = self::verifyInputAndGetMySQLiResult(
            $conn, $sqlSpec, $paramValArr
        );

        // branch according to the "outputType" and return unsanitized result.
        if ($sqlSpec["outputType"] === "numArr") {
            // fetch all rows as a multidimensional array.
            $rows = $res->fetch_all();
            // return $rows as is; unsanitized!
            return $rows;

        } elseif ($sqlSpec["outputType"] === "assocArr") {
            // fetch a single row as an associative array.
            $row = $res->fetch_assoc();
            // return $row as is; unsanitized!
            return $row;
        } else {
            throw new Exception("query(): typo in outputType");
        }
    }

}

?>
