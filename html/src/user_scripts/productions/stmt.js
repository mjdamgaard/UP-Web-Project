
import parseExp from "./exp.js";


export function parseImportStmt(lexArr, nextPosObj) {
    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse the first keyword lexeme of an import statement.
    if (lexArr[nextPosObj.pos] == "import") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        return false;
    }
    // parse an identifier list.
    if (!parseIdentifierList(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }
    // parse "from" lexeme.
    if (lexArr[nextPosObj.pos] == "from") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        nextPosObj.pos = initialPos;
        return false;
    }
    // parse import path string literal.
    if (!parseImportPath(lexArr, nextPosObj)) {
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


export function parseFunDef(lexArr, nextPosObj) {
    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse the first keyword lexemes of a function definition.
    if (
        lexArr[nextPosObj.pos] == "export" &&
        lexArr[nextPosObj.pos + 1] == "function"
    ) {
        nextPosObj.pos = nextPosObj.pos + 2;

    } else if (
        lexArr[nextPosObj.pos] == "function"
    ) {
        nextPosObj.pos = nextPosObj.pos + 1;

    } else {
        return false;
    }

    // parse function identifier.
    if (!parseIdentifier(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }

    // parse an identifier tuple (including the parentheses and with no type
    // checks).
    if (!parseIdentifierTuple(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }

    // parse either a block of pure or impure statements depending
    // on varType.isPure. All return statments nested in this block (if any)
    // have to return the right type, namely the one given by varType.retType.
    if (!parseBlockStmt(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }
    // if all parsing succeeded, return true.
    return true;
}


function parseBlockStmt(lexArr, nextPosObj) {
    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse the initial '{'. (We don't care to include non-block function
    // definitions.)
    if (lexArr[nextPosObj.pos] == "{") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        return false;
    }
    // parse a list of non-return statements, either pure or impure depending
    // on varType.isPure. As many statements as possible are parsed here
    // (possibly zero).
    if (!parseStmtList(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }
    // parse the final '}'.
    if (lexArr[nextPosObj.pos] == "}") {
        nextPosObj.pos = nextPosObj.pos + 1;
    } else {
        nextPosObj.pos = initialPos;
        return false;
    }
    // if all parsing succeeded, return true.
    return true;
}


function parseStmtList(lexArr, nextPosObj) {
    // parse as many statements as possible of a possibly empty statement list.
    var matchWasFound = true;
    while (matchWasFound) {
        matchWasFound = (
            parseSingleStmt(lexArr, nextPosObj) ||
            parseIfElseStmt(lexArr, nextPosObj) ||
            parseSwitchStmt(lexArr, nextPosObj) ||
            parseLoopStmt(lexArr, nextPosObj) ||
            parseBlockStmt(lexArr, nextPosObj) ||
        );
    }
    // always returns true after parsing as many statements as possible.
    return true;
}


function parseIfElseStmt(lexArr, nextPosObj) {
    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse the initial if statement in full.

    if (!parseIfStmt(lexArr, nextPosObj) ) {
        nextPosObj.pos = initialPos;
        return false;
    }
    // if "else" is the next lexeme, parse either an additional if statement
    // or a block statement after it. Do this until next lexeme is not "else".
    while (lexArr[nextPosObj.pos] == "else") {
        nextPosObj.pos = nextPosObj.pos + 1;
        if (
            !parseIfStmt(lexArr, nextPosObj) &&
            !parseBlockStmt(lexArr, nextPosObj)
        ) {
            nextPosObj.pos = initialPos;
            return false;
        }
    }
    // if all parsing succeeded, return true.
    return true;
}


function parseIfStmt(lexArr, nextPosObj) {
    // record the initial position.
    var initialPos = nextPosObj.pos;
    // parse the initial 'if'.
    if (lexArr[nextPosObj.pos] == "if") {
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
    // parse expression inside condition parentheses.
    if (!parseExp(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    }
    // parse the ')' before the consequence statement.
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
