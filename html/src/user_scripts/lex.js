
class Lexeme {
    constructor(str, pos1, pos2) {
        this.str = str;
        this.pos1 = pos1;
        this.pos2 = pos2;
    }
}


export function lex(script) {
    // first check for unwanted whitespace characters.
    if (!script.test("/^( \n\S)*$/")) {
        throw new Exception("lex(): unwanted whitespace characters");
    }

    // initialize return array.
    var lexArr = [];
    // initialize position as a singleton array, such that it can be passed to
    // fuctions in a way that allows them to increase the position during
    // execution.
    var nextPos = [0];
    // record script length.
    const len = script.length;

    // loop and append each lexeme in input script to lexArr.
    var lexemeWasFound = true;
    while (nextPos[0] < len && lexemeWasFound) {
        lexemeWasFound =
            lexWhitespace(script, len, lexArr, nextPos) ||
            lexWord(script, len, lexArr, nextPos) ||
            lexNum(script, len, lexArr, nextPos) ||
            lexStrLiteral(script, len, lexArr, nextPos) ||
            lexSymbol(script, len, lexArr, nextPos) ||
            lexComment(script, len, lexArr, nextPos);
    }
    // throw exception containing the current position if the whole script
    // could not be lexed.
    if (nextPos[0] != len) {
        throw {unknownLexemeAt:nextPos[0]};
    }
    // return lexeme array if the whole script was lexed.
    return lexArr;

        if (nextChar.test("/^\s/")) {
            lexWhitespace(script, len, lexArr, nextPos);

        } else if (nextChar == '"') {
            lexDblQuoteStr(script, len, lexArr, nextPos);

        } else if (nextChar == "'") {
            lexSnglQuoteStr(script, len, lexArr, nextPos);

        } else if (nextChar.test("/^[a-zA-Z_]/")) {
            lexWord(script, len, lexArr, nextPos);

        } else if (nextChar.test("/^[0-9]/")) {
            lexNum(script, len, lexArr, nextPos);

        } else if (lexSymbol(script, pos, len, nextPos))
        else if (nextChar == "/")) {
            // check if next two characters are the start of a comment and
            // branch accordingly.
            let nextTwoChars = script.substring(nextPos[0], nextPos[0] + 2)
            if (nextTwoChars == "//") {
                lexSnglLineComment(script, len, lexArr, nextPos);

            } else if (nextTwoChars == "/*") {
                lexMltLineComment(script, len, lexArr, nextPos);

            } else if (!lexSymbol(script, pos, len, nextPos)) {
                throw {unknownLexemeAt:nextPos[0]};
            }

        } else {
            if (!lexSymbol(script, len, lexArr, nextPos)) {
                throw new Exception(
                    "lex(): invalid lexeme at " + nextLexObj.pos.toString()
                );
            }
        }
        // if nextChar was not whitespace, append the recorded lexeme to lexArr.
        if (nextLexObj.nextLex != "") {
            lexArr[lexArrLen] = nextLexObj.nextLex;
            lexArrLen++;
        }
        // increase pos to the position of the next potential lexeme.
        pos = nextLexObj.nextPos;
    }
    // return array of all lexemes in the input script.
    return lexArr;
}



function lexWhitespace(script, len, lexArr, nextPos) {
    // get and test the first character.
    var nextChar = script.substring(nextPos[0], nextPos[0] + 1);
    if (!nextChar.test("/^\s/")) {
        // return false immedeately if first character is not a whitespace.
        return false;
    }
    // match as many whitespaces as possible.
    do {
        nextPos[0] = nextPos[0] + 1;
        nextChar = script.substring(nextPos[0], nextPos[0] + 1)
    } while (nextPos[0] < len && nextChar.test("/^\s/"));

    // return true if any whitespaces were found, but do not append
    // anything to lexArr.
    return true;
}


function lexWord(script, len, lexArr, nextPos) {
    // record the initial position.
    let initialPos = nextPos[0];
    // get and test the first character.
    var nextChar = script.substring(nextPos[0], nextPos[0] + 1);
    if (!nextChar.test("/^[a-zA-Z_]/")) {
        // return false immedeately if first character is not a word character.
        return false;
    }
    // match as many word characters as possible.
    do {
        nextPos[0] = nextPos[0] + 1;
        nextChar = script.substring(nextPos[0], nextPos[0] + 1)
    } while (nextPos[0] < len && nextChar.test("/^\w/"));

    // if word characters were found, append the lexeme to lexArr.
    let lexemeStr = script.substring(initialPos, nextPos[0]);
    lexArr.push(Lexeme(lexemeStr, initialPos, nextPos[0]));
    // finally return true.
    return true;
}

