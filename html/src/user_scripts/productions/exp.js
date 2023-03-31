
import parseIdentifier, parseIdentifierTuple, parseIndexIdentifier
    from "./ident.js";

// TODO change this to an import from an exception module.
class ParseException {
    constructor(pos, msg) {
        this.pos = pos;
        this.msg = msg;
    }
}

// class VarType {
//     constructor(typeClass, retOrElemType) {
//         typeClass
//     }
// }
// No, I'm just gonna use a string with a series of [(val)(arr)(obj)(fun)]
// kaywords. (And I will use "get" instead of "undefined"..)
// ...No, I can just use the fact that I am already using an array and just
// let the next elements denote the return or element type.. or in fact, let
// me reverse the order such that I for instance can pop "fun" from the array
// and then know that the remaining array contains the return type.
// No, that doesn't quite work for me, so I'll go back to using that string
// format as my varType data structure..



/* A lot of comments are omitted here, namely when the procedures follow the
 * same logical flow as in stmt.js. So see that source code to understand
 * this logic.
 **/



export function parseExp(lexArr, nextPos, varType, successRequired) {
    if (varType[0] == "any") {
        let ret =
            parseValExp(lexArr, nextPos, false) ||
            parseArrExp(lexArr, nextPos, false) ||
            parseObjExp(lexArr, nextPos, false);

        if (successRequired && !ret) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected expression"
            );
        }
        return ret;
    } else if (varType[0] == "val") {
        return parseValExp(lexArr, nextPos, successRequired);

    } else if (varType[0] == "arr") {
        return parseArrExp(lexArr, nextPos, successRequired);

    } else if (varType[0] == "obj") {
        return parseObjExp(lexArr, nextPos, successRequired);
    }
}



function parseExpList(lexArr, nextPos, varType, successRequired) {
    // parse as many expressions as possible of a possibly empty list.
    if (!parseExp(lexArr, nextPos, varType, false)) {
        // return true even if no expression was parsed.
        return true;
    }
    while (parseLexeme(lexArr, nextPos, ",", false)) {
        parseExp(lexArr, nextPos, varType, true);
    }
    // always return true (unless exception was thrown).
    return true;
}


function parseParExpOrIdentifier(
    lexArr, nextPos, varType, successRequired
) {
    let ret =
        parseParExp(lexArr, nextPos, varType, false) ||
        parseIdentifier(lexArr, nextPos, varType, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]],
            "Expected expression of type " + getTypeText(varType[0])
        );
    }
    return ret;
}

function parseObjPropArrElemFunCallString(
    lexArr, nextPos, varType, successRequired
) {
    let initialPos = nextPos[0];
    // parse and get the type of the first parentheses expression or identifier.
    var currentType = ["get"];
    if (!parseParExpOrIdentifier(lexArr, nextPos, currentType, false)) {
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]],
                "Expected expression"
            );
        }
        return false;
    }
    // parse the optional rest (the tail) of the "ObjPropArrElemFunCall" string.
    if (
        parseObjPropArrElemFunCallTail(
            lexArr, nextPos, varType, currentType, false
        )
    ) {
        return true;
    } else {
        if (varType[0] == "get") {
            varType = currentType
        }
        if (currentType[0] != varType[0])
        nextPos[0] = initialPos;
        return false;
    }
}


