<?php


$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/err/";
require_once $err_path . "errors.php";


$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/db_io/";
require_once $db_io_path . "DBConnector.php";



class Inserter {

    public $creations = array();

    public function getPublicCreations($userID) {
        // Get connection to the database and prepare the MySQLi statement.
        require $db_io_path . "sdb_config.php";
        $conn = DBConnector::getConnectionOrDie(
            DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
        );
        $sql = "CALL selectCreations (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);

        // Then fetch the creations
        $paramValArr = array($userID, 100000, 0, 1);
        DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
        $this->$creations = $stmt->get_result()->fetch_all();

        // Then go through each one again and replace any relative keys..
        $conn->close();
    }


    public function insertPublicEntities($userID, $defArr) {
        // Get connection to the database and prepare the MySQLi statement.
        require $db_io_path . "sdb_config.php";
        $conn = DBConnector::getConnectionOrDie(
            DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
        );
        $sql = "CALL insertOrFindEntity (?, ?, ?)";
        $stmt = $conn->prepare($sql);

        // First construct all the initial defStrings.
        $defStrArr = array_map('json_encode', $defArr);

        // Then go through each def and replace any relative references with
        // ones to matching existing creations if any.
        $pattern = "/(^|[^@\\\\])(\\\\.)*@r[1-9][0-9]*/";
        foreach ($defStrArr as $ind => $defStr) {
            $defStrArr[$ind] = preg_replace($pattern, "...", "...");
        }

        // First insert all entities one at a time, and store each one's outID.
        foreach ($defArr as $def) {
            $paramValArr = array($userID, json_encode($def), 1);
            DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
            $outID = $stmt->get_result()->fetch_assoc()["outID"];
            array_push($entIDArr, $outID);
        }

        // Then go through each one again and replace any relative keys..
        $conn->close();
    }


}

?>
