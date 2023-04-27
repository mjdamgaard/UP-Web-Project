
import * as t2Mod from "/UPA_scripts.php?id=t2";

/* This module defines some basic content loader functions and attaches them,
 * together with a content key each, to the upa1_contentLoaderFunctions object
 * initialized to the window by the t2 module.
 **/

// For each content key definition, use only content keys that are defined
// below the  current one. This makes it easier to prevent infinity recursion.
// If a content key uses a content key from above itself, one should take great
// care that the content is only loaded following a user input that commands it
// to load. (But such cases should be very rare, perhaps almost non-existing.)

upa1_contentLoaderFunctions["categoryTerm"] = function(jqObj, contextData) {
    jqObj.html("<b>Hello</b>, I'm gonna be a category.")
        .append('<div content-key="subcategories"></div>')
        .append('<div content-key="elements"></div>');
}

upa1_contentLoaderFunctions["subcategories"] = function(jqObj, contextData) {
    jqObj.html("<i>Hello</i>, I'm gonna be a subcategory list.");
}
upa1_contentLoaderFunctions["elements"] = function(jqObj, contextData) {
    jqObj.html("And I'm gonna be a list of elements!");
}
