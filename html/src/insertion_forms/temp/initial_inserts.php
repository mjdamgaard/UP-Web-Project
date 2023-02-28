<?php

$database_path = $_SERVER['DOCUMENT_ROOT'] . "/src/database/";
require_once ($database_path . "connect.php");
require_once ($database_path . "insert.php");

require_once "extra_initial_insert_lib.php";


// define variables and set to empty values
$lexItem = $description = "";
$userid = $new_id = 0;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // $lexItem = sanitize_input($_POST["lexItem"]);
    // $description = sanitize_input($_POST["description"]);
    $user_id = 1;

    $str_lexItem_of_hasLexItem = ".Lexical item:"
    $str_description_of_hasLexItem =
        file_get_contents("description_of_hasLexItem.txt");
////////
// "This relation states about its Subject and its Object, " .
// "the latter of which should be a text string that is part of an " .
// "English sentence with a meaning attached to it " .
// "(i.e. a lexical item), that the following is true: " .
// "The Object (a string) forms a lexical item that can be seen " .
// "as defining the Subject.\n" .
// "\t" .
// "For instance, if the Subject can be referenced by a noun, then the " .
// "Object could be a string forming that noun." .
// "And if the Subject is a relation that can be referenced by a verb, " .
// "then the Object could be a string forming that verb.\n" .
// "\t" .
// "A special example of the latter case is if the Subject is this very " .
// "relation descibed by this description. In that case, the Object " .
// "could be the string: \'can be referenced by the lexical item given " .
// "by\'.\n" .
// // I am choosing to let periods and commas be outside of the (single)
// // quotation marks when it references a specific string or character.
// "\t" .
// "However, a shortened version of this lexical item might also do, " .
// "and in fact even prefered in some cases, especially for relations " .
// "such as this. This is why \"has lexical item =\" has been chosen " .
// "as the original lexical item of this relation. We thus propose the " .
// "following standard for shortening lexical items of relations. " .
// "We propose that the lexical item is formulated as according the " .
// "syntax: \"has (a|an)? <noun describing the Object>(=|:)\". " .
// "the article, \'a\' or \'an\', should then be included when " .
// "it is expected that users will generally be interested in querying " .
// "for several fitting Objects for a given Subject. And they should " .
// "be omitted, when it is expected that users will only be interested " .
// "to query for the best fitting Object for a given Subject."
// "\t" .
// "As a standard, we propose that first letters are not capitalized, " .
// "except if the word is part of a proper noun or an abbreviation that " .
// "requires capitalization."
////////

    $str_lexItem_of_hasDescription = "";
    $str_description_of_hasDescription = "";

    // insertion functions.
    insertRels_hasLexItem_and_hasDescription(
        $str_lexItem_of_hasLexItem,
        $str_description_of_hasLexItem,
        $str_lexItem_of_hasDescription,
        $str_description_of_hasDescription
    )




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
