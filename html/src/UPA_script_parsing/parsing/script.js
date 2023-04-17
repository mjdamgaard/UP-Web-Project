
import {
    lex
} from "../lexing/lex.js";

import {
    parseImportStmt, parseOuterFunDef
} from "./stmt.js";


export function parseScript(script) {
    // get lexeme array.
    // TODO: implement exception handling here.
    var lexArr = lex(script);
    // initialize position object.
    var nextPos = [0];

    // if first lexeme is '"use strict"', continue, or else return false.
    if (lexArr[0] == '"use strict"' && lexArr[1] == ';') {
        nextPos[0] = 2;
    } else {
        return false;
    }
    // (Even though strict mode is automatic for all modules, let us still
    // include it just in case we allow other script types in the future, and
    // also just in case sloppy mode can somehow make the scripts unsafe when
    // not loaded as module scripts like they are supposed to.)

    // parse a list of import statements.
    while (parseImportStmt(lexArr, nextPos, false));

    // parse a list of function definitions or pure variable definitions. (We
    // only allow these two types of definitions at this point.)
    while (parseOuterFunDef(lexArr, nextPos, false));

    // return true only if all lexemes have been successfully parsed.
    return (nextPos[0] == lexArr.length);
}
