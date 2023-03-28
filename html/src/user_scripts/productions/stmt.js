
import parseExp from "./exp.js";

class ParseException {
    constructor(pos, msg) {
        this.pos = pos;
        this.msg = msg;
    }
}

parseLexeme(str, lexArr, nextPos, successRequired) {
    if (lexArr[nextPos[0]] == str) {
        nextPos[0] = nextPos[0] + 1;
        return true;
    } else {
        if (successRequired) {
            throw new ParseException(
                nextPos[0], "Expected lexeme: \"" + str + "\""
            );
        }
        return false;
    }
}


export function parseImportStmt(lexArr, nextPos, successRequired) {
    // record the initial position.
    var initialPos = nextPos[0];
    // parse import statement.
    if (
        parseLexeme(lexArr, nextPos, "import", false) && // short-circuits if false.
        parseIdentifierList(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, "from", true) &&
        parseImportPath(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ";", true)
    ) {
        // if all parsing succeeded, return true.
        return true;
    } else {
        if (successRequired) {
            throw new ParseException(
                nextPos[0], "Expected import statement"
            );
        }
        // else reset the position to the initial one and return false.
        nextPos[0] = initialPos;
        return false;
    }
}


export function parseFunDef(lexArr, nextPos, successRequired) {
    // record the initial position.
    var initialPos = nextPos[0];
    // parse function definition.
    if (
        (
            parseLexeme(lexArr, nextPos, "function", false)
            || // short circuits if true, has less precedence than &&.
            parseLexeme(lexArr, nextPos, "export", false) &&
            parseLexeme(lexArr, nextPos, "function", false)
        )
        &&
        parseIdentifier(lexArr, nextPos, true) &&
        parseIdentifierTuple(lexArr, nextPos, true) &&
        parseStmt(lexArr, nextPos, true)
    ) {
        // if all parsing succeeded, return true.
        return true;
    } else {
        if (successRequired) {
            throw new ParseException(
                nextPos[0], "Expected function definition"
            );
        }
        // else reset the position to the initial one and return false.
        nextPos[0] = initialPos;
        return false;
    }
}

function parseStmt(lexArr, nextPos, successRequired) {
    let ret =
        parseBlockStmt(lexArr, nextPos) ||
        parseIfElseStmt(lexArr, nextPos) ||
        parseSwitchStmt(lexArr, nextPos) ||
        parseLoopStmt(lexArr, nextPos) ||
        parseSingleStmt(lexArr, nextPos);

    if (successRequired && !ret) {
        throw new ParseException(
            nextPos[0], "Expected statement"
        );
    }
    return ret;
}


function parseBlockStmt(lexArr, nextPos, successRequired) {
    var initialPos = nextPos[0];
    if (
        parseLexeme(lexArr, nextPos, "{", false) &&
        parseStmtList(lexArr, nextPos, false) &&
        parseLexeme(lexArr, nextPos, "}", false)
    ) {
        return true;
    } else {
        if (successRequired) {
            throw new ParseException(
                nextPos[0], "Expected block statement"
            );
        }
        nextPos[0] = initialPos;
        return false;
    }
}


function parseStmtList(lexArr, nextPos, successRequired) {
    // parse as many statements as possible of a possibly empty statement list.
    while (parseStmt(lexArr, nextPos));
    // always return true.
    return true;
}




function parseIfStmt(lexArr, nextPos, successRequired) {
    var initialPos = nextPos[0];
    if (
        parseLexeme(lexArr, nextPos, "if", false) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ")", true) &&
        parseStmt(lexArr, nextPos, true)
    ) {
        return true;
    } else {
        if (successRequired) {
            throw new ParseException(
                nextPos[0], "Expected if statement"
            );
        }
        nextPos[0] = initialPos;
        return false;
    }
}

