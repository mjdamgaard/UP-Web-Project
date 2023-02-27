<?php

$database_path = $_SERVER['DOCUMENT_ROOT'] . "/src/database/";
require_once ($database_path . "connect.php");
require_once ($database_path . "insert.php");


// define variables and set to empty values
$lexItem = $description = "";
$userid = $new_id = 0;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // $lexItem = sanitize_input($_POST["lexItem"]);
    // $description = sanitize_input($_POST["description"]);
    $user_id = intval($_POST["userID"]);
    $lexItem = $_POST["lexItem"]; // UNSANITIZED, CAREFUL!
    $description = $_POST["description"]; // UNSANITIZED, CAREFUL!

    // insert term without warning is lexItem string already exists in the DB.
    // ...And without nounce or user validation at all..
    insertSimpleTerm($lexItem, $description, $user_id, $new_id);
}

// function sanitize_input($data) {
//     $data = trim($data);
//     // $data = stripslashes($data);
//     $data = htmlspecialchars($data);
//     return $data;
// }



?>

<!-- <div>
    Note that backslashes are stripped from input, turning e.g.
    \&#34; into &#34; and \\ into \.
</div> -->

<form
    method="post"
    action=<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>
    autocomplete="on"
>
    <p>
        <label for="descriptionInput">User ID:</label>
        <input type="text" id="userIDInput" name="userID">
    </p>
    <p>
        <label for="lexItemInput">Lexical item:</label>
        <input type="text" id="lexItemInput" name="lexItem">
    </p>
    <p>
        <label for="descriptionInput">Description:</label>
        <input type="text" id="descriptionInput" name="description">
    </p>
    <input type="submit" name="submit" value="Submit">
</form>