function lexNum(script, len, lexArr, nextPos) {
    let initialPos = nextPos[0];
    var nextChar = script.substring(nextPos[0], nextPos[0] + 1);
    if (!nextChar.test("/^[0-9]/")) {
        return false;
    }
    do {
        // match as many word or '.' characters as possible.
        nextPos[0] = nextPos[0] + 1;
        nextChar = script.substring(nextPos[0], nextPos[0] + 1)
    } while (nextPos[0] < len && nextChar.test("/^\w\./"));

    let lexemeStr = script.substring(initialPos, nextPos[0]);
    lexArr.push(Lexeme(lexemeStr, initialPos, nextPos[0]));
    return true;
}



function lexStrLiteral(script, len, lexArr, nextPos) {
    let initialPos = nextPos[0];
    var nextChar = script.substring(nextPos[0], nextPos[0] + 1);
    // test and record the first quote character. Return false if test fails.
    var quoteChar;
    if (nextChar == "'" || nextChar == '"') {
        quoteChar = nextChar;
    } else {
        return false;
    }
    // loop until final quote character is found, or until the script ends, or
    // until an illigal, unescaped newline occurs.
    do {
        nextPos[0] = nextPos[0] + 1;
        nextChar = script.substring(nextPos[0], nextPos[0] + 1)
        // throw exception if unescaped newline appears.
        if (nextChar == "\n") {
            throw {msg:"String litteral with unescaped newline"}
        }
        // if the next character is a backslash, skip past it and the
        // character that follows it (including newline characters).
        if (nextChar == "\\") {
            nextPos[0] = nextPos[0] + 2;
        }
    } while (nextPos[0] < len && nextChar.test("/^[^" + quoteChar + "]"));

    if (nextPos[0] >= len) {
        throw {msg:"String litteral with no end"}
    }

    // skip past the final "'" or '"' as well.
    nextPos[0] = nextPos[0] + 1;

    let lexemeStr = script.substring(initialPos, nextPos[0]);
    lexArr.push(Lexeme(lexemeStr, initialPos, nextPos[0]));
    return true;
}



function lexComment(script, len, lexArr, nextPos) {
    return lexSingleLineComment || lexMultiLineComment;
}


function lexSingleLineComment(script, len, lexArr, nextPos) {
    var nextChars = script.substring(nextPos[0], nextPos[0] + 2);
    if (nextChars != "//") {
        return false;
    }
    nextPos[0] = nextPos[0] + 1;
    do {
        nextPos[0] = nextPos[0] + 1;
        nextChar = script.substring(nextPos[0], nextPos[0] + 1)
    } while (nextPos[0] < len && nextChar != "\n");

    // do not skip past the final "\n'; simply lex it as whitespace instead.

    return true;
}


function lexMultiLineComment(script, len, lexArr, nextPos) {
    var nextChars = script.substring(nextPos[0], nextPos[0] + 2);
    if (nextChars != "/*") {
        return false;
    }
    nextPos[0] = nextPos[0] + 1;
    do {
        nextPos[0] = nextPos[0] + 1;
        nextChars = script.substring(nextPos[0], nextPos[0] + 2)
    } while (nextPos[0] < len && nextChar != "*/");

    if (nextPos[0] + 1 >= len) {
        throw {msg:"Multi-line comment with no end"}
    }

    // skip past the final "*/" as well.
    nextPos[0] = nextPos[0] + 2;

    return true;
}


const oneCharSyms = [
    "\+", "\-", "\*", "=", "<", ">", "&", "\|", "\?", "!", ".",
    ";", ",",
    "\(", "\)", "\{", "\}", "\[", "\]"
];

const twoCharSyms = [
    "\+\+", "\-\-", "\*\*", "=>", "&&", "\|\|", "\?\?",
    "==", "!=", "<=", ">="
];

const threeCharSyms = [
    "===", "!=="
];

const oneCharSymPatt =
    "/^((" +
        oneCharSyms.join(")|(")
    "))/";
const twoCharSymPatt =
    "/^((" +
        twoCharSyms.join(")|(")
    "))/";

const threeCharSymPatt =
    "/^((" +
        threeCharSyms.join(")|(")
    "))/";

function lexSymbol(script, len, lexArr, nextPos) {
    // we start at pos.
    var nextPos = pos;
    // get the first four chars.
    var nextChars = script.substring(nextPos, nextPos + 4);

    if (nextChars.test(threeCharSymPatt)) {
        nextPos = nextPos + 3;
    } else if (nextChars.test(twoCharSymPatt)) {
        nextPos = nextPos + 2;
    } else if (nextChars.test(oneCharSymPatt)) {
        nextPos = nextPos + 1;
    } else {
        return false;
    }
    // finally overwrite nextLexObj with the result and return true.
    nextLexObj.nextLex = script.substring(pos, nextPos);
    nextLexObj.nextPos = nextPos;
    return true;
}
