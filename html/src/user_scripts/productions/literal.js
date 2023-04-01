

// export function parseLiteral(lexArr, nextPos, successRequired) {
//     let ret =
//         parseBoolLiteral(lexArr, nextPos, false) ||
//         parseNumLiteral(lexArr, nextPos, false) ||
//         parseStrLiteral(lexArr, nextPos, false) ||
//         parseArrLiteral(lexArr, nextPos, false) ||
//         parseObjLiteral(lexArr, nextPos, false);
//
//     if (successRequired && !ret) {
//         throw new ParseException(
//             lexArr[nextPos[0]], "Expected leteral"
//         );
//     }
//     return ret;
// }


const boolLiteralPatt = "/^((true)|(false))$/"
const numLiteralPatt =
    "/^(" +
        "(" +
            "[1-9][0-9]*(\.[0-9]*)?([eE][\+\-][1-9][0-9]*)?" +
        ")|(" +
            "\.[0-9]+([eE][\+\-][1-9][0-9]*)?" +
        ")|(" +
            "[1-9][0-9]*n?" +
        ")|(" +
            "0[xX][0-9a-fA-F]+n?" +
        ")|(" +
            "0[oO][0-7]+n?" +
        ")|(" +
            "0[bB][01]+n?" +
        ")" +
    ")$/";
const strLiteralPatt = "/^((\".*\")|(\'.*\'))$/";
// const arrLiteralPatt =

export function parseLiteral(lexArr, nextPos, successRequired) {
    if (
        lexArr[nextPos[0]].test(boolLiteralPatt) ||
        lexArr[nextPos[0]].test(numLiteralPatt) ||
        lexArr[nextPos[0]].test(strLiteralPatt);
    ) {
        nextPos[0] = nextPos[0] + 1;
        return true;
    }
    // if parsing has failed potentially trow an exception and return false.
    if (successRequired) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected numeric, string or boolean literal"
        );
    }
    return false;
}


// (14:33, 01.04.23) "Warning: Do not use an object literal at the beginning
// of a statement! This will lead to an error (or not behave as you expect),
// because the { will be interpreted as the beginning of a block."... ... This
// is actually good, cause that is also happens for me: The first '{' will
// always be parsed as a block statements (expecting a statement list after).
