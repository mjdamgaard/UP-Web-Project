


export function lex(script) {
    // first check for unwanted whitespace characters.
    if (!script.test("/^( \n\S)*$/")) {
        throw new Exception("lex(): unwanted whitespace characters");
    }

    // initialize return array.
    var lexArr = [];
    var lexArrLen = 0;
    // initialize loop variables.
    var pos = 0;
    var nextLexObj = {nextLex:"", nextPos:0};

    // loop and append each lexeme in input script to lexArr.
    const len = script.length;
    while (pos < len) {
        let nextChar = script.substring(pos, pos + 1);
        // brach according the the first character of the next potential lexeme.
        if (nextChar.test("/^\s/")) {
            lexWhitespace(script, pos, len, nextLexObj);

        } else if (nextChar == '"') {
            lexDblQuoteStr(script, pos, len, nextLexObj);

        } else if (nextChar == "'") {
            lexSnglQuoteStr(script, pos, len, nextLexObj);

        } else if (nextChar.test("/^[a-zA-Z_]/")) {
            lexWord(script, pos, len, nextLexObj);

        } else if (nextChar.test("/^[0-9]/")) {
            lexNum(script, pos, len, nextLexObj);

        } else if (nextChar == "/")) {
            // check if next two characters are the start of a comment and
            // branch accordingly.
            let nextTwoChars = script.substring(pos, pos + 2)
            if (nextTwoChars == "//") {
                lexSnglLineComment(script, pos, len, nextLexObj);

            } else if (nextTwoChars == "/*") {
                lexMltLineComment(script, pos, len, nextLexObj);

            } else {
                nextLexObj.nextLex = nextChar;
                nextLexObj.nextPos = pos + 1;
            }

        } else {
            if (!lexOperator(script, pos, len, nextLexObj)) {
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



function lexWhitespace(script, pos, len, nextLexObj) {
    var nextPos = pos;
    // loop and increase nextPos until the next character is no longer a
    // whitespace character.
    var nextChar = script.substring(nextPos, nextPos + 1);
    while (nextPos < len && nextChar.test("/^[ \n]/")) { // no other ws chars.
        nextPos++;
        nextChar = script.substring(nextPos, nextPos + 1);
    }
    // finally overwrite nextLexObj with the result ("" means no lexeme will
    // be added lexArr in lex()).
    nextLexObj.nextLex = "";
    nextLexObj.nextPos = nextPos;
}

function lexWord(script, pos, len, nextLexObj) {
    var nextPos = pos;
    // loop and increase nextPos until the next character is no longer a
    // word character.
    var nextChar = script.substring(nextPos, nextPos + 1);
    while (nextPos < len && nextChar.test("/^\w/")) {
        nextPos++;
        nextChar = script.substring(nextPos, nextPos + 1);
    }
    // finally overwrite nextLexObj with the result.
    nextLexObj.nextLex = script.substring(pos, nextPos);
    nextLexObj.nextPos = nextPos;
}

function lexNum(script, pos, len, nextLexObj) {
    var nextPos = pos;
    // loop and increase nextPos until the next character is no longer a
    // digit, a dot or a word character.
    var nextChar = script.substring(nextPos, nextPos + 1);
    while (nextPos < len && nextChar.test("/^[\w\.]/")) {
        nextPos++;
        nextChar = script.substring(nextPos, nextPos + 1);
    }
    // finally overwrite nextLexObj with the result.
    nextLexObj.nextLex = script.substring(pos, nextPos);
    nextLexObj.nextPos = nextPos;
}


function lexDblQuoteStr(script, pos, len, nextLexObj) {
    lexQuoteStr(script, pos, len, nextLexObj, '"');
}

function lexSnglQuoteStr(script, pos, len, nextLexObj) {
    lexQuoteStr(script, pos, len, nextLexObj, "'");
}


function lexQuoteStr(script, pos, len, nextLexObj, quoteChar) {
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



function lexSnglLineComment(script, pos, len, nextLexObj) {
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


function lexMltLineComment(script, pos, len, nextLexObj) {
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


const snglCharOps = [
    "\+", "\-", "\*", "=", "<", ">", "&", "\|", "\?", "!", "."
];

const twoCharOps = [
    "\+\+", "\-\-", "\*\*", "=>", "&&", "\|\|", "\?\?",
    "==", "!=", "<=", ">="
];

const threeCharOps = [
    "===", "!=="
];

const snglCharOpPatt =
    "/^((" +
        snglCharOps.join(")|(")
    "))/";
const twoCharOpPatt =
    "/^((" +
        twoCharOps.join(")|(")
    "))/";

const threeCharOpPatt =
    "/^((" +
        threeCharOps.join(")|(")
    "))/";

function lexOperator(script, pos, len, nextLexObj) {
    // we start at pos.
    var nextPos = pos;
    // get the first four chars.
    var nextChars = script.substring(nextPos, nextPos + 4);

    if (nextChars.test(threeCharOpPatt)) {
        nextPos = nextPos + 3;
    } else if (nextChars.test(twoCharOpPatt)) {
        nextPos = nextPos + 2;
    } else if (nextChars.test(snglCharOpPatt)) {
        nextPos = nextPos + 1;
    } else {
        return false;
    }
    // finally overwrite nextLexObj with the result and return true.
    nextLexObj.nextLex = script.substring(pos, nextPos);
    nextLexObj.nextPos = nextPos;
    return true;
}
