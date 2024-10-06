<?php


$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/err/";
require_once $err_path . "errors.php";


$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/db_io/";
require_once $db_io_path . "DBConnector.php";



class Inserter {

    public $creationIDs = array();

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
        $this->$creationIDs = array_map(
            function($val) {return strval($val[0]);},
            $stmt->get_result()->fetch_all()
        );

        // Then go through each one again and replace any relative keys..
        $conn->close();
    }


    public function insertPublicEntities($userID, $defArr, $firstNewCrID) {
        // Get connection to the database and prepare the MySQLi statement.
        require $db_io_path . "sdb_config.php";
        $conn = DBConnector::getConnectionOrDie(
            DB_SERVER_NAME, DB_DATABASE_NAME, DB_USERNAME, DB_PASSWORD
        );
        $sql = "CALL insertOrFindEntity (?, ?, ?)";
        $stmt = $conn->prepare($sql);

        // First construct all the initial defStrings.
        $defStrArr = array_map('json_encode', $defArr);
        
        // We repeat the following process two times to make sure that that all
        // creation references that can be replaced by an outID from the first
        // iteration will be so in the second iteration.
        for ($i = 0; $i < 2; $i++) {
            // Insert all entities one at a time, and store each one's outID.
            // If a defStr contains a creation reference, substitute it first
            // if there the given creation already exists.
            $explodePattern = "/[^@\\\\]+|(\\\\.)+|@[a-z0-9]+|./";
            $crRefPattern = "/^@cr[1-9][0-9]*$/";
            foreach ($defStrArr as $ind => $defStr) {
                // First explode the deStr into an array of strings that either
                // are or are not creation references.
                preg_match_all(
                    $explodePattern, $defStr, $matches, PREG_SET_ORDER
                );
                // Then substitute any creation reference if possible.
                $explodedDefStr = array_map(
                    function($val) {return $val[0];},
                    $matches
                );
                foreach ($explodedDefStr as $matchInd => $match) {
                    if (preg_match($crRefPattern, $match)) {
                        $crID = intval(substr($match, 3));
                        $creationID = $this->$creationIDs[$crID];
                        if ($creation) {
                            $explodedDefStr[$matchInd] = "@" . $creationID;
                        }
                    }
                }
                // Then implode back the exploded defStr with the substitutions.
                $subbedDefStr = implode($explodedDefStr);

                $paramValArr = array($userID, $subbedDefStr, 1);
                DBConnector::executeSuccessfulOrDie($stmt, $paramValArr);
                $outID = $stmt->get_result()->fetch_assoc()["outID"];
                $this->creationIDs[$firstNewCrID + $ind] = strval($outID);
            }
        }
        
        $conn->close();
    }


}

?>