function parseObjPropArrElemFunCallTail(
    lexArr, nextPos, varType, successRequired
) {
    let initialPos = nextPos[0];

    if (parseLexeme(lexArr, nextPos, ".", false)) {
        // check that previous expression was of the "object" type.
        if (currentType[0] != "obj") {
            throw new ParseException(
                lexArr[nextPos[0]], "Trying to access property of non-object"
            );
        }
        // call parseObjPropOrArrElemOrFunCall recursively.
        if (
            parseObjPropArrElemFunCallString(
                lexArr, nextPos, varType, successRequired
            )
        ) {
            return true;
        } else {
            nextPos[0] = initialPos;
            return false;
        }
    }

    if (parseLexeme(lexArr, nextPos, "[", false)) {
        // check that previous expression was of the "array" type.
        if (!currentType[0].test("/^arr/")) {
            throw new ParseException(
                lexArr[nextPos[0]],
                "Trying to access array element of non-array"
            );
        }
        // get the element type signified with the tail of the varType string.
        let elemType = [varType[0].substring(3)];

        // The ~~ in arr[~~exp] means that the expression will always be
        // an integer, not a string.
        parseLexeme(lexArr, nextPos, "~", true);
        // parseLexeme(lexArr, nextPos, "~", true); // one is enough..
        parseExp(lexArr, nextPos, ["val"] true);
        parseLexeme(lexArr, nextPos, "]", true);
        // call parseObjPropOrArrElemOrFunCall recursively.
        if (
            parseObjPropArrElemFunCallString(
                lexArr, nextPos, varType, successRequired
            )
        ) {
            return true;
        } else {
            nextPos[0] = initialPos;
            return false;
        }
    }
}

// I have to remake it so that all compound expressions are parsed this way
// where the "current type" is continously recorded at each step before moving
// on to the next operation (including arr[] and fun()). And I still intend
// to make varType into a class, also so that parseFunIdentifier() can be
// absorbed into parseIdentifier().

function parseObjPropOrArrElemOrFunCallTail(
    lexArr, nextPos, varType, currentVarType, successRequired
) {
    // parse tail beginning with an accessing of an object property.
    if (parseLexeme(lexArr, nextPos, ".", false)) {
        // check that previous expression was of the "object" type.
        if (currentVarType[0] != "obj") {
            throw new ParseException(
                lexArr[nextPos[0]], "Trying to access property of non-object"
            );
        }
        // parse an identifier and record its type in a nextType variable.
        let nextType = ["get"];
        parseIdentifyer(lexArr, nextPos, nextType, true);
        // call parseObjPropOrArrElemOrFunCallTail() recursively
        return parseObjPropOrArrElemOrFunCallTail(
            lexArr, nextPos, varType, nextType, true
        );
    }

    if (parseLexeme(lexArr, nextPos, "[", false)) {
        // check that previous expression was of the "object" type.
        if (currentVarType[0] != "arr") {
            throw new ParseException(
                lexArr[nextPos[0]],
                "Trying to access array element of non-array"
            );
        }
        if (varType[0] != "val" && varType[0] != "get") {
            throw new ParseException(
                lexArr[nextPos[0]],
                "Trying to access an array element when expecting a non-" +
                "numeric and non-string type"
            );
        }
        // The ~~ in arr[~~exp] means that the expression will always be
        // an integer, not a string.
        parseLexeme(lexArr, nextPos, "~", true);
        // parseLexeme(lexArr, nextPos, "~", true) && // one is enough.
        parseValExp(lexArr, nextPos, true);
        parseLexeme(lexArr, nextPos, "]", true);
        // if varType was "get" initially, set it to "value" and return
        // true.
        if (varType[0] == "get") {
            varType[0] = "val";
            return true;
        }
        // simply return true if varType was "value" already.
        if (varType[0] == "val") {
            return true;
        }
    }
    if (parseLexeme(lexArr, nextPos, "(", false)) {
        // check that previous expression was of the "function" type.
        if (currentVarType[0].test(.......)) { // I have make varType a class..

        }
        ...
    }

}




/* The normal "value" expressions (numerical and string expressions) */

function parseValExp(lexArr, nextPos, successRequired) {
    // all non-assignment expressions have to begin with a monadic expression
    // (i.e. containing only unary operators).
    if (!parseMonadicValExp(lexArr, nextPos, successRequired)) {
        return false;
    }
    // parse any subsequent operators as well as the
    // expression that must come after them. (This would not work if we
    // had to build an AST in order to define the semantics of the
    // expression, but since we only need to verify the syntax, we can
    // just parse it this way, without caring much about the precedence
    // order.)
    while (parseValOperationTail(lexArr, nextPos, false));
    // return true if those parsings succeeded.
    return true;

}



