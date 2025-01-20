<?php // namespace db_io;

class DBConnector {

    public static function getConnection(
        $servername, $dbname, $username, $password
    ) {
        // create connection.
        $conn = new \mysqli($servername, $username, $password, $dbname);

        return $conn;
    }


    public static function getConnectionOrDie(
        $servername, $dbname, $username, $password
    ) {
        // create connection.
        $conn = self::getConnection($servername, $dbname, $username, $password);

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


    public static function executeMultiQuerySuccessfulOrDie(
        $conn, $sql, $paramValArr
    ) {
        foreach ($paramValArr as $val) {
            $replace = "'" . $conn->real_escape_string($val) . "'";
            $sql = preg_replace("/\\?/", $replace, $sql, 1);
        }
        $conn->multi_query($sql);

        $error = \mysqli_error($conn);
        if ($error) {
            throw new \Exception("MySQLi error: " . $error);
        }
    }

}
?>
