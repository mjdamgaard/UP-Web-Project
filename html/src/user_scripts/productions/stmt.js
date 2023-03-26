

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
    };
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

    // parse and get the type of the next identifier lexeme.
    var indentType = parseAndgetIdentType(lexArr, nextPosObj);
    // return false if indentifier is not a function identifier.
    if (!indentType.isFun) {
        return false;
    }
    // parse an identifier tuple (including the parentheses and with no type
    // checks).
    if (!parseIdentifierTuple(lexArr, nextPosObj)) {
        nextPosObj.pos = initialPos;
        return false;
    };
    // parse a block ending with the correct return statement (or no return
    // statement in the case of the "void" return type).
    if (!parseFunctionDefBlock(lexArr, nextPosObj, indentType.returnType)) {
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