function parseMonadicValExp(lexArr, nextPos, successRequired) {
    let ret =
        parseParenthesesExp(lexArr, nextPos, false) ||
        parseObjPropOrArrElemOrFunCall(lexArr, nextPos, ["val"], false) ||
        // parseObjPropExp(lexArr, nextPos, false) ||
        // parseArrElemExp(lexArr, nextPos, false) ||
        // parseValFunCall(lexArr, nextPos, false) ||
        parseIncrementOrDecrementExp(lexArr, nextPos, false) ||
        // // this fails if a non-value identifier is parsed.
        // parseIdentifier(lexArr, nextPos, ["value"], false) ||
        parseNotExp(lexArr, nextPos, false) ||
        parseUnaryMinusOrPlusExp(lexArr, nextPos, false) ||
        parseTypeOfExp(lexArr, nextPos, false) ||
        parseVoidExp(lexArr, nextPos, false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected numeric or string expression"
        );
    }
    return ret;
}


function parseValOperationTail(lexArr, nextPos, successRequired) {
    if (!parseBinaryOp(lexArr, nextPos, false)) {
        return
            parseLexeme(lexArr, nextPos, "?", successRequired) &&
            parseValExp(lexArr, nextPos, true) &&
            parseLexeme(lexArr, nextPos, ":", true) &&
            parseValExp(lexArr, nextPos, true);
    }
    // if binary operator was parsed, parse exp an either return true or
    // throw an exception depending on the outcome.
    return parseValExp(lexArr, nextPos, true);
}






function parseParenthesesExp(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "(", successRequired) &&
        parseValExp(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, ")", true);
}


// Note that arrays always has "value" elements here. If wanting to use multi-
// dimensional arrays or other arrays, give them the type "object" and use
// function calls to access their elements (as well as to initialize and do
// work on them).

// function parseArrElemExp(lexArr, nextPos, successRequired) {
//     let initialPos = nextPos[0];
//     if (
//         !parseIdentifier(lexArr, nextPos, ["array"], successRequired) ||
//         !parseLexeme(lexArr, nextPos, "[", successRequired)
//     ) {
//         nextPos[0] = initialPos;
//         return false;
//     }
//     return
//         // The ~~ in arr[~~exp] means that the expression will always be
//         // an integer, not a string.
//         parseLexeme(lexArr, nextPos, "~", true) &&
//         // parseLexeme(lexArr, nextPos, "~", true) && // one is enough.
//         parseValExp(lexArr, nextPos, true) &&
//         parseLexeme(lexArr, nextPos, "]", true);
// }


//
//
// function parseValFunCall(lexArr, nextPos, successRequired) {
//     let initialPos = nextPos[0];
//     if (
//         // since retType == ["value"] and not ["undefined"],
//         // parseFunIdentifier() will verify the return type rather than
//         // setting it.
//         !parseFunIdentifier(lexArr, nextPos, ["value"], successRequired) ||
//         !parseLexeme(lexArr, nextPos, "(", successRequired)
//     ) {
//         nextPos[0] = initialPos;
//         return false;
//     }
//     // parse optional list of expressions (of any type).
//     parseExpList(lexArr, nextPos, ["any"], false);
//     // parse the mandatory final ")".
//     return parseLexeme(lexArr, nextPos, ")", true);
// }


function parseIncrementOrDecrementExp(lexArr, nextPos, successRequired) {
    let initialPos = nextPos[0];
    // parse a prefix incremment or decrement expression.
    if (
        parseLexeme(lexArr, nextPos, "++", false)) ||
        parseLexeme(lexArr, nextPos, "--", false))
    ) {
        // parse a then-mandatory value variable and nothing else.
        return parseIdentifier(lexArr, nextPos, ["val"], true)
    }
    // parse a postfix incremment or decrement expression.
    if (
        !parseIdentifier(lexArr, nextPos, ["val"], false) ||
        !parseLexeme(lexArr, nextPos, "++", false) &&
            !parseLexeme(lexArr, nextPos, "--", false)
    ) {
        nextPos[0] = initialPos;
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected increment or decrement expression"
            );
        }
        return false;
    } else {
        return true;
    }
}

