
import {
    ParseException
} from "../exceptions/except.js";



const varIdentPatt = "/^upaVar_[\w\$]+$/";
const funIdentPatt = "/^upaFun_[\w\$]+$/";


export function parseVarIdent(lexArr, nextPos, successRequired) {
    if (lexArr[nextPos[0]].test(varIdentPatt)) {
        nextPos[0] = nextPos[0] + 1;
        return true;
    }
    // if parsing has failed, potentially throw an exception and return false.
    if (successRequired) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected variable identifier"
        );
    }
    return false;
}


export function parseFunIdent(lexArr, nextPos, successRequired) {
    if (lexArr[nextPos[0]].test(funIdentPatt)) {
        nextPos[0] = nextPos[0] + 1;
        return true;
    }
    // if parsing has failed, potentially throw an exception and return false.
    if (successRequired) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected function identifier"
        );
    }
    return false;
}




export function parseVarIdentList(lexArr, nextPos, successRequired) {
    // parse as many variable identifiers as possible of a possibly empty list.
    if (!parseVarIdent(lexArr, nextPos, false)) {
        // return true even if no identifier was parsed.
        return true;
    }
    // if the next lexeme is a comma, call this function recursively to
    // parse an optional (since one trailing comma is allowed) variable
    // identifier list after that.
    if (parseLexeme(lexArr, nextPos, ",", false)) {
        return parseVarIdentList(lexArr, nextPos, false);
    }
    // always return true (unless an exception was thrown).
    return true;
}
