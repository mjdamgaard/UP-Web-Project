
import parseExp from "./exp.js";


parseLexeme(str, lexArr, nextPosObj, successRequired) {
    if (lexArr[nextPosObj.pos] == str) {
        nextPosObj.pos = nextPosObj.pos + 1;
        return true;
    } else {
        if (successRequired) {
            throw new Exception();
        }
        return false;
    }
}


export function parseImportStmt(lexArr, nextPosObj) {
    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse import statement.
    if (
        parseLexeme(lexArr, nextPosObj, "import") && // short-circuits if false.
        parseIdentifierList(lexArr, nextPosObj) &&
        parseLexeme(lexArr, nextPosObj, "from") &&
        parseImportPath(lexArr, nextPosObj) &&
        parseLexeme(lexArr, nextPosObj, ";")
    ) {
        // if all parsing succeeded, return true.
        return true;
    } else {
        // else reset the position to the initial one and return false.
        nextPosObj.pos = initialPos;
        return false;
    }
}


export function parseFunDef(lexArr, nextPosObj) {
    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse function definition.
    if (
        (
            parseLexeme(lexArr, nextPosObj, "function")
            || // short circuits if true, has less precedence than &&.
            parseLexeme(lexArr, nextPosObj, "export") &&
            parseLexeme(lexArr, nextPosObj, "function")
        )
        &&
        parseIdentifier(lexArr, nextPosObj) &&
        parseIdentifierTuple(lexArr, nextPosObj) &&
        parseStmt(lexArr, nextPosObj)
    ) {
        // if all parsing succeeded, return true.
        return true;
    } else {
        // else reset the position to the initial one and return false.
        nextPosObj.pos = initialPos;
        return false;
    }
}

function parseStmt(lexArr, nextPosObj) {
    return
        parseBlockStmt(lexArr, nextPosObj) ||
        parseIfElseStmt(lexArr, nextPosObj) ||
        parseSwitchStmt(lexArr, nextPosObj) ||
        parseLoopStmt(lexArr, nextPosObj) ||
        parseSingleStmt(lexArr, nextPosObj);
}


function parseBlockStmt(lexArr, nextPosObj) {
    var initialPos = nextPosObj.pos;
    if (
        parseLexeme(lexArr, nextPosObj, "{") &&
        parseStmtList(lexArr, nextPosObj) &&
        parseLexeme(lexArr, nextPosObj, "}")
    ) {
        return true;
    } else {
        nextPosObj.pos = initialPos;
        return false;
    }
}


function parseStmtList(lexArr, nextPosObj) {
    // parse as many statements as possible of a possibly empty statement list.
    while (parseStmt(lexArr, nextPosObj));
    // always return true.
    return true;
}




function parseIfStmt(lexArr, nextPosObj) {
    var initialPos = nextPosObj.pos;
    if (
        parseLexeme(lexArr, nextPosObj, "if") &&
        parseLexeme(lexArr, nextPosObj, "(") &&
        parseExp(lexArr, nextPosObj) &&
        parseLexeme(lexArr, nextPosObj, ")") &&
        parseStmt(lexArr, nextPosObj)
    ) {
        return true;
    } else {
        nextPosObj.pos = initialPos;
        return false;
    }
}

function parseIfElseStmt(lexArr, nextPosObj) {
    var initialPos = nextPosObj.pos;
    // parse the initial mandatory if statement.
    if (!parseIfStmt(lexArr, nextPosObj)) {
        return false;
    }
    // parse all following else statements if there are any.
    while (parseLexeme(lexArr, nextPosObj, "else")) {
        if (!parseStmt(lexArr, nextPosObj)) {
            // reset the position to the initial one and return false.
            nextPosObj.pos = initialPos;
            return false; // (One could also throw an exception here.)
        }
    }
    // if all those else keywords were followed by a statement, return true.
    return true;
}




function parseSwitchStmt(lexArr, nextPosObj, isPure) {
    // TODO: Implement.
}


function parseLoopStmt(lexArr, nextPosObj) {
    return
        parseForLoopStmt(lexArr, nextPosObj) ||
        parseWhileLoopStmt(lexArr, nextPosObj) ||
        parseDoWhileLoopStmt(lexArr, nextPosObj);
}



function parseForLoopStmt(lexArr, nextPosObj) {
    var initialPos = nextPosObj.pos;
    if (
        parseLexeme(lexArr, nextPosObj, "for") &&
        parseLexeme(lexArr, nextPosObj, "(") &&
        // The JS syntax doc seems ambiguous here, so let's be safe.
        parseVarAssignment(lexArr, nextPosObj) && // includes ';'.
        parseExp(lexArr, nextPosObj) &&
        parseLexeme(lexArr, nextPosObj, ";") &&
        parseExp(lexArr, nextPosObj) &&
        parseLexeme(lexArr, nextPosObj, ")") &&
        parseStmt(lexArr, nextPosObj)
    ) {
        return true;
    } else {
        nextPosObj.pos = initialPos;
        return false;
    }


    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse the initial 'for'.
    if (lexArr[nextPosObj.pos] == "for") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        return false;
    }
    // parse the first '('.
    if (lexArr[nextPosObj.pos] == "(") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        nextPosObj.pos = initialPos;
        return false;
    }
    // parse two statements.
    if (
        !parseVarAssignStmt(lexArr, nextPosObj) ||
        !parseExp(lexArr, nextPosObj) ... // TODO: continue (but refactor, btw).
    ) {
        nextPosObj.pos = initialPos;
        return false;
    }
    // parse final expression before the last ')'.
    if (!parseExp(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }

    // parse the last ')' before the consequence statement.
    if (lexArr[nextPosObj.pos] == ")") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        nextPosObj.pos = initialPos;
        return false;
    }
    // parse a block statement, and only that; not a single statement (even
    // though such is allowed in JS proper).
    if (!parseBlockStmt(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }
    // if all parsing succeeded, return true.
    return true;
}



















// TODO: Change.
function parseReturnStmt(lexArr, nextPosObj) {
    // return true immediately, if the return type is "void."
    if (varType.retType == "void") {
        return true;
    }
    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse the first keyword lexeme of a return statement.
    if (lexArr[nextPosObj.pos] == "return") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        return false;
    }
    // parse expression of the correct type and of the correct purity.
    if (!parseExp(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }
    // parse final ';'.
    if (lexArr[nextPosObj.pos] == ";") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        nextPosObj.pos = initialPos;
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
