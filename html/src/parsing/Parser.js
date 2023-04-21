
class Parser = {

constructor(lexer) {
    this.lexer = lexer;
    this.parseFunctions = {};
    this.error = "";
    this.success = undefined;
    this.nextPos = [0];
    this.storageForTests = [];
}

lexAndParse(str, productionKey) {
    // lex the string.
    this.lexer.lex(str);
    // test for lexing error.
    if (!this.lexer.success) {
        this.success = false;
        this.error = "Lexing error: " + this.lexer.error;
        return false;
    }
    // parse the resulting lexeme array.
    return this.parse(this.lexer.lexArr, productionKey);
}

parse(lexArr, productionKey) {
    // reset nextPos to [0] and reset storageForTests to [].
    this.nextPos = [0];
    this.storageForTests = [];
    // refresh this.storageForTests
    // parse and try for error.
    try {
        this.parseFunctions[productionKey](lexArr, this.nextPos, true);
    } catch (error) {
        this.error = (
            "Parsing failed at position " +
            this.nextPos[0].toString() + " after\n'" +
            lexArr.slice(Math.max(0, nextPos[0] - 80), nextPos[0]).join(" ") +
            "'\n" + error
        );
        this.success = false;
        return false;
    }
    // check if the whole lexeme array has been parsed.
    if (this.nextPos[0] >= lexArr.length) {
        this.error = (
            "Parsing failed at lexeme position " +
            this.nextPos[0].toString() + " after\n'" +
            lexArr.slice(Math.max(0, nextPos[0] - 80), nextPos[0]).join(" ") +
            "'\nThe lexame array was only partially parsed"
        );
        this.success = false;
        return false;
    }
    // if it has, return true.
    this.error = "";
    this.success = true;
    return true;
}

parseNext(lexArr, productionKey, successRequired) {
    return this.parseFunctions[productionKey](
        lexArr, this.nextPos, successRequired
    );
}

addLexemePatterns(lexemePatternArrArr) {
    // add single-lexeme productions from the patterns contained as the first
    // element of each array contained in lexemePatternArrArr.
    let len = lexemePatternArrArr.length;
    for (let i = 0; i < len; i++) {
        if (typeof lexemePatternArrArr[i] === "string") {
            this.addProduction(lexemePatternArrArr[i]);
        } else {
            this.addProduction(lexemePatternArrArr[i][0]);
        }
    }
}

addProduction(key, parseSettings) {
    // if parseSettings is undefined, then key is assumed to be a pattern
    // string for a single-lexeme parsing.
    if (typeof parseSettings === "undefined") {
        let regex = new RegExp(key);
        // initialize the single-lexeme parse function.
        this.parseFunctions[key] =
            function(lexArr, nextPos, successRequired) {
                let test = regex.test(lexArr[nextPos[0]]);
                if (!test && successRequired) {
                    throw (
                        'Expected lexeme of pattern /' + key +'/'
                    );
                } else if (!test) {
                    return false;
                } else {
                    nextPos[0] += 1;
                    return true;
                }
            };
    }
    // else we assume that parseSettings is an array of [parseType,
    // subproductionKeys] arrays, where subproductionKeys are
    // earlier (or later) defined function keys added with addProduction().
    let settingsLen = parseSettings.length;
    this.parseFunctions[key] = function(lexArr, nextPos, successRequired) {
        // record the initial position.
        initialPos = nextPos[0];
        // initialize a local variable for storing lexemes to test, which can
        // for instance be used to test that an end XML tag matches its
        // beginning.
        var lexemesToTest = [];
        // declare the boolean return value.
        var ret;
        // go through each parse setting and do the parsing as instructed.
        try {
            for (let i = 0; i < settingsLen; i++) {
                let parseType = parseSettings[i][0];
                // Normally, subproductionKeys contains key strings as elements,
                // but they can also contain [key, testFun] pairs, where key
                // then has to be a single-lexeme key, and where testFun is a
                // function to then be run by a call to
                // testFun(lexeme, lexemesToTest, this.storageForTests), where
                // lexeme is the current lexeme parsed by key. testFun() can
                // either push data to the production-scope-local lexemesToTest,
                // to the storageForTests Parser property, which is reset for
                // each parsing, or to any other global variables it wants to,
                // and/or it can also perform a test on the previous data stored
                // in these variables. This only works of parseType is
                // "sequence", "optSequence" or "initSequence", otherwise
                // subproductionKeys has to contain only keys.
                let subproductionKeys = parseSettings[i][1];
                switch (parseType) {
                    case ("optSequence"):
                        // parse some optional words that are never required.
                        ret = this.parseSequence(
                            lexArr, nextPos, lexemesToTest, subproductionKeys,
                            false
                        );
                        break;
                    case ("initSequence"):
                        // parse some initial words after which the rest of
                        // the "sequence" in the production become mandatory.
                        ret = this.parseSequence(
                            lexArr, nextPos, lexemesToTest, subproductionKeys,
                            successRequired
                        );
                        successRequired = true;
                        break;
                    case ("sequence"):
                        // parse some words which are required only if
                        // successRequired is true or if "initSequence" has
                        // appeared before.
                        ret = this.parseSequence(
                            lexArr, nextPos, lexemesToTest, subproductionKeys,
                            successRequired
                        );
                        break;
                    case ("optList"):
                        // parse an optional list with a required delimeter of
                        // a syntax defined by subproductionKeys[1]. If
                        // subproductionKeys[1] is undefined, then the list
                        // expects no delimeter between its elements.
                        ret = this.parseList(
                            lexArr, nextPos,
                            subproductionKeys[0], subproductionKeys[1]
                        );
                        break;
                    case ("nonemptyList"):
                        // parse a non-empty list with a required delimeter of
                        // a syntax defined by subproductionKeys[1]. If
                        // subproductionKeys[1] is undefined, then the list
                        // expects no delimeter between its elements.
                        ret = this.parseNonemptyList(
                            lexArr, nextPos,
                            subproductionKeys[0], subproductionKeys[1],
                            successRequired
                        );
                        break;
                    case ("union"):
                        // parse at least one of the subproductions pointed to
                        // by each of the the subproductionKeys.
                        ret = parseUnion(
                            lexArr, nextPos, subproductionKeys, successRequired
                        );
                        break;
                    case ("optUnion"):
                        // parse at most one of the subproductions pointed to
                        // by each of the the subproductionKeys.
                        ret = parseUnion(
                            lexArr, nextPos, subproductionKeys, false
                        );
                        break;
                    default:
                        // (Note that this error is only thrown in the call
                        // to parse(), not to addProduction().)
                        throw (
                            'addProduction(): Unknown parseType: "' +
                            parseType + '" in input'
                        );
                }
            }
        } catch (error) {
            error += " in " + key; // + " at position " + initialPos.toString();
            throw error;
        }
        // if no error was thrown, test ret to see if nextPos has to be reset.
        if (!ret) {
            nextPos[0] = initialPos;
        }
        // return the boolean ret, which denotes if the parsing succeeded or
        // not.
        return ret;
    }
}

parseSequence(
    lexArr, nextPos, lexemesToTest, subproductionKeys, successRequired
) {
    // initialize bolean return value as true.
    var ret = true;
    // loop through the subproductionKeys and call the corresponding parsing
    // function.
    let subKeysLen = subproductionKeys.length;
    var i;
    for (i = 0; i < subKeysLen; i++) {
        var key = subproductionKeys[i];
        // if subproductionKeys[i] is of [lexemeKey, testFun] rather than key,
        // run a test on the lexeme before continuing with the regular parsing.
        if (typeof key !== "string") {
            key = subproductionKeys[i][0];
            let testFun = subproductionKeys[i][1];
            let lexeme = lexArr[nextPos[0]];
            let testRes = testFun(lexeme, lexemesToTest, this.storageForTests);
            if (successRequired && !testRes) {
                throw (
                    "Test function failed for '" + lexeme +
                    "' (expecting a pattern of " + subproductionKeys[i] + ")"
                );
            } else if (!testRes) {
                return false;
            }
        }
        // (Note that all parseFunctions reset nextPos on failure (excpet when
        // an error is thrown).)
        ret = this.parseFunctions[key](lexArr, nextPos, successRequired);
        if (!ret) {
            break;
        }
    }
    // throw an error if parsing failed and successRequired == true;
    if (successRequired && !ret) {
        throw (
            'Expected word of production ' + subproductionKeys[i]
        );
    }
    // return the conjunction of all the individual results of those parsings.
    return ret;
}

parseUnion(lexArr, nextPos, subproductionKeys, successRequired) {
    // initialize bolean return value as false.
    var ret = false;
    // loop through the subproductionKeys and call the corresponding parsing
    // function.
    let subKeysLen = subproductionKeys.length;
    for (let i = 0; i < subKeysLen; i++) {
        let key = subproductionKeys[i];
        // (Note that all parseFunctions reset nextPos on failure.)
        ret = this.parseFunctions[key](lexArr, nextPos, successRequired);
        if (ret) {
            break;
        }
    }
    // throw an error if parsing failed and successRequired == true;
    if (successRequired && !ret) {
        throw (
            'Expected word of production (' + subproductionKeys.join("|") + ")"
        );
    }
    // return true if one of the parsings succeeded, or return false otherwise.
    return ret;
}

parseList(lexArr, nextPos, elementProductionKey, delimeterProductionKey) {
    let delimeterIsProvided = (typeof delimeterProductionKey !== "undefined");
    // (Note that all parseFunctions reset nextPos on failure.)
    while (this.parseFunctions[elementProductionKey](lexArr, nextPos, false)) {
        if (
            delimeterIsProvided &&
            !this.parseFunctions[delimeterProductionKey](lexArr, nextPos, false)
        ) {
            break;
        }
    }
    // always return true unless an error was thrown in a nested parsing.
    return true;
    // NOTE: If a trailing delimeter is allowed, this should be implemented
    // by adding an "optWord" parsing after this "optList" parsing.
}

parseNonemptyList(
    lexArr, nextPos, elementProductionKey, delimeterProductionKey,
    successRequired
) {
    // first record the initial position.
    let initialPos = nextPos[];
    // try parsing a list.
    parseList(lexArr, nextPos, elementProductionKey, delimeterProductionKey);
    // return false or fail if nextPos[0] is still equal to the initialPos.
    if (nextPos[0] === currentPos) {
        if (successRequired) {
            throw(
                "Expected non-empty list of productions " + elementProductionKey
            );
        } else {
            // (Note that all parseFunctions reset nextPos on failure.)
            return false;
        }
    }
    // else return true.
    return true;
    // NOTE: If a trailing delimeter is allowed, this should be implemented
    // by adding an "optWord" parsing after this "nonemptylist" parsing.
}

// end of class.
}
