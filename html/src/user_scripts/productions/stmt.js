
import parseIdentifier, parseImportIdentifierList,
    parseIdentifierTuple, parseNonEmptyIdentifierList
from "./ident.js";

import parseExp, parseAssignExp, parseAssignOp
from "./exp.js";

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
    }
    // if parsing has failed potentially trow an exception and return false.
    if (successRequired) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected lexeme: \"" + str + "\""
        );
    }
    return false;
}


export function parseImportStmt(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "import", successRequired) &&
        parseImportIdentifierList(lexArr, nextPos, true) &&
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
    // initialize variable to record the expected return type.
    var retType = ["undefined"];
    // parse function, and make sure to reset nextPos if parseIdentifier()
    // is called but return false (and if successRequired == false).
    if (
        parseLexeme(lexArr, nextPos, "function", successRequired) &&
        // this also records the return type by setting retType[0] to it.
        parseIdentifier(lexArr, nextPos, retType, successRequired)
    ) {
        parseIdentifierTuple(lexArr, nextPos, true);
        parseStmt(lexArr, nextPos, retType, true);
        return true;
    } else {
        nextPos[0] = initialPos;
        return false;
    }
}



function parseStmt(lexArr, nextPos, retType, successRequired) {
    let ret =
        parseBlockStmt(lexArr, nextPos, retType, false) ||
        parseIfElseStmt(lexArr, nextPos, retType, false) ||
        parseSwitchStmt(lexArr, nextPos, retType, false) ||
        parseLoopStmt(lexArr, nextPos, retType, false) ||
        parseSimpleStmt(lexArr, nextPos, retType, false) ||
        parseFunDef(lexArr, nextPos, retType, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected statement"
        );
    }
    return ret;
}


function parseBlockStmt(lexArr, nextPos, retType, successRequired) {
    return
        // With this implementation, e.q. {prop1:exp, prop2:exp}; is not
        // allowed as a statment.
        parseLexeme(lexArr, nextPos, "{", successRequired) &&
        parseStmtList(lexArr, nextPos, retType, true) &&
        parseLexeme(lexArr, nextPos, "}", true);
}


function parseStmtList(lexArr, nextPos, retType, successRequired) {
    // parse as many statements as possible of a possibly empty statement list.
    while (parseStmt(lexArr, nextPos, retType, false));
    // always return true.
    return true;
}




function parseIfStmt(lexArr, nextPos, retType, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "if", successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, ["any"], true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseStmt(lexArr, nextPos, retType, true);
}


function parseIfElseStmt(lexArr, nextPos, retType, successRequired) {
    // parse the initial mandatory if statement.
    if (!parseIfStmt(lexArr, nextPos, retType, successRequired)) {
        return false;
    }
    // parse all following else statements if there are any.
    while (parseLexeme(lexArr, nextPos, "else")) {
        parseStmt(lexArr, nextPos, retType, true);
    }
    // if all those else keywords were followed by a statement, return true.
    return true;
}






function parseSwitchStmt(lexArr, nextPos, retType, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "switch", successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, ["value"], true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseCaseBlock(lexArr, nextPos, retType, true);
}


function parseCaseBlock(lexArr, nextPos, retType, successRequired) {

    if (!parseLexeme(lexArr, nextPos, "{", successRequired)) {
        return false;
    }
    // parse first mandatory case statement.
    parseCaseStmt(lexArr, nextPos, retType, true);
    // parse optional case statements, including default case at last.
    while (parseCaseStmt(lexArr, nextPos, retType, false));
    parseDefaultCaseStmt(lexArr, nextPos, retType, false);

    parseLexeme(lexArr, nextPos, "}", true);

    return true;
}

function parseCaseStmt(lexArr, nextPos, retType, successRequired) {
    // parse fisrt "case <exp> :" expression.
    if (!parseLexeme(lexArr, nextPos, "case", successRequired)) {
        rerun false;
    }
    parseExp(lexArr, nextPos, ["value"], true);
    parseLexeme(lexArr, nextPos, ":", true)

    // parse an optional list of additional "case <exp> :" expressions.
    while (parseLexeme(lexArr, nextPos, "case", false)) {
        parseExp(lexArr, nextPos, ["value"], true);
        parseLexeme(lexArr, nextPos, ":", true);
    }
    // parse a non-empty list of statements possibly ending on "break;".
    parseStmt(lexArr, nextPos, retType, true);
    while (parseStmt(lexArr, nextPos, retType, false));
    if (parseLexeme(lexArr, nextPos, "break", false)) {
        parseLexeme(lexArr, nextPos, ";", true);
    }
    return true;
}

