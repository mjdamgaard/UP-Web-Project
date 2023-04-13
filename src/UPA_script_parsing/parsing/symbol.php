<?php


function parseLexeme(lexArr, nextPos, str, successRequired) {
    if (lexArr[nextPos[0]].str == str) {
        nextPos[0] = nextPos[0] + 1;
        return true;
    }
    // if parsing has failed, potentially throw an exception and return false.
    if (successRequired) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected lexeme: '" + str + "'"
        );
    }
    return false;
}

?>
