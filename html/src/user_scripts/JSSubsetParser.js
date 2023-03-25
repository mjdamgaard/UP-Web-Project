


function lex(script) {
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

        } else if (nextChar.test("/^\w/"))
            lexWord(script, pos, len, nextLexObj);

        } else {
            nextLexObj.nextLex = nextChar;
            nextLexObj.nextPos = pos + 1;
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
    var nextChar = script.substring(pos, pos + 1);
    while (nextPos < len && nextChar.test("/^\s/")) {
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
    var nextChar = script.substring(pos, pos + 1);
    while (nextPos < len && nextChar.test("/^\w/")) {
        nextPos++;
        nextChar = script.substring(nextPos, nextPos + 1);
    }
    // finally overwrite nextLexObj with the result.
    nextLexObj.nextLex = script.substring(pos, nextPos);
    nextLexObj.nextPos = nextPos;
}

function lexQuoteStr(script, pos, len, nextLexObj, quoteChar) {
    // here we immediately skip past the initial '"' or "'" character.
    var nextPos = pos + 1;
    // loop and increase nextPos until the next character is no longer a
    // word character.
    var nextChar = script.substring(pos, pos + 1);
    while (nextPos < len && nextChar.test("/^[^" + quoteChar + "]/")) {
        if (nextChar == "\\") {
            nextPos = nextPos + 2;
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
        throw new Exception("lex(): string litteral with no end")
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




export class JSSubsetParser {


}










//
