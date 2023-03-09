<?php

$database_path = $_SERVER['DOCUMENT_ROOT'] . "/src/database/";
require_once ($database_path . "connect.php");
require_once ($database_path . "insert.php");

require_once "extra_initial_insert_lib.php";



if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // categories.
    insertOrFindCategory("Categories", 0, NULL);
    insertOrFindCategory("Terms", 0, NULL);
    // insertOrFindCategory("Standard terms", 1, NULL);
    insertOrFindCategory("Relations", 2, NULL);

    $res = insertOrFindCategory("Users and bots", 2, NULL);
    $catUserEtcID = $res["id"];

    insertOrFindCategory("Users", $catUserEtcID, NULL);
    insertOrFindCategory("User groups", $catUserEtcID, NULL);

    $res = insertOrFindCategory("Internal data", 1, NULL);
    $catDataTermsID = $res["id"];

    insertOrFindCategory("Keyword strings", $catDataTermsID, NULL);
    insertOrFindCategory("Lists", $catDataTermsID, NULL);
    insertOrFindCategory("Texts", $catDataTermsID, NULL);
    insertOrFindCategory("Binaries", $catDataTermsID, NULL);

    // relations.
    insertOrFindRelation("Subcategories", 1, NULL);
    insertOrFindRelation("Elements", 1, NULL);


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


<!-- <form action="javascript:void(0);" onsubmit="myFunction()">
  Enter name: <input type="text" name="fname">
  <input type="submit" value="Submit">
</form>

<script>
function myFunction() {
  alert("The form was submitted");
}
</script> -->


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
