<?php

$database_path = $_SERVER['DOCUMENT_ROOT'] . "/src/database/";
require_once ($database_path . "connect.php");
require_once ($database_path . "insert.php");

require_once "extra_initial_insert_lib.php";



if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // categories.
    insertOrFindCat("Categories", 0, NULL);
    insertOrFindCat("Terms", 0, NULL);
    // insertOrFindCat("Standard terms", 1, NULL);
    insertOrFindCat("Relations", 2, NULL);

    $res = insertOrFindCat("Users and bots", 2, NULL);
    $catUserEtcID = $res["id"];

    insertOrFindCat("Users", $catUserEtcID, NULL);
    insertOrFindCat("User groups", $catUserEtcID, NULL);

    $res = insertOrFindCat("Internal data", 1, NULL);
    $catDataTermsID = $res["id"];

    insertOrFindCat("Keyword strings", $catDataTermsID, NULL);
    insertOrFindCat("Constant sets", $catDataTermsID, NULL);
    insertOrFindCat("Lists", $catDataTermsID, NULL);
    insertOrFindCat("Texts", $catDataTermsID, NULL);
    insertOrFindCat("Binaries", $catDataTermsID, NULL);

    // relations.
    insertOrFindRel("Subcategories", 1, NULL);
    insertOrFindRel("Elements", 1, NULL);





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
