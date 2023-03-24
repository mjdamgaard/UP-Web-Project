
import
    boolIdentPatt, numIdentPatt, arrIdentPatt, objIdentPatt,
    strIdentPatt, txtIdentPatt, attIdentPatt,
    identLstPatt
from "./productions/ident.js";

import
    boolPureExpPatt, numPureExpPatt, arrPureExpPatt, objPureExpPatt,
    strPureExpPatt, txtPureExpPatt, attPureExpPatt
    voidExpPatt, numExpPatt
from "./productions/exp.js";

const s = "\s?";


const optVarKeywordPatt =
    "(((var)|(let)|((export\s)?const))\s)?";

const boolPureVarAssignPatt =
    optVarKeywordPatt + boolIdentPatt +s+ "=" +s+ boolPureExpPatt +s+ ";" +s;
const numPureVarAssignPatt =
    optVarKeywordPatt + numIdentPatt +s+ "=" +s+ numPureExpPatt +s+ ";" +s;
const arrPureVarAssignPatt =
    optVarKeywordPatt + arrIdentPatt +s+ "=" +s+ arrPureExpPatt +s+ ";" +s;
const objPureVarAssignPatt =
    optVarKeywordPatt + objIdentPatt +s+ "=" +s+ objPureExpPatt +s+ ";" +s;
const strPureVarAssignPatt =
    optVarKeywordPatt + strIdentPatt +s+ "=" +s+ strPureExpPatt +s+ ";" +s;
const txtPureVarAssignPatt =
    optVarKeywordPatt + txtIdentPatt +s+ "=" +s+ txtPureExpPatt +s+ ";" +s;
const attPureVarAssignPatt =
    optVarKeywordPatt + attIdentPatt +s+ "=" +s+ attPureExpPatt +s+ ";" +s;


const numVarAssignPatt =
    optVarKeywordPatt + numIdentPatt +s+ "=" +s+ numExpPatt +s+ ";" +s;


export const pureVarAssignPatt =
    "(" +
        "(" + strPureVarAssignPatt + ")" +
    "|" +
        "(" + numPureVarAssignPatt + ")" +
    "|" +
        "(" + arrPureVarAssignPatt + ")" +
    "|" +
        "(" + objPureVarAssignPatt + ")" +
    "|" +
        "(" + boolPureVarAssignPatt + ")" +
    ")" +s;

const procStmtPatt =
    "(" +
        "(" + voidExp +s+ ";" ")" +
    "|" +
        "(" + numExp +s+ ";" ")" +
    "|" +
        "(" + numVarAssignPatt + ")" +
    ")" +s;


const stmtSinglePatt =
    "(" +
        "(" + pureVarAssignPatt + ")" +
    "|" +
        "(" + procStmtPatt + ")" +
    ")" +s;


// statement list without any branching.
const stmtSeriesPatt =
    "(" + stmtSinglePatt +s+ ")*";



// some block statements that can include the above statements (and loop
// statements can also include if(-else) statements, by the way, but not the
// other way around).
const stmtSeriesBlockPatt =
    "\{" +s+ stmtSeriesPatt "\}" +s;

const ifBlockPatt =
    "if" +s+ "\(" +s+ boolPureExpPatt +s+ "\)" +s+ stmtSeriesBlockPatt +s;


const ifElseBlockPatt = // Note that this pattern also includes the ifBlockPatt.
    ifBlockPatt +s+
    "(" + "else\s" + ifBlockPatt +s+ ")*" +
    "(" + "else" +s+ stmtSeriesBlockPatt +s+ ")?";


const loopInnerBlockPatt =
    "\{" +s+ "(" + stmtSeriesPatt +s+ "|"+ ifElseBlockPatt +s+ ")*" + "\}" +s;

// Note if(-else) statements cannot include loops directly; only indirectly
// by calling looping functions inside their blocks.
const whileLoopBlockPatt =
    "while" +s+ "\(" +s+ boolPureExpPatt +s+ "\)" +s+ loopInnerBlockPatt +s;

const forLoopBeginningPatt =
    "for" +s+ "\(" +s+
        numPureVarAssignPatt +s+ boolPureExpPatt +s+ ";" +s+ stmtSinglePatt +s+
     "\)" +s;

const forLoopBlockPatt =
    "(" + forLoopBeginningPatt +s+ ")+" +
    loopInnerBlockPatt +s;



export const stmtNoFunDefLstPatt =
    "(" +
        "(" + stmtSeriesPatt +s+ ")" +
    "|" +
        "(" + ifElseBlockPatt +s+ ")" +
    "|" +
        "(" + forLoopBlockPatt +s+ ")" +
    "|" +
        "(" + whileLoopBlockPatt +s+ ")" + // (This also includes the ifBlockPatt.)
    "|" +
        "(" + stmtSeriesBlockPatt +s+ ")" +
    ")*";




export const funDefPatt =
    "(export\s)?" +
    "function\s" +
    identPatt +s+
    "\(" +s+ identLstPatt +s+ "\)" +s+
    "\{" +s+ stmtNoFunDefLstPatt +s+ "\}" +s;

export const funDefLstPatt =
    "(" + funDefPatt +s+ ")*";


export const stmtLstPatt =
    "(" +
        "(" + stmtNoFunDefLstPatt +s+ ")" +
    "|" +
        "(" + funDefLstPatt +s+ ")" +
    ")*";
// pureVarAssignPatt is also exported above.
