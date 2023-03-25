//TODO:
    // boolPureExp, numPureExp, arrPureExp, objPureExp,
    // strPureExp, txtPureExp, attPureExp
    // voidExp, numExp

import
    boolIdent, numIdent, arrIdent, objIdent,
    strIdent, txtIdent, attIdent,
    boolFunIdent, numFunIdent, arrFunIdent, objFunIdent,
    strFunIdent, txtFunIdent, attFunIdent,
    voidFunIdent, ecFunIdent
    identLst
from "./productions/ident.js";

import
    boolLiteral, numLiteral, strLiteral, txtLiteral, attLiteral,
    arrLiteral, objLiteral
from "./productions/literal.js";


export const boolAtom =
    "((" + boolLiteral + ")|(" + boolIdent + "))";
export const numAtom =
    "((" + numLiteral + ")|(" + numIdent + "))";
export const strAtom =
    "((" + strLiteral + ")|(" + strIdent + "))";
export const txtAtom =
    "((" + txtLiteral + ")|(" + txtIdent + "))";
export const attAtom =
    "((" + attLiteral + ")|(" + attIdent + "))";
export const arrAtom =
    "((" + arrLiteral + ")|(" + arrIdent + "))";
export const objAtom =
    "((" + objLiteral + ")|(" + objIdent + "))";



const boolFunCall =
    boolFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;
const numFunCall =
    numFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;
const strFunCall =
    strFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;
const txtFunCall =
    txtFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;
const attFunCall =
    attFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;
const arrFunCall =
    arrFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;
const objFunCall =
    objFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;

const voidFunCall =
    voidFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;
const ecFunCall =
    ecFunIdent +s+ "\(" +s+ identLst +s+ "\)" +s;



/* Numerical expressions */


const aritOp =
    "[\+\-\*\/%(\*\*)]";



const numAritExp1 =
    numAtom +s+ "(" + aritOp +s+ numAtom +s+ ")*";

const numAritExp2 =
    "\(" +s+ numAritExp1 +s+ "\)";

const numAritExp3 =
    "((" + numAritExp1 + ")|(" + "\-?" +s+ numAritExp2 + "))";


export const numPureExp =
    numAritExp3 +s+ "(" + aritOp +s+ numAritExp3 +s+ ")*";


/* Boolean expressions */

const numCompOp =
    "[(==)<>(<=)(>=)(!=)]";

const boolNumAritComp =
    numAritExp1 +s+ numCompOp +s+ numAritExp1;


const boolNoLogOp =
    "((" + "!?" +s+ boolAtom + ")|(" + boolNumAritComp + "))";


const logOp =
    "[(\|\|)(\?\?)(&&)]";

const boolCompoundExp =
    boolNoLogOp +s+ "(" + logOp +s+ boolNoLogOp +s+ ")*";


export const boolPureExp =
    "(" +
        "(" + boolCompoundExp +s+ ")" +
    "|" +
        "(" + boolFunCall +s+ ")" +
    ")";






/* String, text (safe for HTML printing) and attribute (safe for printing as
 * HTML attribute values) expressions
 **/

const strNoConcat =
    "((" + strAtom + ")|(" + strFunCall + "))";
const txtNoConcat =
    "((" + txtAtom + ")|(" + txtFunCall + "))";
const attNoConcat =
    "((" + attAtom + ")|(" + attFunCall + "))";


const strPureExp =
    strNoConcat +s+ "(" + "\+" +s+ strNoConcat +s+ ")*";
const txtPureExp =
    txtNoConcat +s+ "(" + "\+" +s+ txtNoConcat +s+ ")*";
const attPureExp =
    attNoConcat +s+ "(" + "\+" +s+ attNoConcat +s+ ")*";


/* Array and object expressions */

export const arrPureExp =
    "((" + arrAtom + ")|(" + arrFunCall + "))";
export const objPureExp =
    "((" + objAtom + ")|(" + objFunCall + "))";


/* Void and exit code (ec) expressions */

export const voidExp =
    "((" + voidFunCall + ")|(" + numIdent +s+ "[(\+\+)(\-\-)]" + "))";

export const ecExp =
    ecFunCall;


// (12:44, 25.03.23) Commit msg: "sorta done with exp.js, but I
// imagine that all this will give me a very large string, so now
// I'm wondering, if it wouldn't be better to just go the AST way
// instead from the beginning.."
// ..Hm, but maybe I can just parse one regex at a.. Wait.. Maybe I could
// just lex the script first in an way where I already create a tree in this
// lexing step..! I'm thinking about parsing all parentheses as one "word,"
// essentially, and then "lex" each element of such "compound words," as
// we can call them, recursively..!.. (12:49) ..Well, let me just call it
// an initial parsing, where we achieve lexing as well as getting an
// initial syntax tree, namely where all parentheses are.. wait no, let me
// actually not really "lex" the script at all. Let me instead just make
// the initial parsing return an array of subprograms, which themselves are
// either strings with any multiple-character whitespace reduced to a single
// \s, or they are arrays themselves (of strings and arrays on so on).
// ...(13:48) No, I should also lex the program initially. :)
