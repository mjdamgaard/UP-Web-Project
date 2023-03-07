<?php

$database_path = "";
require_once $database_path . "connect.php";






// function insertEntity(
//     $tableName, $columnNameTuple, $columnTypes, $valueArr, $new_id
// ) {
//     $conn = getConnectionOrDie();
//
//     $stmt = $conn->prepare(
//         "INSERT INTO " . $tableName . $columnNameTuple .
//         "VALUES (" . $values . ")"
//     );
//     $stmt->bind_param(
//         $columnTypes,
//         $lexItem, $description,
//         $user_id,
//         $new_id,
//         $exit_code_lex, $exit_code_dscr
//     );
//
//     executeOrDie($stmt);
//
//     $new_id = ;
//     return 0;
// }


function insertOrFindCat($titel, $superCatID, $user_id, $new_id) {
    $conn = getConnectionOrDie();

    $exit_code = -1;

    $stmt = $conn->prepare(
        // "INSERT INTO Categories (title, super_cat)
        //  VALUES (?, ?);
        //  INSERT INTO Creators (term_t, term_id, user_id)
        //  VALUES ('cat', ?);
        // "
        "CALL insertOrFindCat (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "siiii",
        $titel,
        $superCatID,
        $user_id,
        $new_id,
        $exit_code
    );

    executeOrDie($stmt);

    echo "in-scope new_id = " . strval($new_id) . "<br>";
    echo "in-scope exit_code = " . strval($exit_code) . "<br>";

    return $exit_code;
}










function insertStdTerm($lexItem, $description, $user_id, $new_id) {

}








// function insertSimpleTerm($lexItem, $description, $user_id, $new_id) {
//     $conn = getConnectionOrDie();
//
//
//     $stmt = $conn->prepare(
//         "CALL insertTerm (?, ?, ?, ?, ?, ?)"
//     );
//     $stmt->bind_param(
//         "ssiiii",
//         $lexItem, $description,
//         $user_id,
//         $new_id,
//         $exit_code_lex, $exit_code_dscr
//     );
//
//     $stmt->execute();
//
//     return array($exit_code_lex, $exit_code_dscr);
// }










// function appendSQL_addObjNounRelation(
//     $subjType, $objNoun, $objType, $dscrptn
// ) {
//     $sql = "";
//     if (strlen($subjType) != 0) {
//         $sql .= "(".$subjType.") ";
//     }
//     $sql .= "has ".$objNoun . " ";
//     if (strlen($objType) != 0) {
//         $sql .= "(".$objType.") ";
//     }
//     $sql .= "=";
//
//     if (strlen($dscrptn) != 0) {
//
//     }
//
//     return $sql;
// }

?>
