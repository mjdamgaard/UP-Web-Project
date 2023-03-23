


import reqWS, optWS //, identPatt, numPatt, strPatt
    from "./productions/atomic.js";

import identLstPatt
    from "./productions/ident_lst.js";

import stmtLstPatt
    from "./productions/stmt.js";


export const funDefPatt =
    "(export)?" +reqWS+
    "function" +reqWS+
    identPatt +optWS+
    "\(" +optWS+ identLstPatt + "\)" +optWS+
    "\{" +optWS+ stmtLstPatt + "\}";

export const funDefLstPatt =
    "(" + funDefPatt +optWS+ ")*";
