
import * as t2Mod from "/UPA_scripts.php?id=t2";

/* This module defines some basic content loader functions and attaches them,
 * together with a content key each, to the upa1_contentLoaderFunctions object
 * initialized to the window by the t2 module.
 **/


upa1_contentLoaderFunctions["categoryTerm"] = function(jqObj, contextData) {
    jqObj.html("<b>Hello</b>, I'm gonna be a category.")
        .append('<div content-key="subcategories"></div>')
        .append('<div content-key="elements" style="float:left"></div>');
}

upa1_contentLoaderFunctions["subcategories"] = function(jqObj, contextData) {
    jqObj.html("<i>Hello</i>, I'm gonna be a subcategory list.");
}
upa1_contentLoaderFunctions["elements"] = function(jqObj, contextData) {
    jqObj.html("And I'm gonna be a list of elements!");
}
