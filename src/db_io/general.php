<?php namespace db_io;

function getConnection() {
    $servername = "localhost";
    $username = "mads";
    $password = "lemmein";
    $dbname = "mydatabase";


    // create connection.
    $conn = new \mysqli($servername, $username, $password, $dbname);

    return $conn;
}


function getConnectionOrDie() {
    // create connection.
    $conn = getConnection();

    // verify connection (or die).
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    return $conn;
}

function executeSuccessfulOrDie($stmt) {
    $stmt->execute();

    $error = \mysqli_stmt_error($stmt);
    if ($error) {
        die("MySQLi stmt error: " . $error);
    }

    return 0;
}




?>
