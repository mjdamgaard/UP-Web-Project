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

const numExp1 =
    "\-?" +s+ "((" + numAtom + ")|(" + numFunCall + "))";


const aritOp =
    "[\+\-\*\/%(**)]";



const numAritExp1 =
    numExp1 +s+ "(" + aritOp +s+ numExp1 +s+ ")*";

const numAritExp2 =
    "\(" +s+ numAritExp1 +s+ "\)";

const numAritExp3 =
    "((" + numAritExp1 + ")|(" + "\-?" +s+ numAritExp2 + "))";


export const numPureExp =
    numAritExp3 +s+ "(" + aritOp +s+ numAritExp3 +s+ ")*";


/* Boolean expressions */

const numCompOp =
    "[(==)<>(<=)(>=)(!=)]";

const boolNumAtomComp =
    numAritExp1 +s+ numCompOp +s+ numAritExp1;

const







//
