
class Parser = {
    constructor() {
        this.parseFunctions = {};
        this.error = undefined;
        this.success = undefined;
        // this.lexArr = undefined;
        // this.nextPos = undefined;
    },

    addProduction(key, parseSettings) {
        // if parseSettings is a RegEx, simply add the corresponding single-
        // lexeme production (as a parse function).
        if (parseSettings instanceof RegExp) {
            // initialize the single-lexeme parse function.
            let parseFunction = function(lexArr, nextPos, successRequired) {
                let test = parseSettings.test(lexArr[nextPos[0]]);
                if (!test && successRequired) {
                    throw [
                        nextPos[0], 'expected lexeme of "/' +
                        parseSettings.source + '/"'
                    ];
                } else if (!test) {
                    return false;
                } else {
                    nextPos[0] += 1;
                    return true;
                }
            }
        }
        // else we assume that parseSettings is an array of [parseType,
        // subparsingFunctionKeys] arrays, where subparsingFunctionKeys are
        // earlier (or later) defined function keys added with addProduction().
        let settingsLen = parseSettings.length;
        this.parseFunctions[key] = function(lexArr, nextPos, successRequired) {
            // record the initial position.
            initialPos = nextPos[0];
            // go through each parse setting and do the parsing as instructed.
            for (let i = 0; i < settingsLen; i++) {
                let parseType = parseSettings[i][0];
                let subparsingFunctionKeys = parseSettings[i][1];
                let subSettings = parseSettings[i][2];
                switch (parseType) {
                    case ("optWords"):
                        // parse some optional words that are never required.
                        parseWords(
                            lexArr, nextPos, subparsingFunctionKeys,
                            false
                        );
                    case ("initWords"):
                        // parse some initial words after which the rest of
                        // the "words" in the production become mandatory.
                        parseWords(
                            lexArr, nextPos, subparsingFunctionKeys,
                            successRequired
                        );
                        successRequired = true;
                    case ("words"):
                        // parse some words which are required only if
                        // successRequired is true or if "initalWords" has
                        // appeared before.
                        parseWords(
                            lexArr, nextPos, subparsingFunctionKeys,
                            successRequired
                        );
                    case ("list"):
                        // parse an optional list with a required delimeter of
                        // a pattern defined by subSettings (in the form of a
                        // RegExp object).
                        let delimeterRegEx = subSettings;
                        parseList(
                            lexArr, nextPos, subparsingFunctionKeys[0],
                            delimeterRegEx
                        );
                    case ("union"):
                        // parse at least one of the subproductions pointed to
                        // by each of the the subparsingFunctionKeys.
                        parseUnion(
                            lexArr, nextPos, subparsingFunctionKeys,
                            successRequired
                        );
                    case ("optUnion"):
                        // parse at most one of the subproductions pointed to
                        // by each of the the subparsingFunctionKeys.
                        parseUnion(
                            lexArr, nextPos, subparsingFunctionKeys,
                            false
                        );
                    default:
                        throw (
                            "addProduction(): Unknown parseType: " +
                            parseType
                        );
                }
            }
        }
    }

    parse(lexArr) {

    }
}
