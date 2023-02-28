<?php


function insertRels_hasLexItem_and_hasDescription(
    $str_lexItem_of_hasLexItem,
    $str_description_of_hasLexItem,
    $str_lexItem_of_hasDescription,
    $str_description_of_hasDescription
) {
    $conn = getConnectionOrDie();


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

    $stmt->execute();

    return 0;
}












?>
