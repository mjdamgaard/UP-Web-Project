

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