function parseNotExp(lexArr, nextPos, successRequired) {
    let initialPos = nextPos[0];
    // parse a logically or bitwise negated expression.
    if (
        parseLexeme(lexArr, nextPos, "!", false)) ||
        parseLexeme(lexArr, nextPos, "~", false))
    ) {
        // parse a then-mandatory value variable and nothing else.
        return parseValExp(lexArr, nextPos, true)
    } else {
        nextPos[0] = initialPos;
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected negated expression"
            );
        }
        return false;
    }
}

function parseUnaryMinusOrPlusExp(lexArr, nextPos, successRequired) {
    let initialPos = nextPos[0];
    // parse a unary plus or minus expression.
    if (
        parseLexeme(lexArr, nextPos, "+", false)) ||
        parseLexeme(lexArr, nextPos, "-", false))
    ) {
        // parse a then-mandatory value variable and nothing else.
        return parseValExp(lexArr, nextPos, true)
    } else {
        nextPos[0] = initialPos;
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected unary plus or minus expression"
            );
        }
        return false;
    }
}

function parseTypeOfExp(lexArr, nextPos, successRequired) {
    let initialPos = nextPos[0];
    // parse a typeof expression.
    if (
        parseLexeme(lexArr, nextPos, "typeof", false))
    ) {
        // parse a then-mandatory expression of any type and nothing else.
        return parseExp(lexArr, nextPos, ["any"], true)
    } else {
        nextPos[0] = initialPos;
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected typeof expression"
            );
        }
        return false;
    }
}

function parseVoidExp(lexArr, nextPos, successRequired) {
    let initialPos = nextPos[0];
    // parse a void expression.
    if (
        parseLexeme(lexArr, nextPos, "void", false))
    ) {
        // parse a then-mandatory expression of any type and nothing else.
        return parseExp(lexArr, nextPos, ["any"], true)
    } else {
        nextPos[0] = initialPos;
        if (successRequired) {
            throw new ParseException(
                lexArr[nextPos[0]], "Expected void expression"
            );
        }
        return false;
    }
}




function parseBinaryOp(lexArr, nextPos, successRequired) {
    let ret =
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






/* The "array" expressions */

function parseArrExp(lexArr, nextPos, successRequired) {
    let ret =
        parseArrLiteral(lexArr, nextPos, false) ||
        parseArrFunCall(lexArr, nextPos, false) ||
        // this fails if a non-value identifier is parsed.
        parseIdentifier(lexArr, nextPos, ["arr"], false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected numeric or string expression"
        );
    }
    return ret;

}


function parseArrFunCall(lexArr, nextPos, successRequired) {
    let initialPos = nextPos[0];
    if (
        // since retType == ["arr"] and not ["get"],
        // parseFunIdentifier() will verify the return type rather than
        // setting it.
        !parseFunIdentifier(lexArr, nextPos, ["arr"], successRequired) ||
        !parseLexeme(lexArr, nextPos, "(", successRequired)
    ) {
        nextPos[0] = initialPos;
        return false;
    }
    // parse optional list of expressions (of any type).
    parseExpList(lexArr, nextPos, ["any"], false);
    // parse the mandatory final ")".
    return parseLexeme(lexArr, nextPos, ")", true);
}


function parseArrLiteral(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "[", successRequired) &&
        parseExpList(lexArr, nextPos, ["val"], true) &&
        parseLexeme(lexArr, nextPos, "]", true);
}






/* The "object" expressions */

function parseObjExp(lexArr, nextPos, successRequired) {
    let ret =
        parseObjLiteral(lexArr, nextPos, false) ||
        parseObjFunCall(lexArr, nextPos, false) ||
        // this fails if a non-value identifier is parsed.
        parseIdentifier(lexArr, nextPos, ["obj"], false);

    if (successRequired && !ret) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected numeric or string expression"
        );
    }
    return ret;

}


function parseObjFunCall(lexArr, nextPos, successRequired) {
    let initialPos = nextPos[0];
    if (
        // since retType == ["obj"] and not ["get"],
        // parseFunIdentifier() will verify the return type rather than
        // setting it.
        !parseFunIdentifier(lexArr, nextPos, ["obj"], successRequired) ||
        !parseLexeme(lexArr, nextPos, "(", successRequired)
    ) {
        nextPos[0] = initialPos;
        return false;
    }
    // parse optional list of expressions (of any type).
    parseExpList(lexArr, nextPos, ["any"], false);
    // parse the mandatory final ")".
    return parseLexeme(lexArr, nextPos, ")", true);
}




