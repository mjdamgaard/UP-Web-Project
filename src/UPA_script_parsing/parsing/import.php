<?php

import {
    ParseException
} from "../exceptions/except.js";

import {
    parseFunIdent
} from "./ident.js";

// parseImportIdentList, parseImportPath



function parseNonEmptyImportIdentList(lexArr, nextPos, successRequired) {
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


function parseImportIdentList(lexArr, nextPos, successRequired) {
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



upaModulePathPatt =
    "/^UPA_modules\.php\?id=[1-9A-F][0-9A-F]{0,15}$/";
    // "/^UPA_modules\.php\?[\w=&]+$/";

function parseImportPath(lexArr, nextPos, successRequired) {
    if (lexArr[nextPos[0]].test(upaModulePathPatt)) {
        nextPos[0] = nextPos[0] + 1;
        return true;
    }
    // if parsing has failed, potentially throw an exception and return false.
    if (successRequired) {
        throw new ParseException(
            lexArr[nextPos[0]], "Expected valid path to UPA module"
        );
    }
    return false;
}

?>