function parseDefaultCaseStmt(lexArr, nextPos, retType, successRequired) {
    // parse fisrt "case <exp> :" expression.
    if (!parseLexeme(lexArr, nextPos, "default", successRequired)) {
        rerun false;
    }
    parseLexeme(lexArr, nextPos, ":", true)

    // parse a non-empty list of statements possibly ending on "break;".
    parseStmt(lexArr, nextPos, retType, true);
    while (parseStmt(lexArr, nextPos, retType, false));
    if (parseLexeme(lexArr, nextPos, "break", false)) {
        parseLexeme(lexArr, nextPos, ";", true);
    }
    return true;
}








function parseLoopStmt(lexArr, nextPos, retType, successRequired) {
    let ret =
        parseForLoopStmt(lexArr, nextPos, retType, false) ||
        parseWhileLoopStmt(lexArr, nextPos, retType, false) ||
        parseDoWhileLoopStmt(lexArr, nextPos, retType, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected loop statement"
        );
    }
    return ret;
}



function parseForLoopStmt(lexArr, nextPos, retType, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "for", successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        // The JS syntax doc seems ambiguous here, so let's be safe.
        parseValVarDef(lexArr, nextPos, true) && // includes ';'.
        parseExp(lexArr, nextPos, ["any"], true) &&
        parseLexeme(lexArr, nextPos, ";", true) &&
        parseExp(lexArr, nextPos, ["any"], true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseStmt(lexArr, nextPos, retType, true);
}

function parseWhileLoopStmt(lexArr, nextPos, retType, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "while", successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, ["any"], true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseStmt(lexArr, nextPos, retType, true);
}


function parseDoWhileLoopStmt(lexArr, nextPos, retType, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "do", successRequired) &&
        parseStmt(lexArr, nextPos, retType, true) &&
        parseLexeme(lexArr, nextPos, "while", true) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, ["any"], true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseLexeme(lexArr, nextPos, ";", true);
}







function parseSimpleStmt(lexArr, nextPos, retType, successRequired) {
    let ret =
        parseLexeme(lexArr, nextPos, ";", false) ||
        parseVarDef(lexArr, nextPos, false) ||
        parseExpStmt(lexArr, nextPos, ["any"], false) ||
        parseReturnStmt(lexArr, nextPos, retType, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected simple statement"
        );
    }
    return ret;
}




function parseReturnStmt(lexArr, nextPos, retType, successRequired) {
    if (!parseLexeme(lexArr, nextPos, "return", successRequired)) {
        return false;
    }
    // (In order to ease the typechecking, we only allow the return of single
    // variables.)
    // read the returned type from the varaible.
    var varType = ["undefined"];
    // this also records the variables type by setting varType[0] to it.
    parseIdentifier(lexArr, nextPos, varType, true);
    // match this variable type with the required return type.
    if (varType[0] != retType[0]) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected variable of type " + retType[0]
        );
    }
    // parse the final ';' and either return true or throw an exception
    // depending on the result.
    return parseLexeme(lexArr, nextPos, ";", true);
}





function parseExpStmt(lexArr, nextPos, successRequired) {
    return
        parseExp(lexArr, nextPos, ["any"], successRequired) &&
        parseLexeme(lexArr, nextPos, ";", true);
}


// Value variables are either string or double variables (or undefined, NaN,
// etc.).
// (Var declaration without initialization is not implemented at this point.)
function parseVarDef(lexArr, nextPos, varType, successRequired) {
    return
        parseVarDefKeyword(lexArr, nextPos, successRequired) &&
        parseNonEmptyIdentifierList(lexArr, nextPos, varType, true) &&
        parseLexeme(lexArr, nextPos, "=", true) &&
        parseExp(lexArr, nextPos, varType, true) &&
        parseLexeme(lexArr, nextPos, ";", true);
}




function parseVarDefKeyword(lexArr, nextPos, successRequired) {
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
