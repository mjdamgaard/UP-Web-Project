<?php

/* All text outputs are converted to safe html texts (using the
 * htmlspecialchars() function) in this layer!
 **/

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
            "outputType" => "numArr",
            "columnNames" => array("ratVal", "objID"),
            "unsafeColumns" => array()
        ),

        "setInfo" => array(
            "n" => 1,
            "sql" => "CALL selectSetInfo (?)",
            "typeArr" => array(
                "setID"
            ),
            "outputType" => "assocArr",
            "columnNames" => array("userID", "subjID", "relID", "elemNum"),
            "unsafeColumns" => array()
        ),

        "setInfoSK" => array(
            "n" => 3,
            "sql" => "CALL selectSetInfoFromSecKey (?, ?, ?)",
            "typeArr" => array(
                "userOrGroupID", "termID", "relID"
            ),
            "outputType" => "assocArr",
            "columnNames" => array("setID", "elemNum"),
            "unsafeColumns" => array()
        ),

        "rating" => array(
            "n" => 2,
            "sql" => "CALL selectRating (?, ?)",
            "typeArr" => array(
                "termID", "setID"
            ),
            "outputType" => "assocArr",
            "columnNames" => array("ratVal"),
            "unsafeColumns" => array()
        ),

        "catDef" => array(
            "n" => 1,
            "sql" => "CALL selectCatDef (?)",
            "typeArr" => array(
                "catID"
            ),
            "outputType" => "assocArr",
            "columnNames" => array("catTitle", "superCatID"),
            "unsafeColumns" => array(0) // this means that first column has to
            // be sanitized (by calling htmlspecailchars()).
        ),

        "eTermDef" => array(
            "n" => 1,
            "sql" => "CALL selectETermDef (?)",
            "typeArr" => array(
                "eTermID"
            ),
            "outputType" => "assocArr",
            "columnNames" => array("eTermTitle", "catID"),
            "unsafeColumns" => array(0)
        ),

        "relDef" => array(
            "n" => 1,
            "sql" => "CALL selectRelDef (?)",
            "typeArr" => array(
                "relID"
            ),
            "outputType" => "assocArr",
            "columnNames" => array("objNoun", "subjCatID"),
            "unsafeColumns" => array(0)
        ),

        "superCatDefs" => array(
            "n" => 1,
            "sql" => "CALL selectSuperCatDefs (?)",
            "typeArr" => array(
                "catID"
            ),
            "outputType" => "numArr",
            "columnNames" => array("catTitle", "superCatID"),
            "unsafeColumns" => array(0) // this means that the whole first
            // column has to be sanitized (by calling htmlspecailchars()).
        ),

        "text" => array(
            "n" => 1,
            "sql" => "CALL selectText (?)",
            "typeArr" => array(
                "textID"
            ),
            "outputType" => "assocArr",
            "columnNames" => array("text"),
            "unsafeColumns" => array(0)
        )

        // "binary" => array(
        //     "n" => 1,
        //     "sql" => "CALL selectBinary (?)",
        //     "typeArr" => array(
        //         "binID"
        //     ),
        //     "outputType" => "assocArr",
        //     "columnNames" => array("binary"),
        //     "unsafeColumns" => array()
        // )
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

        // branch according to the "outputType" and return a sanitized result.
        if ($sqlSpec["outputType"] === "numArr") {
            // fetch all rows as a multidimensional array.
            $rows = $res->fetch_all();
            // return $rows as is if all columns are safe, or else loop through
            // each row and sanitize all unsafe columns.
            if ($sqlSpec["unsafeColumns"] === array()) {
                return $rows;
            } else {
                foreach ($rows as &$row) {
                    foreach ($sqlSpec["unsafeColumns"] as $columnNum) {
                        $row[$columnNum] = htmlspecialchars($row[$columnNum]);
                    }
                }
                unset($row);
                return $rows;
            }
        } elseif ($sqlSpec["outputType"] === "assocArr") {
            // fetch a single row as an associative array.
            $row = $res->fetch_assoc();
            // return $row as is if all columns are safe, or else sanitize all
            // unsafe columns.
            if ($sqlSpec["unsafeColumns"] === array()) {
                return $row;
            } else {
                foreach ($sqlSpec["unsafeColumns"] as $columnNum) {
                    $key = $sqlSpec["columnNames"][$columnNum];
                    $row[$key] = htmlspecialchars($row[$key]);
                }
                return $row;
            }
        } else {
            throw new Exception("query(): typo in outputType");
        }
    }

}

?>
