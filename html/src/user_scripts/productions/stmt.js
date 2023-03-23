
import strExp, numExp, arrExp, objExp, boolExp, voidExp
    from "./productions/exp.js";

const s = "\s?";


const optVarKeywordPatt =
    "((export\s)?[(var)(let)(const)]\s)?";

const strVarAssignPatt =
    optVarKeywordPatt + strIdentPatt +s+ "=" +s+ strExpPatt +s+ ";" +s;
const numVarAssignPatt =
    optVarKeywordPatt + numIdentPatt +s+ "=" +s+ numExpPatt +s+ ";" +s;
const arrVarAssignPatt =
    optVarKeywordPatt + arrIdentPatt +s+ "=" +s+ arrExpPatt +s+ ";" +s;
const objVarAssignPatt =
    optVarKeywordPatt + objIdentPatt +s+ "=" +s+ objExpPatt +s+ ";" +s;
const boolVarAssignPatt =
    optVarKeywordPatt + boolIdentPatt +s+ "=" +s+ boolExpPatt +s+ ";" +s;


const stmtPatt =
    "("
        "(" + strVarAssignPatt + ")" +
    "|" +
        "(" + numVarAssignPatt + ")" +
    "|" +
        "(" + arrVarAssignPatt + ")" +
    "|" +
        "(" + objVarAssignPatt + ")" +
    "|" +
        "(" + boolVarAssignPatt + ")" +
    "|" +
        "(" + voidExp +s+ ";" ")" +
    "|" +
        "(" + numExp +s+ ";" ")" +
    ")";




// statement list without any branching.
const stmtSeriesPatt =
    "(" + stmtPatt +s+ ")*";



// some block statements that can include the above statements (and loop
// statements can also include if(-else) statements, by the way, but not the
// other way around).
const blockPatt =
    "\{" +s+ stmtSeriesPatt "\}" +s;

const ifBlockPatt =
    "if" +s+ "\(" +s+ boolExp +s+ "\)" +s+ blockPatt +s;


const ifElseBlockPatt = // Note that this pattern also includes the ifBlockPatt.
    ifBlockPatt +s+
    "(" + "else\s" + ifBlockPatt +s+ ")*" +
    "(" + "else" +s+ blockPatt +s+ ")?";


const loopInnerBlockPatt =
    "\{" +s+ "(" + stmtSeriesPatt +s+ "|"+ ifElseBlockPatt +s+ ")*" + "\}" +s;

// Note if(-else) statements cannot include loops directly; only indirectly
// by calling looping functions inside their blocks.
const whileLoopBlockPatt =
    "while" +s+ "\(" +s+ boolExp +s+ "\)" +s+ loopInnerBlockPatt +s;

const forLoopBlockPatt =
    "for" +s+ "\(" +s+ "(" + stmtPatt +s+ "){3}" + "\)" +s+
    loopInnerBlockPatt +s;

const stmtBlockPatt =
    "("
        "(" + forLoopBlockPatt + ")" +
    "|" +
        "(" + whileLoopBlockPatt + ")" +
    "|" +
        "(" + ifElseBlockPatt + ")" + // (This also includes the ifBlockPatt.)
    "|" +
        "(" + blockPatt + ")" +
    "|" +
        "(" + stmtSeriesPatt + ")" +
    ")";


// final "stmtLstPatt".
export const stmtLstPatt =
    "(" + stmtBlockPatt +s+ ")*";
