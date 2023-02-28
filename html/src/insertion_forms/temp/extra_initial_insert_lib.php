<?php


function insertRels_hasLexItem_and_hasDescription(
    $str_lexItem_of_hasLexItem,
    $str_description_of_hasLexItem,
    $str_lexItem_of_hasDescription,
    $str_description_of_hasDescription
) {
    $conn = getConnectionOrDie();

    // prepare and bind.
    $stmt = $conn->prepare(
        "CALL insertRels_hasLexItem_and_hasDescription (?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "ssss",
        $str_lexItem_of_hasLexItem,
        $str_description_of_hasLexItem,
        $str_lexItem_of_hasDescription,
        $str_description_of_hasDescription
    );

    // set parameters and execute.
    // $lexItem = $str_lexItem;
    // $description = $str_description;
    $stmt->execute();

    return 0;
}












?>
