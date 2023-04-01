
import parseVarIdent, parseVarIdentList, parseFunIdent
from "./ident.js";

import parseImportIdentList, parseImportPath
from "./import.js";

import parseLexeme
from "./symbol.js";

import parseExp, parseAssignExp, parseAssignOp
from "./exp.js";

class ParseException {
    constructor(pos, msg) {
        this.pos = pos;
        this.msg = msg;
    }
}




export function parseImportStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "import", successRequired) &&
        parseImportIdentList(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, "from", true) &&
        parseImportPath(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ";", true);
}



export function parseOuterFunDef(lexArr, nextPos, successRequired) {
    // record the initial position.
    let initialPos = nextPos[0];
    // parse optional export keyword.
    parseLexeme(lexArr, nextPos, "export", false);
    // parse mandatory definitions, and make sure to reset nextPos if
    // parseFunDef() returns false.
    if (parseFunDef(lexArr, nextPos, successRequired)) {
        return true;
    }
    // if parsing has failed potentially trow an exception and return false.
    nextPos[0] = initialPos;
    if (successRequired) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected function definition"
        );
    }
    return false;
}



function parseFunDef(lexArr, nextPos, successRequired) {
    // record the initial position.
    let initialPos = nextPos[0];
    // parse function, and make sure to reset nextPos if parseVarIdent()
    // is called but return false (and if successRequired == false).
    if (
        parseLexeme(lexArr, nextPos, "function", successRequired) &&
        parseFunIdent(lexArr, nextPos, successRequired)
    ) {
        parseLexeme(lexArr, nextPos, "(", true);
        parseVarIdentList(lexArr, nextPos, false);
        parseLexeme(lexArr, nextPos, ")", true)
        parseStmt(lexArr, nextPos, true);
        return true;
    } else {
        nextPos[0] = initialPos;
        return false;
    }
}



function parseStmt(lexArr, nextPos, successRequired) {
    let ret =
        parseBlockStmt(lexArr, nextPos, false) ||
        parseIfElseStmt(lexArr, nextPos, false) ||
        parseSwitchStmt(lexArr, nextPos, false) ||
        parseLoopStmt(lexArr, nextPos, false) ||
        parseSimpleStmt(lexArr, nextPos, false) ||
        parseFunDef(lexArr, nextPos, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected statement"
        );
    }
    return ret;
}


function parseBlockStmt(lexArr, nextPos, successRequired) {
    return
        // With this implementation, e.q. {prop1:exp, prop2:exp}; is not
        // allowed as a statment.
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
        parseValVarDef(lexArr, nextPos, true) && // includes ';'.
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







function parseSimpleStmt(lexArr, nextPos, successRequired) {
    let ret =
        parseLexeme(lexArr, nextPos, ";", false) ||
        parseVarDec(lexArr, nextPos, false) ||
        parseExpStmt(lexArr, nextPos, false) ||
        parseReturnStmt(lexArr, nextPos, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected simple statement"
        );
    }
    return ret;
}




function parseReturnStmt(lexArr, nextPos, successRequired) {
    // parse mandatory return keyword.
    if (!parseLexeme(lexArr, nextPos, "return", successRequired)) {
        return false;
    }
    // parse optional ';' to end the return statement right away.
    if (parseLexeme(lexArr, nextPos, ";", false)) {
        return true;
    }
    // else parse the then mandatory expression followed by ';'.
    let ret =
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ";", true);

    if (!ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected expression or ';'"
        );
    }
    return ret;
}




function parseExpStmt(lexArr, nextPos, successRequired) {
    return
        parseExp(lexArr, nextPos, successRequired) &&
        parseLexeme(lexArr, nextPos, ";", true);
}



function parseVarDec(lexArr, nextPos, successRequired) {
    // parse mandatory var, let or const keyword or return false.
    if (!parseVarDecKeyword(lexArr, nextPos, successRequired)) {
        return false;
    }
    // parse mandatory identifier list.
    parseVarIdent(lexArr, nextPos, true);
    while (parseLexeme(lexArr, nextPos, ",", false)) {
        parseVarIdent(lexArr, nextPos, true);
    }
    // either parse ";" or if that fails, parse the then mandatory "= <exp> ;".
    if (parseLexeme(lexArr, nextPos, ";", false)) {
        return true
    }
    let ret =
        parseLexeme(lexArr, nextPos, "=", false) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ";", true);

    if (!ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected '=' or ';'"
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
            lexArr[nextPos[0]], "Expected variable definition keyword"
        );
    }
    return ret;

}
