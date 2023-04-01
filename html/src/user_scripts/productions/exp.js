
import parseVarIdent, parseVarIdentTuple, parseIndexIdentifier
from "./ident.js";

import parseLexeme
from "./symbol.js";

import parseLiteral
from "./literal.js";

// TODO change this to an import from an exception module.
class ParseException {
    constructor(pos, msg) {
        this.pos = pos;
        this.msg = msg;
    }
}






export function parseExp(lexArr, nextPos, successRequired) {
    let initialPos = nextPos[0];
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
        !parseObjExp(lexArr, nextPos, false) &&
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

function parseObjExp(lexArr, nextPos, successRequired) {
    return
        parseLexeme(lexArr, nextPos, "{", successRequired) &&
        parseObjPropList(lexArr, nextPos, false) &&
        parseLexeme(lexArr, nextPos, "}", true);
}

function parseFunCall(lexArr, nextPos, successRequired) {
    return
        parseFunIdent(lexArr, nextPos, successRequired) &&
        parseLexeme(lexArr, nextPos, "(", true) &&
        parseExpList(lexArr, nextPos, false) &&
        parseLexeme(lexArr, nextPos, ")", true);
}




function parsePostfixOp(lexArr, nextPos, successRequired) {
    let ret =
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
    let ret =
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



function parseAssignOp(lexArr, nextPos, successRequired) {
    let ret =
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
    // always return true (unless exception was thrown).
    return true;
}

function parseArrElemList(lexArr, nextPos, successRequired) {
    // parse as many expressions and commas as possible in any order of a
    // possibly empty list.
    while (
        parseLexeme(lexArr, nextPos, ",", false) ||
        parseExp(lexArr, nextPos, false)
    );
    // always return true (unless exception was thrown).
    return true;
}

function parseObjPropList(lexArr, nextPos, successRequired) {
    // parse as many expressions as possible of a possibly empty list.
    if (!parseVarIdent(lexArr, nextPos, false)) {
        // return true even if no expression was parsed.
        return true;
    }
    parseLexeme(lexArr, nextPos, ":", true);
    parseExp(lexArr, nextPos, true);
    // if the next lexeme is a comma, call this function recursively to
    // parse an optional (since one trailing comma is allowed) object property
    // list after that.
    if (parseLexeme(lexArr, nextPos, ",", false)) {
        return parseObjPropList(lexArr, nextPos, false);
    }
    // always return true (unless exception was thrown).
    return true;
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
// ... Wait, why did I include all these types again, wasn't just because I
// didn't want users to be able to.. Ah, right, to set the properties of
// objects.. ..Hm, but can't I just simply.. Hm.. ..Oh! Because objects
// parameters are not pointers, but are only called by reference so far as
// to keep any changes you make to their elements or properties, then I must
// simply be able to just limit how properties can be set/changed in this
// language subset, and we're good!.. Hm, all that work, but whatever.. Yeah,
// let me take a break and think about it a bit more, but yeah, I think I can
// just make sure to limit objects changes to function calls, and then I should
// be good, at least if I don't include any of those "+="-like assign operators,
// that I don't really care to test for objects..
// ... Nah, I don't really trust that people can't just build.. ..function
// objects.. but if the properties cannot be set or changed except.. ..and
// if only some identifiers are allowed as properties.. Maybe I should think
// a bit more about it..
// ... ... Can I not just have two types: functions and non-functions..?
// ..Yes, that is probably, what I will do.. Should I then even transform
// non-function variable names, or..? ..No, I shouldn't need to..
// (01.04.23, 11:30) Getters and setters seem dangerous, but since I don't
// include those keywords, their should be no way to initialize ones, right..?
// Ah, and I should prevent "get" and "set" as a function identifier, but that
// is done by always having a prefix on all identifiers (which I should have).
// ...On second thought, maybe I should actually not include direct accessing
// of object properties (via the '.' syntax) due to those getters and setters
// of JS. Cause otherwise it wouldn't be a simple matter to say that only legal
// function are ever called, cause then you have prove that no getters and
// setters can be initialized via the allowed operators.. which is probably a
// very easy thing to do if I had a more thorough JS documentation.. ..Well,
// yeah, but the point is, even if it is easy to prove, you would still have
// to reference the standard and walk a reader through the proof.. Hm, unless
// the standard is very clear on the topic, let me see.. ..Ah, never mind. It
// is just much much simpler to remove the '.'. And doing so also removes the
// risk that the prefix I chose collides with some object property.. although,
// I could just make sure to.. Oh no, cause object prototypes might have hidden
// properties for all I know.. Ah, probably not, but anyway, it doesn't matter
// now. I'll remove the '.' operator. It is not that handy anyway, now that
// the users (in the beginning) have to add the prefixes to the property names.
// Then using functions to get and set properties might be at least as good
// in terms of aesthetics and clarity. (12:07)
