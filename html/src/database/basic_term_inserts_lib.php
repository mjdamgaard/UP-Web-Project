
/* This library is for the basic insert functions used to initialize
 * the semantic tree (adding some fundamental terms).
 * I intend to also write more advanced term insertion functions,
 * but I will then do so in another library so that I can make a
 * term insertion script for the fundamental terms which only depennds
 * on this basic (and more constant) library.
 **/

<?php
namespace Basic;

function appendSQL_addString($sql, $inStr, $idVarName) {

    $str_selectID = 'BEGIN DECLARE CALL SelectNextTermID (0x20)'

    // Nå, nej jeg burde faktisk hellere lave disse funktioner som SQL-
    // procedures..

    $sql .= 'INSERT INTO Strings (id, str) VALUES ';
    $sql .= '(' . $str_selectID . ', \"' . $inStr . '\");';

    return $sql;
}


function appendSQL_addObjNounRelation($subjType, $objNoun, $objType, $dscrptn) {
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
