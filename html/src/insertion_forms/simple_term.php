<?php

$database_path = "src/database/";
require_once $database_path . "connect.php";
require_once $database_path . "insert.php";


// define variables and set to empty values
$lexItem = $description = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $lexItem = sanitize_input($_POST["lexItem"]);
    $description = sanitize_input($_POST["description"]);
    // $password = test_input($_POST["password"]);

    //look up userid in database
    $conn = "";
    if (makeConnection($conn)) {
        error_log("connection failed!");
    }
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

function sanitize_input($data) {
    $data = trim($data);
    // $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}



?>

<!-- <div>
    Note that backslashes are stripped from input, turning e.g.
    \&#34; into &#34; and \\ into \.
</div> -->

<form
    method="post"
    action=<?php echo '\"'.htmlspecialchars($_SERVER["PHP_SELF"]) '\"';?>
    autocomplete="on"
>
    <p>
        <label for="lexItemInput">Lexical item:</label>
        <input type="text" id="lexItemInput" name="lexItem">
    </p>
    <p>
        <label for="descriptionInput">Description:</label>
        <input type="text" id="descriptionInput" name="description">
    </p>
</form>
