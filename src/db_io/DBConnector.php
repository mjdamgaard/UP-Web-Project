<?php // namespace db_io;

class DBConnector {

    public static function getConnection(
        $servername, $dbname, $username, $password
    ) {
        // create connection.
        $conn = new \mysqli($servername, $username, $password, $dbname);

        return $conn;
    }


    public static function getConnectionOrDie() {
        // create connection.
        $conn = self::getConnection();

        // verify connection (or throw).
        if ($conn->connect_error) {
            throw new \Exception("Connection failed: " . $conn->connect_error);
        }

        return $conn;
    }

    public static function executeSuccessfulOrDie($stmt, $paramValArr) {
        $stmt->execute($paramValArr);

        $error = \mysqli_stmt_error($stmt);
        if ($error) {
            throw new \Exception("MySQLi stmt error: " . $error);
        }
    }

}
?>
