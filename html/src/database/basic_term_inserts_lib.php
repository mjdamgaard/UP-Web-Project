
/* This library is for the basic insert functions used to initialize
 * the semantic tree (adding some fundamental terms).
 * I intend to also write more advanced term insertion functions,
 * but I will then do so in another library so that I can make a
 * term insertion script for the fundamental terms which only depennds
 * on this basic (and more constant) library.
 **/

<?php
namespace Basic;

function getSQL_addString($inStr, $idVarName) {
    $sql = "";

    $str_selectID = 'BEGIN DECLARE CALL SelectNextTermID (0x20)'

    $sql .= 'INSERT INTO Strings (id, str) VALUES ';
    $sql .= '(' . $str_selectID . ', \"' . $inStr . '\");';

    return $sql;
}


function getSQL_addObjNounRelation($subjType, $objNoun, $objType, $dscrptn) {
    $sql = "";
    if (strlen($subjType) != 0) {
        $sql .= "(".$subjType.") ";
    }
    $sql .= "has ".$objNoun . " ";
    if (strlen($objType) != 0) {
        $sql .= "(".$objType.") ";
    }
    $sql .= "=";

    if (strlen($dscrptn) != 0) {

    }

    return $sql;
}


?>
