
const s = "\s?";










// statment list without any branching.
const stmtSeriesPatt =
    "(" + stmtPatt +s+ ")*";



// some block statements that can include the above statements (and loop
// statements can also include if(-else) statements, by the way, but not the
// other way around).
const blockPatt =
    "\{" +s+ stmtSeriesPatt "\}" +s;

const ifBlockPatt =
    "if" +s+ "\(" +s+ condPatt +s+ "\)" +s+ blockPatt +s;


const ifElseBlockPatt = // Note that this pattern also includes the ifBlockPatt.
    ifBlockPatt +s+
    "(" + "else\s" + ifBlockPatt +s+ ")*" +
    "(" + "else" + blockPatt +s+ ")?";


const loopInnerBlockPatt =
    "\{" +s+ "(" + stmtSeriesPatt +s+ "|"+ ifElseBlockPatt +s+ ")*" + "\}" +s;

// Note if(-else) statements cannot include loops directly; only indirectly
// by calling looping functions inside their blocks.
const whileLoopBlockPatt =
    "while" +s+ "\(" +s+ condPatt +s+ "\)" +s+ loopInnerBlockPatt +s;

const forLoopBlockPatt =
    "for" +s+ "\(" +s+ "(" + stmtPatt +s+ "){3}" + "\)" +s+
    loopInnerBlockPatt +s;

const stmtBlockPatt =
    "("
        forLoopBlockPatt +s+ "|" +
        whileLoopBlockPatt +s+ "|" +
        ifElseBlockPatt +s+ "|" + // (This also includes the ifBlockPatt.)
        blockPatt +s+ "|" +
        stmtSeriesPatt +s+
    ")*";


// final "stmtLstPatt".
export const stmtLstPatt =
    "(" + stmtBlockPatt +s+ ")*";
