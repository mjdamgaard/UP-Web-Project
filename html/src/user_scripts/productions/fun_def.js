


import reqWS, optWS //, identPatt, numPatt, strPatt
from "./productions/atomic.js";

import identLstPatt
from "./productions/ident_lst.js";

import stmtLstPatt
from "./productions/stmt.js";


export const funDefPatt =
    "(export\s)?" +
    "function\s" +
    identPatt + "\s?" +
    "\(\s?" + identLstPatt + "\)\s" + // all "LstPatt"s have "\s?" at the end.
    "\{\s?" + stmtLstPatt + "\}";

export const funDefLstPatt =
    "(" + funDefPatt + "\s?)*";
