<?php


// define variables and set to empty values
$userid = $password = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $userid = test_input($_POST["userid"]);
    // $password = test_input($_POST["password"]);

    //look up userid in database
    $conn = get_connection();
    $sql = "SELECT id FROM mydatabase.Users
        WHERE id = '" . strval($userid) . "'";
    $result = $conn->query($sql);

    if ($result->num_rows === 1) {
        error_log("hello error log!");
        // stop session if user has already started one.
        if (session_status() !== PHP_SESSION_NONE) {
            session_abort();
        }
        session_start();
        $_SESSION['userid'] = $userid;
        header("Location: " . "index.php");
    } else {
        echo "<br>User does not exist! Try again!";
    }
    $conn->close();
}






function test_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}



echo '
    <form
        method="post"
        action='
        . htmlspecialchars($_SERVER['PHP_SELF'])
        . '
        autocomplete="on"
    >
        User ID: <input type="text" name="userid">
        <br><br>
        <!--
        Password: <input type="text" name="password">
        <br><br>
        -->
        <input type="submit" name="submit" value="Submit">
    </form>
';





?>
