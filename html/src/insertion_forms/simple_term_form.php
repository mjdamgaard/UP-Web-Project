<?php

$database_path = "src/database/";
require_once $database_path . "connect.php";
require_once $database_path . "insert.php";


// define variables and set to empty values
$lexItem = $description = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // $lexItem = sanitize_input($_POST["lexItem"]);
    // $description = sanitize_input($_POST["description"]);
    $lexItem = $_POST["lexItem"]; // UNSANITIZED, CAREFUL!
    $description = $_POST["description"]; // UNSANITIZED, CAREFUL!

    $new_id = 0;

    // insert term without warning is lexItem string already exists in the DB.
    insertSimpleTerm($lexItem, $description, $new_id);
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
