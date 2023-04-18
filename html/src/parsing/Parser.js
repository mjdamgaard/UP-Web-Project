
class Parser = {

constructor() {
    this.parseFunctions = {};
    this.error = "";
    this.success = undefined;
    // this.lexArr = undefined;
    this.nextPos = [0];
}


parse(lexArr, productionKey) {
    // parse and try for error.
    try {
        this.parseFunctions[productionKey](lexArr, this.nextPos, true);
    } catch (error) {
        this.error = error;
        this.success = false;
        return false;
    }
    // check if all the lexeme array has been parsed.
    if (this.nextPos >= lexArr.length) {
        this.error = "parsing failed at position " + this.nextPos.toString() +
            " after: " +
            lexArr.slice(Math.max(0, nextPos - 20), nextPos).join(" ");
        this.success = false;
        return false;
    }
    // if it has, return true.
    this.error = "";
    this.success = true;
    return true;
}

addProduction(key, parseSettings) {
    // if parseSettings is a RegEx, simply add the corresponding single-
    // lexeme production (as a parse function).
    if (parseSettings instanceof RegExp) {
        // initialize the single-lexeme parse function.
        this.parseFunctions[key] =
            function(lexArr, nextPos, successRequired) {
                let test = parseSettings.test(lexArr[nextPos[0]]);
                if (!test && successRequired) {
                    throw (
                        'expected lexeme of "/' + parseSettings.source +
                        '/" in ' + key
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
        // go through each parse setting and do the parsing as instructed.
        try {
            for (let i = 0; i < settingsLen; i++) {
                let parseType = parseSettings[i][0];
                let subproductionKeys = parseSettings[i][1];
                let subSettings = parseSettings[i][2];
                switch (parseType) {
                    case ("optWords"):
                        // parse some optional words that are never required.
                        parseWords(
                            lexArr, nextPos, subproductionKeys, false
                        );
                    case ("initWords"):
                        // parse some initial words after which the rest of
                        // the "words" in the production become mandatory.
                        parseWords(
                            lexArr, nextPos, subproductionKeys, successRequired
                        );
                        successRequired = true;
                    case ("words"):
                        // parse some words which are required only if
                        // successRequired is true or if "initalWords" has
                        // appeared before.
                        parseWords(
                            lexArr, nextPos, subproductionKeys, successRequired
                        );
                    case ("list"):
                        // parse an optional list with a required delimeter of
                        // a pattern defined by subSettings (in the form of a
                        // RegExp object).
                        let delimeterRegEx = subSettings;
                        parseList(
                            lexArr, nextPos, subproductionKeys[0],
                            delimeterRegEx
                        );
                    case ("union"):
                        // parse at least one of the subproductions pointed to
                        // by each of the the subproductionKeys.
                        parseUnion(
                            lexArr, nextPos, subproductionKeys, successRequired
                        );
                    case ("optUnion"):
                        // parse at most one of the subproductions pointed to
                        // by each of the the subproductionKeys.
                        parseUnion(
                            lexArr, nextPos, subproductionKeys, false
                        );
                    default:
                        throw (
                            "addProduction(): Unknown parseType: " + parseType
                        );
                }
            }
        } catch (error) {
            error += " in " + key;
            throw error;
        }
    }
}

parseWords(lexArr, nextPos, subproductionKeys, successRequired) {

}

parseUnion(lexArr, nextPos, subproductionKeys, successRequired) {

}

parseList(lexArr, nextPos, subproductionKey, delimeterRegEx) {

}


}
