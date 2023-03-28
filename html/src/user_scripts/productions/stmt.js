
import parseIdentifier from "./ident.js";
import parseExp from "./exp.js";

class ParseException {
    constructor(pos, msg) {
        this.pos = pos;
        this.msg = msg;
    }
}

parseLexeme(lexArr, nextPos, str, successRequired) {
    if (lexArr[nextPos[0]].str == str) {
        nextPos[0] = nextPos[0] + 1;
        return true;
    } else {
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected lexeme: \"" + str + "\""
            );
        }
        return false;
    }
}


export function parseImportStmt(lexArr, nextPos, successRequired) {
    let ret =
        parseLexeme(lexArr, nextPos, "import", false) &&
        parseIdentifierList(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, "from", true) &&
        parseImportPath(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ";", true);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected import statement"
        );
    }
    return ret;
}


export parseDef(lexArr, nextPos, successRequired) {
    // record the initial position.
    let initialPos = nextPos[0];
    // parse optional export keyword.
    parseLexeme(lexArr, nextPos, "export", false);
    // parse mandatory definitions.
    if (
        parseFunDef(lexArr, nextPos, false) ||
        parseVarDef(lexArr, nextPos, false)
    ) {
        return true;
    } else {
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected function or variable definition"
            );
        }
        nextPos[0] = initialPos;
        return false;
    }

}


function parseFunDef(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "function", successRequired) &&
        parseIdentifier(lexArr, nextPos, true) &&
        parseIdentifierTuple(lexArr, nextPos, true) &&
        parseStmt(lexArr, nextPos, true);
}



function parseStmt(lexArr, nextPos, successRequired) {
    let ret =
        parseBlockStmt(lexArr, nextPos, false) ||
        parseIfElseStmt(lexArr, nextPos, false) ||
        parseSwitchStmt(lexArr, nextPos, false) ||
        parseLoopStmt(lexArr, nextPos, false) ||
        parseSingleStmt(lexArr, nextPos, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected statement"
        );
    }
    return ret;
}


function parseBlockStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "{", successRequired) &&
        parseStmtList(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, "}", true);
}


function parseStmtList(lexArr, nextPos, successRequired) {
    // parse as many statements as possible of a possibly empty statement list.
    while (parseStmt(lexArr, nextPos, false));
    // always return true.
    return true;
}




function parseIfStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "if", successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseStmt(lexArr, nextPos, true);
}

function parseIfElseStmt(lexArr, nextPos, successRequired) {
    // parse the initial mandatory if statement.
    if (!parseIfStmt(lexArr, nextPos, successRequired)) {
        return false;
    }
    // parse all following else statements if there are any.
    while (parseLexeme(lexArr, nextPos, "else")) {
        parseStmt(lexArr, nextPos, true);
    }
    // if all those else keywords were followed by a statement, return true.
    return true;
}






function parseSwitchStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "switch", successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseCaseBlock(lexArr, nextPos, true);
}


function parseCaseBlock(lexArr, nextPos, successRequired) {

    if (!parseLexeme(lexArr, nextPos, "{", successRequired)) {
        return false;
    }
    // parse first mandatory case statement.
    parseCaseStmt(lexArr, nextPos, true);
    // parse optional case statements, including default case at last.
    while (parseCaseStmt(lexArr, nextPos, false));
    parseDefaultCaseStmt(lexArr, nextPos, false);

    parseLexeme(lexArr, nextPos, "}", true);

    return true;
}

function parseCaseStmt(lexArr, nextPos, successRequired) {
    // parse fisrt "case <exp> :" expression.
    if (!parseLexeme(lexArr, nextPos, "case", successRequired)) {
        rerun false;
    }
    parseExp(lexArr, nextPos, true);
    parseLexeme(lexArr, nextPos, ":", true)

    // parse an optional list of additional "case <exp> :" expressions.
    while (parseLexeme(lexArr, nextPos, "case", false)) {
        parseExp(lexArr, nextPos, true);
        parseLexeme(lexArr, nextPos, ":", true);
    }
    // parse a non-empty list of statements possibly ending on "break;".
    parseStmt(lexArr, nextPos, true);
    while (parseStmt(lexArr, nextPos, false));
    if (parseLexeme(lexArr, nextPos, "break", false)) {
        parseLexeme(lexArr, nextPos, ";", true);
    }
    return true;
}

