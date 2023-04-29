
import {
    ContentManager, ContentSpec,
} from "/UPA_scripts.php?id=t2";

/* This module defines some basic content loader functions and attaches them,
 * together with a content key each, to the upa1_contentSpecs object
 * initialized to the window by the t2 module.
 **/

// For each content key definition, use only content keys that are defined
// below the  current one. This makes it easier to prevent infinity recursion.
// If a content key uses a content key from above itself, one should take great
// care that the content is only loaded following a user input that commands it
// to load. (But such cases should be very rare, perhaps almost non-existing.)


var upa1_contentSpecs = [];

upa1_contentSpecs["categoryTerm"] = [
    "div", {class:"container"}, [
        "categoryHeader",
        "categoryMain",
        "categoryFooter",
    ], [], [],
];

upa1_contentSpecs["categoryHeader"] = [
    "header", {class:"container"}, [
        'html:<ul class="nav nav-tabs">' +
            '<li class="active"> <a href="#">Subcategories</a> </li>' +
            '<li> <a href="#">Elements</a> </li>' +
        '</ul>'
    ], [], [],
];
upa1_contentSpecs["categoryHeader"][3].push(function(cm, jqObj) {
    jqObj.find('li:first-of-type')
        .on("click", function() {
            $(this).siblings().attr("class", "inactive");
            $(this).attr("class", "active")
                .closest('[content-key="categoryTerm"]')
                .trigger("show-subcategory-list");
        })
        .next()
        .on("click", function() {
            $(this).siblings().attr("class", "inactive");
            $(this).attr("class", "active")
                .closest('[content-key="categoryTerm"]')
                .trigger("show-element-list");
        });
});






//
// upa1_contentSpecs["categoryTerm"] = function(jqObj, contextData) {
//     jqObj.html('<div content-key="categoryTermHeader" class="container"></div>')
//         .append('<div content-key="subcategoryList" class="container"></div>')
//         .append('<div content-key="elementList" wait class="container"></div>')
//         .append('<div content-key="categoryTermFooter" class="container"></div>')
//         // .on("hide-current-list", function() {
//         //     $(this).children('[content-key$="List"]').hide();
//         // })
//         .on("show-subcategory-list", function() {
//             $(this).children('[content-key$="List"]').hide();
//             let jqObj = $(this).children('[content-key="subcategoryList"]');
//             jqObj.show();
//             if (jqObj.attr("is-loaded") !== "true") {
//                 jqObj.trigger("load-content");
//             }
//         })
//         .on("show-element-list", function() {
//             $(this).children('[content-key$="List"]').hide();
//             let jqObj = $(this).children('[content-key="elementList"]');
//             jqObj.show();
//             if (!jqObj.attr("is-loaded")) {
//                 jqObj.trigger("load-content");
//             }
//         });
// }
//
// upa1_contentSpecs["categoryTermHeader"] = function(jqObj, contextData) {
//     jqObj.html('<ul class="nav nav-tabs"></ul>')
//         .find('ul')
//         .append('<li class="active"> <a href="#">Subcategories</a> </li>')
//         .append('<li> <a href="#">Elements</a> </li>')
//         .find('li:first-of-type')
//         .on("click", function() {
//             $(this).siblings().attr("class", "inactive");
//             $(this).attr("class", "active")
//                 .closest('[content-key="categoryTerm"]')
//                 .trigger("show-subcategory-list");
//         })
//         .next()
//         .on("click", function() {
//             $(this).siblings().attr("class", "inactive");
//             $(this).attr("class", "active")
//                 .closest('[content-key="categoryTerm"]')
//                 .trigger("show-element-list");
//         });
// }
//
//
// upa1_contentSpecs["subcategoryList"] = function(jqObj, contextData) {
//     jqObj.html('<div hidden content-key="setData"></div>');
// }
// upa1_contentSpecs["elementList"] = function(jqObj, contextData) {
//     jqObj.html('And I am gonna be a list of elements!');
// }
//
//
// upa1_contentSpecs["categoryTermFooter"] = function(jqObj, contextData) {
//     jqObj.html("I'm gonna be a footer.");
// }
