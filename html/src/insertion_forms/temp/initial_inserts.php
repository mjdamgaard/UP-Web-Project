<?php

$database_path = $_SERVER['DOCUMENT_ROOT'] . "/src/database/";
require_once ($database_path . "connect.php");
require_once ($database_path . "insert.php");

require_once "extra_initial_insert_lib.php";



if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // $lexItem = sanitize_input($_POST["lexItem"]);
    // $description = sanitize_input($_POST["description"]);
    // $user_id = 1;

    // $str_lexItem_of_hasLexItem = ".Lexical item:";
    // $str_description_of_hasLexItem =
    //     file_get_contents("description_of_hasLexItem.txt");
    //
    // $str_lexItem_of_hasDescription = ".Description:";
    // $str_description_of_hasDescription =
    //     file_get_contents("description_of_hasDescription.txt");
    //
    // // insertion functions.
    // insertRels_hasLexItem_and_hasDescription(
    //     $str_lexItem_of_hasLexItem,
    //     $str_description_of_hasLexItem,
    //     $str_lexItem_of_hasDescription,
    //     $str_description_of_hasDescription
    // );


    // list($newID, $ec) = insertOrFindCat("Terms", 1, NULL);
    $result = insertOrFindCat("Terms", 1, NULL);
    // list($newID, $ec) = $outputs;
    $id = $result["id"];
    $ec = $result["ec"];

    echo "new (or old) ID = " . strval($id) . "<br>";
    echo "exit code = " . strval($ec) . "<br>";

}

// function sanitize_input($data) {
//     $data = trim($data);
//     // $data = stripslashes($data);
//     $data = htmlspecialchars($data);
//     return $data;
// }


// $arr = array($lexItem, $description, $user_id, $new_id);
// foreach($arr as $x){
//     echo strval($x) . "<br>";
// }


?>


<form
    method="post"
    action=<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>
    autocomplete="on"
>
    <!-- <p>
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
    </p> -->
    <input type="submit" name="submit" value="Insert initial terms">
</form>