function parseDefaultCaseStmt(lexArr, nextPos, successRequired) {
    // parse fisrt "case <exp> :" expression.
    if (!parseLexeme(lexArr, nextPos, "default", successRequired)) {
        rerun false;
    }
    parseLexeme(lexArr, nextPos, ":", true)

    // parse a non-empty list of statements possibly ending on "break;".
    parseStmt(lexArr, nextPos, true);
    while (parseStmt(lexArr, nextPos, false));
    if (parseLexeme(lexArr, nextPos, "break", false)) {
        parseLexeme(lexArr, nextPos, ";", true);
    }
    return true;
}








function parseLoopStmt(lexArr, nextPos, successRequired) {
    let ret =
        parseForLoopStmt(lexArr, nextPos, false) ||
        parseWhileLoopStmt(lexArr, nextPos, false) ||
        parseDoWhileLoopStmt(lexArr, nextPos, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected loop statement"
        );
    }
    return ret;
}



function parseForLoopStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "for", successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        // The JS syntax doc seems ambiguous here, so let's be safe.
        parseVarDef(lexArr, nextPos, true) && // includes ';'.
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ";", true) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseStmt(lexArr, nextPos, true);
}

function parseWhileLoopStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "while", successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseStmt(lexArr, nextPos, true);
}


function parseDoWhileLoopStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "do", successRequired) &&
        parseStmt(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, "while", true) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseLexeme(lexArr, nextPos, ";", true);
}







function parseSingleStmt(lexArr, nextPos, successRequired) {
    let ret =
        parseLexeme(lexArr, nextPos, ";", false) ||
        parseVarDef(lexArr, nextPos, false) ||
        parseVarAssign(lexArr, nextPos, false) ||
        parseReturnStmt(lexArr, nextPos, false) ||
        parseExpStmt(lexArr, nextPos, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected non-block statement"
        );
    }
    return ret;
}

parseExpStmt(lexArr, nextPos, successRequired) {
    return
        parseExp(lexArr, nextPos, successRequired) &&
        parseLexeme(lexArr, nextPos, ";", true);
}


function parseReturnStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "return", successRequired) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ";", true);
}


function parseVarAssign(lexArr, nextPos, successRequired) {
    return
        parseIdentifier(lexArr, nextPos, successRequired) &&
        parseAssignOp(lexArr, nextPos, true) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ";", true);
}


function parseVarDef(lexArr, nextPos, successRequired) {
    return
        parseVarDecKeyword(lexArr, nextPos, successRequired) &&
        parseVarAssign(lexArr, nextPos, true);
}




function parseAssignOp(lexArr, nextPos, successRequired) {
    let ret =
        parseLexeme(lexArr, nextPos, "=", false) ||
        parseLexeme(lexArr, nextPos, "+=", false) ||
        parseLexeme(lexArr, nextPos, "-=", false) ||
        parseLexeme(lexArr, nextPos, "*=", false) ||
        parseLexeme(lexArr, nextPos, "**=", false) ||
        parseLexeme(lexArr, nextPos, "/=", false) ||
        parseLexeme(lexArr, nextPos, "%=", false) ||
        parseLexeme(lexArr, nextPos, "&&=", false) ||
        parseLexeme(lexArr, nextPos, "||=", false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected non-block statement"
        );
    }
    return ret;
}

function parseVarDecKeyword(lexArr, nextPos, successRequired) {
    let ret =
        parseLexeme(lexArr, nextPos, "var", false) ||
        parseLexeme(lexArr, nextPos, "let", false) ||
        parseLexeme(lexArr, nextPos, "const", false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected non-block statement"
        );
    }
    return ret;

}
