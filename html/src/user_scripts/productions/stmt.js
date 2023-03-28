
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
        !parseFunDef(lexArr, nextPos, false) ||
        !parseVarDef(lexArr, nextPos, false)
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
    // record the initial position.
    let initialPos = nextPos[0];

    parseLexeme(lexArr, nextPos, "{", successRequired);
}

function parseCaseSeries(lexArr, nextPos, successRequired) {
    // record the initial position.
    let initialPos = nextPos[0];
    // parse a series of at least one "case exp :" sequence.
    if (parseLexeme(lexArr, nextPos, "case", successRequired)) {
        parseExp(lexArr, nextPos, true);
        parseLexeme(lexArr, nextPos, ":", true);
    }
    while (parseLexeme(lexArr, nextPos, "case", false)) {
        parseExp(lexArr, nextPos, true);
        parseLexeme(lexArr, nextPos, ":", true);
    }
    parseStmt(lexArr, nextPos, true);

    while (
        parseLexeme(lexArr, nextPos, "case", false) ||
        parseLexeme(lexArr, nextPos, "default", false)
    ) {
        parseExp(lexArr, nextPos, true);
        parseLexeme(lexArr, nextPos, ":", true);
    }
}



function parseLoopStmt(lexArr, nextPos) {
    return
        parseForLoopStmt(lexArr, nextPos) ||
        parseWhileLoopStmt(lexArr, nextPos) ||
        parseDoWhileLoopStmt(lexArr, nextPos);
}



function parseForLoopStmt(lexArr, nextPos) {
    let initialPos = nextPos[0];
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
    let initialPos = nextPos[0];
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
    let initialPos = nextPos[0];
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
