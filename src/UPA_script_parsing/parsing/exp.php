<?php

import {
    ParseException
} from "../exceptions/except.js";

import {
    parseVarIdent, parseFunIdent
} from "./ident.js";

import {
    parseLexeme
} from "./symbol.js";

import {
    parseLiteral
} from "./literal.js";




function parseExp(lexArr, nextPos, successRequired) {
    $initialPos = nextPos[0];
    // first parse an optional list of variables or array elements and '='s.
    if (parseVarIdent(lexArr, nextPos, false)) {
        // parse an optional series of []'s.
        while (parseArrElemAccess(lexArr, nextPos, false));
        // if an assignment operator is parsed next, parse and return an
        // expression with a recursive call to this function.
        if (parseAssignOp(lexArr, nextPos, false)) {
            return parseExp(lexArr, nextPos, successRequired);
        // else set nextPos[0] back to the initial position and try to parse
        // a no-assignment expression.
        } else {
            nextPos[0] = initialPos;
            return parseExp2(lexArr, nextPos, successRequired);
        }
    }
}


function parseExp2(lexArr, nextPos, successRequired) {
    // parse an optional series of prefix operators.
    while (parsePrefixOp(lexArr, nextPos, false));
    // parse the first part of the expression, which is always either a
    // parentheses expression, a variable identifier, a literal or a function
    // call.
    if (
        !parseParExp(lexArr, nextPos, false) &&
        !parseArrExp(lexArr, nextPos, false) &&
        // !parseObjExp(lexArr, nextPos, false) &&
        !parseLiteral(lexArr, nextPos, false) &&
        !parseVarIdent(lexArr, nextPos, false) &&
        !parseFunCall(lexArr, nextPos, false)
    ) {
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected expression"
            );
        }
        return false;
    }

    while (parsePostfixOp(lexArr, nextPos, false));


    // parse an optional tail of operations (using recursive calls to this
    // function).
    if (parseBinaryOp(lexArr, nextPos, false)) {
        parseExp2(lexArr, nextPos, true);
    }
    if (parseLexeme(lexArr, nextPos, "?", false)) {
        parseExp2(lexArr, nextPos, true);
        parseLexeme(lexArr, nextPos, ":", true);
        parseExp2(lexArr, nextPos, true);
    }
    // (This would not work if we had to build an AST in order to define the
    // semantics of the expression, but since we only need to verify the
    // syntax, we can just parse it this way, without caring much about the
    // precedence order.)
    // return true if all parsings has succeeded an no operator comes next.
    return true;
}





function parseArrElemAccess(lexArr, nextPos, successRequired) {
    // parse any series of '[~~(<exp>)]'s or '[~(<exp>)]'s.
    while (parseLexeme(lexArr, nextPos, "[", false)) {
        // Always wrapping the expression in ~() or ~~() makes sure that it
        // is always converted to an integer.
        parseLexeme(lexArr, nextPos, "~", true);
        parseLexeme(lexArr, nextPos, "~", false); // 'false' makes it optional.
        parseLexeme(lexArr, nextPos, "(", true);
        parseExp(lexArr, nextPos, true);
        parseLexeme(lexArr, nextPos, ")", true);
        parseLexeme(lexArr, nextPos, "]", true);
    }

}




function parseParExp(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "(", successRequired) &&
        parseExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ")", true);
}

function parseArrExp(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "[", successRequired) &&
        parseArrElemList(lexArr, nextPos, false) &&
        parseLexeme(lexArr, nextPos, "]", true);
}

/* We should actually not let non-array objects be part of the expressions,
 * including the returns of functions. So no upaFun_ function should have
 * any other return type than the primitive types or (possibly multi-
 * dimensional) arrays holding primitive types as their leaves!
 **/

// function parseObjExp(lexArr, nextPos, successRequired) {
//     return
//         parseLexeme(lexArr, nextPos, "{", successRequired) &&
//         parseObjPropList(lexArr, nextPos, false) &&
//         parseLexeme(lexArr, nextPos, "}", true);
// }

