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

    // insert or find term.
    $stmt = $conn->prepare(
        "CALL insertOrFindCat (?, ?, ?, @new_id, @exit_code)"
    );
    $stmt->bind_param(
        "sii",
        $titel,
        $superCatID,
        $user_id
    );
    executeSuccessfulOrDie($stmt);

    // get new_id and exit_code from insertion.
    $stmt = $conn->prepare(
        "SELECT @new_id, @exit_code"
    );
    executeSuccessfulOrDie($stmt);

    $results = $stmt->get_result()->fetch_assoc();
    // print_r($results); echo "<br>";
    $new_id = $results["@new_id"];
    $ec = $results["@exit_code"];

    echo "in-scope new_id = " . strval($new_id) . "<br>";
    echo "in-scope exit_code = " . strval($ec) . "<br>";

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
