
import * as t2Mod from "/UPA_scripts.php?id=t2";

/* This module defines some basic content loader functions and attaches them,
 * together with a content key each, to the upa1_contentLoaderFuns object
 * initialized to the window by the t2 module.
 **/

// For each content key definition, use only content keys that are defined
// below the  current one. This makes it easier to prevent infinity recursion.
// If a content key uses a content key from above itself, one should take great
// care that the content is only loaded following a user input that commands it
// to load. (But such cases should be very rare, perhaps almost non-existing.)

upa1_contentLoaderFuns["categoryTerm"] = function(jqObj, contextData) {
    jqObj.html('<div content-key="categoryTermHeader" class="container"></div>')
        .append('<div content-key="subcategoryList" class="container"></div>')
        .append('<div content-key="elementList" wait class="container"></div>')
        .append('<div content-key="categoryTermFooter" class="container"></div>')
        // .on("hide-current-list", function() {
        //     $(this).children('[content-key$="List"]').hide();
        // })
        .on("show-subcategory-list", function() {
            $(this).children('[content-key$="List"]').hide();
            let jqObj = $(this).children('[content-key="subcategoryList"]');
            jqObj.show();
            if (!jqObj.attr("is-loaded")) {
                jqObj.trigger("load-content");
            }
        })
        .on("show-element-list", function() {
            $(this).children('[content-key$="List"]').hide();
            let jqObj = $(this).children('[content-key="elementList"]');
            jqObj.show();
            if (!jqObj.attr("is-loaded")) {
                jqObj.trigger("load-content");
            }
        });
}

upa1_contentLoaderFuns["subcategoryList"] = function(jqObj, contextData) {
    jqObj.html("<i>Hello</i>, I'm gonna be a subcategory list.");
}
upa1_contentLoaderFuns["elementList"] = function(jqObj, contextData) {
    jqObj.html("And I'm gonna be a list of elements!");
}

upa1_contentLoaderFuns["categoryTermHeader"] = function(jqObj, contextData) {
    jqObj.html('<ul class="nav nav-tabs"></ul>')
        .find('ul')
        .append('<li class="active"> <a href="#">Subcategories</a> </li>')
        .append('<li> <a href="#">Elements</a> </li>')
        .find('li:first-of-type')
        .on("click", function() {
            $(this).parents('[content-key="categoryTerm"]')
                .trigger("show-subcategory-list");
        })
        .next()
        .on("click", function() {
            $(this).parents('[content-key="categoryTerm"]')
                .trigger("show-element-list");
        });debugger;
}

upa1_contentLoaderFuns["categoryTermFooter"] = function(jqObj, contextData) {
    jqObj.html("I'm gonna be a footer.");
}
