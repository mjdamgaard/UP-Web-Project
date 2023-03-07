<?php

$database_path = $_SERVER['DOCUMENT_ROOT'] . "/src/database/";
require_once ($database_path . "connect.php");
require_once ($database_path . "insert.php");

require_once "extra_initial_insert_lib.php";



if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $res = insertOrFindCat("Terms", 0, NULL);
    $id = $res["id"];
    $ec = $res["ec"];

    echo "new (or old) ID = " . strval($id) . "<br>";
    echo "exit code = " . strval($ec) . "<br>";


    insertOrFindCat("Terms", 0, NULL);
    insertOrFindCat("Categories", 1, NULL);
    insertOrFindCat("Standard terms", 1, NULL);
    insertOrFindCat("Relations", 1, NULL);

    insertOrFindCat("Users", 1, NULL);
    insertOrFindCat("User groups", 1, NULL);

    insertOrFindCat("Data terms", 1, NULL);

    insertOrFindCat("Keyword strings", 7, NULL);
    insertOrFindCat("Sets", 7, NULL);
    insertOrFindCat("Lists", 7, NULL);
    insertOrFindCat("Texts", 7, NULL);
    insertOrFindCat("Binaries", 7, NULL);
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