function parseFunCall(lexArr, nextPos, successRequired) {
    return
        parseFunIdent(lexArr, nextPos, successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExpList(lexArr, nextPos, false) &&
        parseLexeme(lexArr, nextPos, ")", true);
}




function parsePostfixOp(lexArr, nextPos, successRequired) {
    ret =
        parseArrElemAccess(lexArr, nextPos, false) ||
        parseLexeme(lexArr, nextPos, "++", false) ||
        parseLexeme(lexArr, nextPos, "--", false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected postfix operator"
        );
    }
    return ret;
}

function parsePrefixOp(lexArr, nextPos, successRequired) {
    ret =
        parseLexeme(lexArr, nextPos, "++", false) ||
        parseLexeme(lexArr, nextPos, "--", false) ||
        parseLexeme(lexArr, nextPos, "!", false) ||
        parseLexeme(lexArr, nextPos, "~", false) ||
        parseLexeme(lexArr, nextPos, "+", false) ||
        parseLexeme(lexArr, nextPos, "-", false) ||
        parseLexeme(lexArr, nextPos, "typeof", false) ||
        parseLexeme(lexArr, nextPos, "void", false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected prefix operator"
        );
    }
    return ret;
}


function parseBinaryOp(lexArr, nextPos, successRequired) {
    ret =
        parseLexeme(lexArr, nextPos, "**", false) ||
        parseLexeme(lexArr, nextPos, "*", false) ||
        parseLexeme(lexArr, nextPos, "/", false) ||
        parseLexeme(lexArr, nextPos, "%", false) ||
        parseLexeme(lexArr, nextPos, "+", false) ||
        parseLexeme(lexArr, nextPos, "-", false) ||
        parseLexeme(lexArr, nextPos, "<<", false) ||
        parseLexeme(lexArr, nextPos, ">>", false) ||
        parseLexeme(lexArr, nextPos, ">>>", false) ||
        parseLexeme(lexArr, nextPos, "<", false) ||
        parseLexeme(lexArr, nextPos, ">", false) ||
        parseLexeme(lexArr, nextPos, "<=", false) ||
        parseLexeme(lexArr, nextPos, ">=", false) ||
        parseLexeme(lexArr, nextPos, "==", false) ||
        parseLexeme(lexArr, nextPos, "!=", false) ||
        parseLexeme(lexArr, nextPos, "===", false) ||
        parseLexeme(lexArr, nextPos, "!==", false) ||
        parseLexeme(lexArr, nextPos, "&", false) ||
        parseLexeme(lexArr, nextPos, "^", false) ||
        parseLexeme(lexArr, nextPos, "|", false) ||
        parseLexeme(lexArr, nextPos, "&&", false) ||
        parseLexeme(lexArr, nextPos, "||", false) ||
        parseLexeme(lexArr, nextPos, "??", false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected binary operator"
        );
    }
    return ret;
}



function parseAssignOp(lexArr, nextPos, successRequired) {
    ret =
        parseLexeme(lexArr, nextPos, "=", false);
        // parseLexeme(lexArr, nextPos, "+=", false) ||
        // parseLexeme(lexArr, nextPos, "-=", false) ||
        // parseLexeme(lexArr, nextPos, "*=", false) ||
        // parseLexeme(lexArr, nextPos, "**=", false) ||
        // parseLexeme(lexArr, nextPos, "/=", false) ||
        // parseLexeme(lexArr, nextPos, "%=", false) ||
        // parseLexeme(lexArr, nextPos, "&&=", false) ||
        // parseLexeme(lexArr, nextPos, "||=", false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected assignment operator"
        );
    }
    return ret;
}






function parseExpList(lexArr, nextPos, successRequired) {
    // parse as many expressions as possible of a possibly empty list.
    if (!parseExp(lexArr, nextPos, false)) {
        // return true even if no expression was parsed.
        return true;
    }
    // if the next lexeme is a comma, call this function recursively to
    // parse an optional (since one trailing comma is allowed) expression
    // list after that.
    if (parseLexeme(lexArr, nextPos, ",", false)) {
        return parseExpList(lexArr, nextPos, false);
    }
    // always return true (unless an exception was thrown).
    return true;
}

function parseArrElemList(lexArr, nextPos, successRequired) {
    // parse as many expressions and commas as possible in any order of a
    // possibly empty list.
    while (
        parseLexeme(lexArr, nextPos, ",", false) ||
        parseExp(lexArr, nextPos, false)
    );
    // always return true (unless an exception was thrown).
    return true;
}


?>
