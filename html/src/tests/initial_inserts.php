<?php

$src_path = $_SERVER['DOCUMENT_ROOT'] . "/src/";
require_once $src_path . "db_io.php";




if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // categories.
    db_io\insertOrFindCategory("Categories", 1, NULL);
    // insertOrFindCategory("Standard terms", 1, NULL);
    db_io\insertOrFindCategory("Relations", 1, NULL);

    $res = db_io\insertOrFindCategory("Users and bots", 1, NULL);
    $catUserEtcID = $res["id"];

    db_io\insertOrFindCategory("Users", $catUserEtcID, NULL);
    db_io\insertOrFindCategory("User groups", $catUserEtcID, NULL);

    $res = db_io\insertOrFindCategory("Internal data", 1, NULL);
    $catDataTermsID = $res["id"];

    db_io\insertOrFindCategory("Keyword strings", $catDataTermsID, NULL);
    db_io\insertOrFindCategory("Lists", $catDataTermsID, NULL);
    db_io\insertOrFindCategory("Texts", $catDataTermsID, NULL);
    db_io\insertOrFindCategory("Binaries", $catDataTermsID, NULL);

    // relations.
    db_io\insertOrFindRelation("Subcategories", 1, NULL);
    db_io\insertOrFindRelation("Elements", 1, NULL);



    echo db_io\getCatSafeTitle("01") . "<br>";
    echo db_io\getCatSafeTitle("02") . "<br>";
    echo db_io\getCatSafeTitle("03") . "<br>";

    // // exit;
    // // insertOrFindRelation("I should not exist", 1, NULL);
    // if (!isset($_POST["protocol"])) {
    //    echo "Error: No protocol specified";
    //    // exit;
    // }
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
