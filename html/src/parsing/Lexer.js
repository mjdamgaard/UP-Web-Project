
class Lexer = {

constructor(lexemeAndEndCharPatternPairArr, whitespacePattern) {
    // lexemeAndEndCharPatternPairArr consitst of
    // [[lexemePattern, endCharPattern] (, [lexemePattern, endCharPattern])*],
    // where endCharPattern is a pattern of all the characters that can end the
    // lexeme (besides the end of the string), but which are not part of
    // the lexeme itself. If endCharPattern is null/undefined, the lexeme
    // is taken to include its own end delimeter.
    this.lexPatternEndPairArr = lexemeAndEndCharPatternPairArr ?? [];
    this.whitespacePattern = whitespacePattern ?? "[^\w\W]";
    this.whitespacePattern = whitespacePattern;
    this.error = undefined;
    this.success = undefined;
    this.lexArr = undefined;
    this.nextPos = undefined;
}

addwhitespacePattern(whitespacePattern) {
    this.whitespacePattern = whitespacePattern;
}

addLexemeAndEndCharPatternPairs(lexemeAndEndCharPatternPairArr) {
    this.lexPatternEndPairArr = this.lexPatternEndPairArr.concat(
        lexemeAndEndCharPatternPairArr
    );
}

lex(str) {
    // let us first rename the input variables.
    let lexPatternEndPairArr = this.lexPatternEndPairArr;
    let whitespacePattern = this.whitespacePattern;
    let noneWSCharPattern = /\S/;
    // test that str is a string.
    if (typeof str !== "string") {
        throw "Lexer.lex(): input is not a string";
    }
    // initialize the return lexeme array and the position variable.
    this.lexArr = [];
    this.nextPos = 0;
    // initialize the loop lengths.
    let strLen = str.length;
    let lexPatternEndPairArrLen = lexPatternEndPairArr.length;
    // lex and obtain the return lexeme array in the following loop.
    outerLoop: while (this.nextPos < strLen) {
        // first match an optional string of whitespace, increase nextPos
        // with the matched length and return the lexeme array if the end
        // of the string is reached.
        let wsLen = getMatchLen(
            str, this.nextPos, whitespacePattern, noneWSCharPattern
        );
        this.nextPos += wsLen;
        if (this.nextPos >= strLen) {
            this.success = true;
            this.lexArr = lexArr;
            return true;
        }
        // then loop through all pairs in lexPatternEndPairArr, expecting to
        // find at least one match to add to lexArr.
        innerLoop: for (let i = 0; i < lexPatternEndPairArrLen; i++) {
            let lexemePattern = lexPatternEndPairArr[i][0];
            let endCharPattern = lexPatternEndPairArr[i][1];
            // get the length of the potential match.
            let matchLen = getMatchLen(
                str, this.nextPos, lexemePattern, endCharPattern
            );
            // if a match was found, increase nexPos and continue the outer
            // for loop.
            if (matchLen > 0) {
                this.nextPos += matchLen;
                continue outerLoop; // in PHP, this would be "continue 2;"
            }
        }
        // if the program reaches here, no match was found, which means
        // that we should set an error message and return false.
        this.success = false;
        this.error = (
            "Invalid lexeme at position " +
            this.nextPos.toString() +
            " after\n" +
            ("^" + str).substring(Math.max(0, nextPos - 320), nextPos + 1)
        );
        this.lexArr = lexArr;
        return false;
    }
}

getMatchLen(str, nextPos, lexemePattern, endCharPattern) {
    // if endCharPattern is null/undefined, then we assume that lexemePattern
    // includes its own end delimeter.
    if (typeof endCharPattern === "undefined") {
        let regex = new RegExp(
            "^" + lexemePattern
        );
        let match = regex.match(str.substring(nextPos)) ?? [""];
        // return the length of the matched lexeme, or return 0 if no match
        // was found.
        return match[0].length;
    // else, endCharRegEx denotes the ending character, which we will then
    // also have to remove before returning the length, but only if the
    // lexeme did not end the string.
    } else {
        let regex = new RegExp(
            "^" + lexemePattern +
            "((" + endCharPattern + ")|$)"
        );
        let match = regex.match(str.substring(nextPos)) ?? false;
        // return 0 if no match was found.
        if (!match) {
            return 0;
        }
        // get the length of the full match, inluding the end delimeter.
        let fullLen = match[0].length;
        // record a boolean whether the end of the match was indeed an end
        // delimeter (and not the end of the string).
        let endCharRegEx = new RegExp(endCharPattern);
        let notEOS = endCharRegEx.test(
            str.substring(nextPos + fullLen - 1, nextPos + fullLen)
        );
        // return the length minus one (for the end delimeter) if end of
        // string was not reached before the end delimeter.
        if (notEOS) {
            return fullLen - 1;
        // else return the full len, since the end of the string ($) must
        // have been found instead of an end delimeter.
        } else {
            return fullLen;
        }
    }
}

// end of class.
}
