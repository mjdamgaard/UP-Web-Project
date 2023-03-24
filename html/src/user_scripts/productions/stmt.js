
import
    boolIdent, numIdent, arrIdent, objIdent,
    strIdent, txtIdent, attIdent,
    identLst
from "./productions/ident.js";

import
    boolPureExp, numPureExp, arrPureExp, objPureExp,
    strPureExp, txtPureExp, attPureExp
    voidExp, ecExp
from "./productions/exp.js";

const s = "\s?";


const optVarKeyword =
    "(((var)|(let)|((export\s)?const))\s)?";

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
    "\{" +s+ "(" + stmtSeries +s+ "|"+ ifElseBlock +s+ ")*" + "\}" +s;

// Note if(-else) statements cannot include loops directly; only indirectly
// by calling looping functions inside their blocks.
const whileLoopBlock =
    "while" +s+ "\(" +s+ boolPureExp +s+ "\)" +s+ loopInnerBlock +s;

const forLoopBeginning =
    "for" +s+ "\(" +s+
        numPureVarAssign +s+ boolPureExp +s+ ";" +s+ stmtSingle +s+
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




export const funDef =
    "(export\s)?" +
    "function\s" +
    ident +s+
    "\(" +s+ identLst +s+ "\)" +s+
    "\{" +s+ stmtNoFunDefLst +s+ "\}" +s;

export const funDefLst =
    "(" + funDef +s+ ")*";


export const stmtLst =
    "(" +
        "(" + stmtNoFunDefLst +s+ ")" +
    "|" +
        "(" + funDefLst +s+ ")" +
    ")*";
// pureVarAssign is also exported above.
