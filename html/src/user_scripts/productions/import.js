
import {
    ParseException
} from "./exception.js";

import {
    parseFunIdent
} from "./ident.js";

// parseImportIdentList, parseImportPath



export function parseNonEmptyImportIdentList(lexArr, nextPos, successRequired) {
    // parse a mandatory first function identifier.
    if (!parseFunIdent(lexArr, nextPos, successRequired)) {
        return false;
    }
    //parse optional "as <funIdent>" syntax
    if (parseLexeme(lexArr, nextPos, "as", false)) {
        parseFunIdent(lexArr, nextPos, true);
    }
    // if the next lexeme is a comma, call parseImportIdentList() to
    // parse an optional (since one trailing comma is allowed) function
    // identifier import list after that.
    if (parseLexeme(lexArr, nextPos, ",", false)) {
        return parseImportIdentList(lexArr, nextPos, false);
    }
    // return true if no comma was parsed.
    return true;
}


export function parseImportIdentList(lexArr, nextPos, successRequired) {
    // parse as many function identifier imports as possible of a possibly
    // empty list.
    if (!parseFunIdent(lexArr, nextPos, successRequired)) {
        return true;
    }
    //parse optional "as <funIdent>" syntax
    if (parseLexeme(lexArr, nextPos, "as", false)) {
        parseFunIdent(lexArr, nextPos, true);
    }
    // if the next lexeme is a comma, call this function recursively to
    // parse an optional (since one trailing comma is allowed) function
    // identifier import list after that.
    if (parseLexeme(lexArr, nextPos, ",", false)) {
        return parseImportIdentList(lexArr, nextPos, false);
    }
    // always return true (unless an exception was thrown).
    return true;
}





export function parseImportPath(lexArr, nextPos, successRequired) {
    
}