function parseIfElseStmt(lexArr, nextPos, successRequired) {
    var initialPos = nextPos[0];
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


















function parseSwitchStmt(lexArr, nextPos, isPure) {
    // TODO: Implement.
}


function parseLoopStmt(lexArr, nextPos) {
    return
        parseForLoopStmt(lexArr, nextPos) ||
        parseWhileLoopStmt(lexArr, nextPos) ||
        parseDoWhileLoopStmt(lexArr, nextPos);
}



function parseForLoopStmt(lexArr, nextPos) {
    var initialPos = nextPos[0];
    if (
        parseLexeme(lexArr, nextPos, "for") &&
        parseLexeme(lexArr, nextPos, "(") &&
        // The JS syntax doc seems ambiguous here, so let's be safe.
        parseVarAssignment(lexArr, nextPos) && // includes ';'.
        parseExp(lexArr, nextPos) &&
        parseLexeme(lexArr, nextPos, ";") &&
        parseExp(lexArr, nextPos) &&
        parseLexeme(lexArr, nextPos, ")") &&
        parseStmt(lexArr, nextPos)
    ) {
        return true;
    } else {
        nextPos[0] = initialPos;
        return false;
    }


    // record the initial position.
    var initialPos = nextPos[0];
    // parse the initial 'for'.
    if (lexArr[nextPos[0]] == "for") {
        nextPos[0] = nextPos[0] + 1;
    } else {
        return false;
    }
    // parse the first '('.
    if (lexArr[nextPos[0]] == "(") {
        nextPos[0] = nextPos[0] + 1;
    } else {
        nextPos[0] = initialPos;
        return false;
    }
    // parse two statements.
    if (
        !parseVarAssignStmt(lexArr, nextPos) ||
        !parseExp(lexArr, nextPos) ... // TODO: continue (but refactor, btw).
    ) {
        nextPos[0] = initialPos;
        return false;
    }
    // parse final expression before the last ')'.
    if (!parseExp(lexArr, nextPos)) {
        nextPos[0] = initialPos;
        return false;
    }

    // parse the last ')' before the consequence statement.
    if (lexArr[nextPos[0]] == ")") {
        nextPos[0] = nextPos[0] + 1;
    } else {
        nextPos[0] = initialPos;
        return false;
    }
    // parse a block statement, and only that; not a single statement (even
    // though such is allowed in JS proper).
    if (!parseBlockStmt(lexArr, nextPos)) {
        nextPos[0] = initialPos;
        return false;
    }
    // if all parsing succeeded, return true.
    return true;
}



















// TODO: Change.
function parseReturnStmt(lexArr, nextPos, successRequired) {
    // return true immediately, if the return type is "void."
    if (varType.retType == "void") {
        return true;
    }
    // record the initial position.
    var initialPos = nextPos[0];
    // parse the first keyword lexeme of a return statement.
    if (lexArr[nextPos[0]] == "return") {
        nextPos[0] = nextPos[0] + 1;
    } else {
        return false;
    }
    // parse expression of the correct type and of the correct purity.
    if (!parseExp(lexArr, nextPos)) {
        nextPos[0] = initialPos;
        return false;
    }
    // parse final ';'.
    if (lexArr[nextPos[0]] == ";") {
        nextPos[0] = nextPos[0] + 1;
    } else {
        nextPos[0] = initialPos;
        return false;
    }
    // if all parsing succeeded, return true.
    return true;
}



import
    boolIdent, numIdent, arrIdent, objIdent,
    strIdent, txtIdent, attIdent,
    identLst
from "./ident.js";

import
    boolPureExp, numPureExp, arrPureExp, objPureExp,
    strPureExp, txtPureExp, attPureExp
    voidExp, ecExp,
    numAtom
from "./exp.js";

const s = "\s?";


const optVarKeyword =
    "((export\s)?((var)|(let)|(const))\s)?";

const boolPureVarAssign =
    optVarKeyword + boolIdent +s+ "=" +s+ boolPureExp +s+ ";" +s;
const numPureVarAssign =
    optVarKeyword + numIdent +s+ "=" +s+ numPureExp +s+ ";" +s;
const arrPureVarAssign =
    optVarKeyword + arrIdent +s+ "=" +s+ arrPureExp +s+ ";" +s;
const objPureVarAssign =
    optVarKeyword + objIdent +s+ "=" +s+ objPureExp +s+ ";" +s;
const strPureVarAssign =
    optVarKeyword + strIdent +s+ "=" +s+ strPureExp +s+ ";" +s;
const txtPureVarAssign =
    optVarKeyword + txtIdent +s+ "=" +s+ txtPureExp +s+ ";" +s;
const attPureVarAssign =
    optVarKeyword + attIdent +s+ "=" +s+ attPureExp +s+ ";" +s;


const numECVarAssign =
    optVarKeyword + numIdent +s+ "=" +s+ ecExp +s+ ";" +s;


export const pureVarAssign =
    "(" +
        "(" + strPureVarAssign + ")" +
    "|" +
        "(" + numPureVarAssign + ")" +
    "|" +
        "(" + arrPureVarAssign + ")" +
    "|" +
        "(" + objPureVarAssign + ")" +
    "|" +
        "(" + boolPureVarAssign + ")" +
    ")" +s;

const procStmt =
    "(" +
        "(" + voidExp +s+ ";" ")" +
    "|" +
        "(" + ecExp +s+ ";" ")" +
    "|" +
        "(" + numECVarAssign + ")" +
    ")" +s;


const stmtSingle =
    "(" +
        "(" + pureVarAssign + ")" +
    "|" +
        "(" + procStmt + ")" +
    ")" +s;


// statement list without any branching.
const stmtSeries =
    "(" + stmtSingle +s+ ")*";



// some block statements that can include the above statements (and loop
// statements can also include if(-else) statements, by the way, but not the
// other way around).
const stmtSeriesBlock =
    "\{" +s+ stmtSeries "\}" +s;

const ifBlock =
    "if" +s+ "\(" +s+ boolPureExp +s+ "\)" +s+ stmtSeriesBlock +s;


const ifElseBlock = // Note that this ern also includes the ifBlock.
    ifBlock +s+
    "(" + "else\s" + ifBlock +s+ ")*" +
    "(" + "else" +s+ stmtSeriesBlock +s+ ")?";


const loopInnerBlock =
    "\{" +s+ "((" + stmtSeries +s+ ")|("+ ifElseBlock +s+ "))*" + "\}" +s;

// Note if(-else) statements cannot include loops directly; only indirectly
// by calling looping functions inside their blocks.
const whileLoopBlock =
    "while" +s+ "\(" +s+ boolPureExp +s+ "\)" +s+ loopInnerBlock +s;

const forLoopBeginning =
    "for" +s+ "\(" +s+
        "let\s" + numIdent +s+ "=" +s+ numAtom +s+ ";"
        numIdent +s+ "[<>(<=)(>=)]" +s+ numAtom  +s+ ";" +s+
        numAtom +s+ "[(\+\+)(\-\-)]" +s+
        // voidExp +s+
     "\)" +s;

const forLoopBlock =
    "(" + forLoopBeginning +s+ ")+" +
    loopInnerBlock +s;



export const stmtNoFunDefLst =
    "(" +
        "(" + stmtSeries +s+ ")" +
    "|" +
        "(" + ifElseBlock +s+ ")" +
    "|" +
        "(" + forLoopBlock +s+ ")" +
    "|" +
        "(" + whileLoopBlock +s+ ")" + // (This also includes the ifBlock.)
    "|" +
        "(" + stmtSeriesBlock +s+ ")" +
    ")*";




export const boolfunDef =
    "(export\s)?" +
    "function\s" +
    boolFunident +s+
    "\(" +s+ identLst +s+ "\)" +s+
    "\{" +s+
        stmtNoFunDefLst +s+
        "return\s" boolPureExp +s+ ";"
    "\}" +s;

export const funDefLst =
    "(" + funDef +s+ ")*";


export const stmtLst =
    "(" +
        "(" + stmtNoFunDefLst +s+ ")" +
    "|" +
        "(" + funDefLst +s+ ")" +
    ")*";
// pureVarAssign is also exported above.
