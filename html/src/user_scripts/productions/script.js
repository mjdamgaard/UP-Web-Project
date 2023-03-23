
/* This defines a non-recursive subset of JavaScript. More precisely,
 * the subset includes no recursively defined productions in its grammar.
 * In pratice, this e.g. means that function declarations cannot be nested
 * inside other function declarations/definitions. And more importantly, it
 * means that non-atomic (compound) expressions cannot be nested inside other
 * expressions, such as in '3 + (2 + 1).' And in general, the use of
 * parentheses in expressions are allowed in this subset. Note however, that
 * some associative operators such as '+' might allowed, which e.g. means that
 * '3 + 2 + 1' is in fact allowed.
 * While the production rules are not recursive, this does not mean that the
 * programs themselves cannot include recursive functions. On the contrary,
 * functions with recursive semantics are a part of this language subset.
 **/



import reqWS, optWS //, identPatt, numPatt, strPatt
    from "./productions/atomic.js";


import stmtLstPatt
    from "./productions/stmt.js";


import funDefLstPatt
    from "./productions/fun_def.js";

import importLstPatt
    from "./productions/import.js";

export const scriptPatt =
    optWS + '"use strict";' +optWS+
    importLstPatt +
    funDefLstPatt +
    stmtLstPatt + // these do not include function definitions in this subset.
    funDefLstPatt + optWS;










//
