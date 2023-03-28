
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
    let nextChar = script.substring(nextPos[0], nextPos[0] + 1);
    if (!nextChar.test("/^\s/")) {
        // return false immedeately if first character is not a whitespace.
        return false;
    } else {
        // match as many whitespaces as possible.
        do {
            nextPos[0] = nextPos[0] + 1;
            nextChar = script.substring(nextPos[0], nextPos[0] + 1)
        } while (nextPos[0] < len && nextChar.test("/^\s/"));
    }
    // return true if any whitespaces were found, but do not append
    // anything to lexArr.
    return true;
}


function lexWord(script, len, lexArr, nextPos) {
    // record the initial position.
    var initialPos = nextPos[0];
    // get and test the first character.
    let nextChar = script.substring(nextPos[0], nextPos[0] + 1);
    if (!nextChar.test("/^\w/")) {
        // return false immedeately if first character is not a word character.
        return false;
    } else {
        // match as many word characters as possible.
        do {
            nextPos[0] = nextPos[0] + 1;
            nextChar = script.substring(nextPos[0], nextPos[0] + 1)
        } while (nextPos[0] < len && nextChar.test("/^\w/"));
    }
    // if word characters were found, append the lexeme to lexArr.
    let lexemeStr = script.substring(initialPos, nextPos[0]);
    lexArr.push(Lexeme(lexemeStr, initialPos, nextPos[0]));
    // finally return true.
    return true;
}

function lexNum(script, len, lexArr, nextPos) {
    var initialPos = nextPos[0];
    let nextChar = script.substring(nextPos[0], nextPos[0] + 1);
    if (!nextChar.test("/^[0-9]/")) {
        return false;
    } else {
        do {
            nextPos[0] = nextPos[0] + 1;
            nextChar = script.substring(nextPos[0], nextPos[0] + 1)
        } while (nextPos[0] < len && nextChar.test("/^\w\./"));
    }
    let lexemeStr = script.substring(initialPos, nextPos[0]);
    lexArr.push(Lexeme(lexemeStr, initialPos, nextPos[0]));
    return true;
}

/*
...
" */  1 + 1 == 2; // Okay..

...

function lexDblQuoteStr(script, len, lexArr, nextPos) {
    lexQuoteStr(script, pos, len, nextLexObj, '"');
}

function lexSnglQuoteStr(script, len, lexArr, nextPos) {
    lexQuoteStr(script, pos, len, nextLexObj, "'");
}


function lexStrLiteral(script, pos, len, nextLexObj, quoteChar) {
    // here we immediately skip past the initial '"' or "'" character.
    var nextPos = pos + 1;
    // loop and increase nextPos until the end of the string is found.
    var nextChar = script.substring(nextPos, nextPos + 1);
    while (nextPos < len && nextChar.test("/^[^" + quoteChar + "]/")) {
        if (nextChar == "\\") {
            nextPos = nextPos + 2;
        } else if (nextChar == "\n") {
            // NOTE: this error have to be caught and handled.
            throw new Exception(
                "lex(): string litteral with unescaped newline"
            );
        } else {
            nextPos = nextPos + 1;
        }
        nextChar = script.substring(nextPos, nextPos + 1);
    }
    // include the last '"' or "'" character as well by increasing nextPos by 1.
    nextPos++;
    // throw error if this means that nextPos becomes greater than script
    // length.
    if (nextPos >= len) {
        // NOTE: this error have to be caught and handled.
        throw new Exception("lex(): string litteral with no end");
    }
    // finally overwrite nextLexObj with the result.
    nextLexObj.nextLex = script.substring(pos, nextPos);
    nextLexObj.nextPos = nextPos;
}



function lexSnglLineComment(script, len, lexArr, nextPos) {
    // here we immediately skip past the comment start delimeter.
    var nextPos = pos + 2;
    // loop and increase nextPos until a newline is found.
    var nextChar = script.substring(nextPos, nextPos + 1);
    while (nextPos < len && nextChar != "\n") {
        nextPos++;
        nextChar = script.substring(nextPos, nextPos + 1);
    }
    if (nextChar == "\n") {
        nextPos++;
    }
    // finally overwrite nextLexObj with the result ("" means no lexeme will
    // be added lexArr in lex()).
    nextLexObj.nextLex = "";
    nextLexObj.nextPos = nextPos;
}


function lexMltLineComment(script, len, lexArr, nextPos) {
    // here we immediately skip past the comment start delimeter.
    var nextPos = pos + 2;
    // loop and increase nextPos until "*/" is found.
    var nextTwoChars = script.substring(nextPos, nextPos + 2);
    while (nextPos < len && nextTwoChars != "*/")) {
        nextPos++;
        nextChar = script.substring(nextPos, nextPos + 1);
    }
    if (nextTwoChars == "*/") {
        nextPos = nextPos + 2;
    }
    // finally overwrite nextLexObj with the result ("" means no lexeme will
    // be added lexArr in lex()).
    nextLexObj.nextLex = "";
    nextLexObj.nextPos = nextPos;
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
