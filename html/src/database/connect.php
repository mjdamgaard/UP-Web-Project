<?php

function getConnection() {
    $servername = "localhost";
    $username = "mads";
    $password = "lemmein";
    $dbname = "mydatabase";


    // create connection.
    $conn = new mysqli($servername, $username, $password, $dbname);

    return $conn;
}


function getConnectionOrDie() {
    $servername = "localhost";
    $username = "mads";
    $password = "lemmein";
    $dbname = "mydatabase";


    // create connection.
    $conn = new mysqli($servername, $username, $password, $dbname);
    // verify connection (or die).
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    return $conn;
}


?>
