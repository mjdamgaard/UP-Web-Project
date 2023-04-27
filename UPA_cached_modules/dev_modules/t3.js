
import * as t2Mod from "/UPA_scripts.php?id=t2";

/* This module defines some basic content loader functions and attaches them,
 * together with a content key each, to the upa1_contentLoaderFunctions object
 * initialized to the window by the t2 module.
 **/

// test that upa1_contentLoaderFunctions exists.
upa1_contentLoaderFunctions["categoryTerm"] = function(jqObj, contextData) {
    jqObj.html("<b>Hello</b>, I am gonna be a category.")
}
