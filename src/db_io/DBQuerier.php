<?php

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVerifier.php";


interface Querier {
    public static function query($conn, $sqlKey, $paramValArr);
}

class SafeDBQuerier implements Querier {
    private static $querySQLSpecs = array(
        "set" => array(
            "n" => 6,
            "sql" => "CALL selectSet (?, ?, ?, ?, ?, ?)",
            "typeArr" => array(
                "setID",
                "bin", "bin",
                "uint", "uint",
                "tint"
            ),
            "outputType" => "array",
            // "columnNames" => array("ratVal", "objID"),
        ),

        "setInfo" => array(
            "n" => 1,
            "sql" => "CALL selectSetInfo (?)",
            "typeArr" => array(
                "setID"
            ),
            "outputType" => "array",
            // "columnNames" => array("userID", "subjID", "relID", "elemNum"),
        ),

        "setInfoSK" => array(
            "n" => 3,
            "sql" => "CALL selectSetInfoFromSecKey (?, ?, ?)",
            "typeArr" => array(
                "userOrGroupID", "termID", "relID"
            ),
            "outputType" => "array",
            // "columnNames" => array("setID", "elemNum"),
        ),

        "rating" => array(
            "n" => 2,
            "sql" => "CALL selectRating (?, ?)",
            "typeArr" => array(
                "termID", "setID"
            ),
            "outputType" => "array",
            // "columnNames" => array("ratVal"),
        ),

        "catDef" => array(
            "n" => 1,
            "sql" => "CALL selectCatDef (?)",
            "typeArr" => array(
                "catID"
            ),
            "outputType" => "array",
            // "columnNames" => array("catTitle", "superCatID"),
        ),

        "eTermDef" => array(
            "n" => 1,
            "sql" => "CALL selectETermDef (?)",
            "typeArr" => array(
                "eTermID"
            ),
            "outputType" => "array",
            // "columnNames" => array("eTermTitle", "catID"),
        ),

        "relDef" => array(
            "n" => 1,
            "sql" => "CALL selectRelDef (?)",
            "typeArr" => array(
                "relID"
            ),
            "outputType" => "array",
            // "columnNames" => array("objNoun", "subjCatID"),
        ),

        "superCatDefs" => array(
            "n" => 1,
            "sql" => "CALL selectSuperCatDefs (?)",
            "typeArr" => array(
                "catID"
            ),
            "outputType" => "array",
            // "columnNames" => array("catTitle", "superCatID"),
        ),

        "text" => array(
            "n" => 1,
            "sql" => "CALL selectText (?)",
            "typeArr" => array(
                "textID"
            ),
            "outputType" => "data",
            // "columnNames" => array("text"),
        )

        "binary" => array(
            "n" => 1,
            "sql" => "CALL selectBinary (?)",
            "typeArr" => array(
                "binID"
            ),
            "outputType" => "data",
            // "columnNames" => array("binary"),
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

        // branch according to the "outputType" and return the result.
        if ($sqlSpec["outputType"] === "array") {
            // return all rows as a multidimensional array.
            return $res->fetch_all();

        // } elseif ($sqlSpec["outputType"] === "assocArr") {
        //     // return a single row as an associative array.
        //     return $res->fetch_assoc();

        } elseif ($sqlSpec["outputType"] === "data") {
            // return the data itself.
            return $res->fetch_row()[0];

        } else {
            throw new Exception("query(): typo in outputType");
        }
    }

}

?>