function parseObjLiteral(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "{", successRequired) &&
        parseObjPropList(lexArr, nextPos, true) &&
        parseLexeme(lexArr, nextPos, "}", true);
}


function parseObjPropList(lexArr, nextPos, successRequired) {
    // parse as many object proporties as possible of a possibly empty list.
    if (!parseObjProp(lexArr, nextPos, false)) {
        // return true even if no expression was parsed.
        return true;
    }
    while (parseLexeme(lexArr, nextPos, ",", false)) {
        parseObjProp(lexArr, nextPos, true);
    }
    // always return true (unless exception was thrown).
    return true;
}

// Hm, shouldn't I actually also use types for property identifiers?.. ..Yes,
// I definitely should, and I should even make sure, that properties can
// be function types, namely with any of the three return types, "value",
// "array" and "object"! :)
function parseObjProp(lexArr, nextPos, successRequired) {

}









/* Here "Index" refers to special variables who can also been assigned and
 * changed via certain restricted operations. They cannot be passed to
 * functions. But as opposed to "normal" vars, they can be used as array
 * indeces. (This fact is what requires us to be careful with them.)
 **/
// (13:46, 29.03.23) Ah, no! I will simply just require parseInt() in all
// array indeces! ...Hm, but if we call parseInt each time, couldn't we
// just call a getElem() function..? ..Well, but then that might very well
// be implemented with a call to parseInt() as well.. But aesthetically,
// it seems a bit nicer with getElem().. (13:57) ..And it's a bit easier,
// so let me just go with that, i.e. a user-defined getElem() function. And
// when it comes to elimination such runtime checks, that is redundant when
// the code is known to be safe, that's when we in the future should consider
// to implement a typed version (perhaps like TypeScript), such that these
// checks can be done statically instead. (14:00)
// ... (17:49) Oh, I can just use unary plus instead, so let me actually
// do that!
// ...(18:11) "pausing to consider if I should not do more to prevent the
// ability to change objects outside of function calls.." ..Hm, but if objects
// are always called by reference, shouldn't we be able to then re-reference
// them in function calls..? (If so, I can perhaps just say that variables
// cannot be assigned to object expressions..) ...One cannot change the
// object pointer itself b passing it to a function, but I could perhaps just
// use "one big object" that users are only allowed to give as inputs to
// functions, which can then do work on its nested objects.. (18:37) ..Yeah,
// this could work.. One big datastructure, and then variables can only be
// nums and strings (including null, undefined, NaN, Infinity and so on)..
// ..And maybe I'll arrays as well for variables.. I might do that.. ..Or
// maybe not; just to be safe from any weird JS behavier regarding assignment
// operators and increaments.. ..But I should still allow array "literals"
// as function input.. (18:47) ..Wait, but then I should also allow array
// variables.. ..Oh no, not necessarily, no.. But I might have to go back to
// requiring Hungarian notation for array and object variables, which can
// then simply one come into being from being part of a functions input
// variables, and they can then only appear as inputs for function calls
// inside the body, not anywhere outside of function calls. Okay, let me say
// that. And let me just require the users to explicaitely include these
// prefixes as well (unless I should actually just make them be postfixes
// instead.. (but still)).. (18:57) ..Ah, I'll just allow both things: Either
// a arr_ or obj_ prefix, og a arr/Arr or obj/Obj suffix (maening that the
// number and string variables cannot e.g. end in [aA]rr or [oO]bj).:) (19:06)
// ... Let me actually allow declaring/defining new array and object variables,
// and let me then just keep these out of compound expressions, except for
// the '.' operator. I'll then also just require obj_ and arr_ for functions
// that return either arrays or objects, so that the normal variables can't
// be assigned an array or object value. ..Well, and this also means that I
// don't have to do anything special about implementing that "big data
// structure." That is no longer necessary.
// ..Hm, but now I also have to consider: Why not then also go back to having
// at least a HTML element type, namely such that some runtime checks can be
// avoided?.. But perhaps I will not include the printable text type, or the
// safe-as-attribute-value string type.. But let me think about, though. (20:50)









