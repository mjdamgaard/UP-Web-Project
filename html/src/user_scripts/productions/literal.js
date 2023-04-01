

const boolLiteralPatt = "/^((true)|(false))$/"

const decIntPatt = "([1-9][0-9]*(_[0-9]+)*)";
const decimalPatt = "([0-9]+(_[0-9]+)*)";
const decExponentPatt = "([eE][\+\-]" + decIntPatt + ")"
const numLiteralPatt =
    "/^(" +
        "(" +
            decIntPatt + "\." + decimalPatt + "?" + decExponentPatt + "?" +
        ")|(" +
            "\." + decimalPatt + decExponentPatt + "?" +
        ")|(" +
            decIntPatt + "n?" +
        ")|(" +
            "0[xX][0-9a-fA-F]+(_[0-9a-fA-F]+)*n?" +
        ")|(" +
            "0[oO][0-7]+(_[0-7]+)*n?" +
        ")|(" +
            "0[bB][01]+(_[01]+)*n?" +
        ")" +
    ")$/";

// the strings are already partly parsed at this point, namely such that we
// know that the begin and end with the same ' or " character, and with no
// unescaped similar character in between. So in regards to qoutation marks,
// we just need to check that the first character is ' or " to know that the
// literal is a (potential) string literal to begin with. However, we still
// need ... Hm, never mind, let me just double check about the quote
// characters..
const strLiteralPatt =
    "/^(" +
        "(" +
            "\"" +
                "(" +
                    "[^\\\"]" +
                "|" +
                    "(\\[^xu0-9a-fA-F])" +
                "|" +
                    "(\\x[0-9a-fA-F]{2})" +
                "|" +
                    "(\\u[0-9a-fA-F]{4})" +
                "|" +
                    "(\\u\{[0-9a-fA-F]{1,5}\})" +
                ")*" +
            "\""
        ")|(" +
            "\'" +
                "(" +
                    "[^\\\']" +
                "|" +
                    "(\\[^xu0-9a-fA-F])" +
                "|" +
                    "(\\x[0-9a-fA-F]{2})" +
                "|" +
                    "(\\u[0-9a-fA-F]{4})" +
                "|" +
                    "(\\u\{[0-9a-fA-F]{1,5}\})" +
                ")*" +
            "\'"
        ")" +
    ")$/";



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