// export function parseAssignExp(lexArr, nextPos, successRequired) {
//     let initialPos = nextPos[0];
//     if (
//         parseIndexIdentifier(lexArr, nextPos, false) &&
//         parseLexeme(lexArr, nextPos, "=", false) && //no other assignOp allowed.
//         parseIndexExp(lexArr, nextPos, false)
//     ) {
//         return true;
//     }
//     nextPos[0] = initialPos;
//     if (
//         parseIdentifier(lexArr, nextPos, false) &&
//         parseAssignOp(lexArr, nextPos, false) &&
//         parseExp(lexArr, nextPos, false)
//     ) {
//         return true;
//     }
//     nextPos[0] = initialPos;
//     if (successRequired) {
//         throw new ParseException(
//             lexArr[nextPos[0]], "Expected assignment expression"
//         );
//     }
//     return false;
// }


// function parseIndexExp(lexArr, nextPos, successRequired) {
//     let ret =
//         parseIndexOperation(lexArr, nextPos, false) ||
//         parseIndexIncrement(lexArr, nextPos, false) ||
//         parseIndexDecrement(lexArr, nextPos, false) ||
//         parseIndexIdentifier(lexArr, nextPos, false) ||
//         parseIntLiteral(lexArr, nextPos, false) ||
// }
//
// function parseIndexOperation(lexArr, nextPos, successRequired) {
//     let initialPos = nextPos[0];
//     if (!parseIndexIdentifier(lexArr, nextPos, successRequired)) {
//         return false;
//     }
//     if (
//         !parseLexeme(lexArr, nextPos, "+", false) &&
//         !parseLexeme(lexArr, nextPos, "-", false) &&
//         !parseLexeme(lexArr, nextPos, "*", false) &&
//         !parseLexeme(lexArr, nextPos, "**", false) &&
//         !parseLexeme(lexArr, nextPos, "/~~", false) &&
//         !parseLexeme(lexArr, nextPos, "%", false)
//     ) {
//         nextPos[0] = initialPos;
//         if (successRequired) {
//             throw new ParseException(
//                 lexArr[nextPos[0]], "Expected integer operator"
//             );
//         }
//         return false;
//     }
//     // this recursive call allows for a series of operations, but not with
//     // any parenthesis.
//     return parseIndexExp(lexArr, nextPos, successRequired);
// }

        // parseIndexSum(lexArr, nextPos, false) ||
        // parseIndexDifference(lexArr, nextPos, false) ||
        // parseIndexMultiplication(lexArr, nextPos, false) ||
        // parseIndexExponentiation(lexArr, nextPos, false) ||
        // parseIndexIntDivision(lexArr, nextPos, false) ||
        // parseIndexModulus(lexArr, nextPos, false) ||







// function parseAssignOp(lexArr, nextPos, successRequired) {
//     let ret =
//         parseLexeme(lexArr, nextPos, "=", false) ||
//         parseLexeme(lexArr, nextPos, "+=", false) ||
//         parseLexeme(lexArr, nextPos, "-=", false) ||
//         parseLexeme(lexArr, nextPos, "*=", false) ||
//         parseLexeme(lexArr, nextPos, "**=", false) ||
//         parseLexeme(lexArr, nextPos, "/=", false) ||
//         parseLexeme(lexArr, nextPos, "%=", false) ||
//         parseLexeme(lexArr, nextPos, "&&=", false) ||
//         parseLexeme(lexArr, nextPos, "||=", false);
//
//     if (successRequired && !ret) {
//         throw new ParseException(
//             lexArr[nextPos[0]], "Expected non-block statement"
//         );
//     }
//     return ret;
// }

















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
from "./ident.js";

import
    boolLiteral, numLiteral, strLiteral, txtLiteral, attLiteral,
    arrLiteral, objLiteral
from "./literal.js";


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
