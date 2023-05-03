
import {
    ContentLoader,
} from "/UPA_scripts.php?id=t2";




export var upaCL = new ContentLoader(
    "ColumnBasedSDBInterface",
    /* Initial HTML */
    '<div id="upa1" class="container sdb-interface-app">' +
        '<<ColumnGroup>>' +
    '</div>'
);
export var columnGroupCL = new ContentLoader(
    "ColumnGroup",
    /* Initial HTML */
    '<div class="container app-column-group">' +
        '<<Column>>' +
    '</div>'
);
columnGroupCL.inwardCallbacks.push(function($ci, data, parentCLArr) {
    switch (data.termID.substring(0, 1)) {
        case "c":
            $ci.find('.placeholder').attr("data-key", "CategoryColumn");
            break;
        default:
            throw (
                "Term type '" + data.termID.substring(0, 1) +
                "' has not been implemented yet"
            );
    }
});

export var columnCL = new ContentLoader(
    "Column",
    /* Initial HTML */
    '<div class="container app-column">' +
        "<<ColumnHeader>>" +
        "<<ColumnMain>>" +
        "<<ColumnFooter>>" +
    '</div>'
);

export var columnHeaderCL = new ContentLoader(
    "ColumnHeader",
    /* Initial HTML */
    '<header class="container">' +
        '<<TabNavHeader>>' +
    '</header>'
);
export var columnMainCL = new ContentLoader(
    "ColumnMain",
    /* Initial HTML */
    '<main class="container"></main>'
);
export var columnFooterCL = new ContentLoader(
    "ColumnFooter",
    /* Initial HTML */
    '<footer class="container"></footer>'
);


export var tabNavHeaderCL = new ContentLoader(
    "TabNavHeader",
    /* Initial HTML */
    '<ul class="nav nav-tabs"></ul>'
);

// push the newly declared contant loaders into upaCL's children array. (These
// children CLs will be modified below (and more children will also be pushed
// to this array), but since they are reference types, these changes will also
// take effect inside upaCL.)
upaCL.childLoaders.push(columnGroupCL);
columnGroupCL.childLoaders.push(columnCL);
columnCL.childLoaders.push(columnHeaderCL);
columnCL.childLoaders.push(columnMainCL);
columnCL.childLoaders.push(columnFooterCL);
upaCL.childLoaders.push(tabNavHeaderCL);


/* <<TabNavHeader>>
 * This CL class is responsible for the apperance of a tab
 * nav bar, and for sending click event signals to its CI parent and handling
 * events coming from its parent (e.g. to add or change tabs).
 **/

tabNavHeaderCL.outwardCallbacks.push(function($ci, id) {
    $ci
        .on("add-tab", function(event, tabTitle, isActive) {debugger;
            let $newTab = $(this).find('.nav-tabs')
                .append(
                    '<li data-title="' + tabTitle + '"> <a href="#">' +
                    tabTitle + '</a> </li>'
                )
                .children(':last-child');
            if (isActive ?? false) {
                $newTab.addClass("active")
            }
            $newTab.on("click", function() {
                $(this).closest('.CI') // gets the TabNavHeader parent
                    .trigger("activate-tab", tabTitle)
                    .closest('CI') // gets the parent of TabNavHeader.
                    .trigger("tab-selected", tabTitle);console.log(tabTitle + " clicked");
            });
        })
        .on("activate-tab", function(event, tabTitle) {
            $(this).find('.nav-tabs > li')
                .removeClass("active")
                .filter('[data-title="' + tabTitle + '"]')
                .addClass("active");
        });
});

columnHeaderCL.outwardCallbacks.push(function($ci, id) {
    $ci.on("add-tab", function(event, tabTitle, isActive) {debugger;
        $(this).find('.CI.TabNavHeader')
            .trigger("add-tab", tabTitle, isActive);
    });
});




export var categoryColumnCL = new ContentLoader(
    "CategoryColumn",
    /* Initial HTML */
    '<<Column>>'
);
upaCL.childLoaders.push(categoryColumnCL);


categoryColumnCL.outwardCallbacks.push(function($ci, id) {debugger;
    console.log($ci.find('.CI.ColumnHeader'));
    $ci.find('.CI.ColumnHeader').first()
        .trigger("add-tab", "Supercategories")
        .trigger("add-tab", "Subcategories", true)
        .trigger("add-tab", "Elements");
});












// var upa1_contentSpecs = [];
//
// upa1_contentSpecs["categoryTerm"] = [
//     "div", {class:"container"}, [
//         "categoryHeader",
//         "categoryMain",
//         "categoryFooter",
//     ], [], [],
// ];
//
// upa1_contentSpecs["categoryHeader"] = [
//     "header", {class:"container"}, [
//         'html:<ul class="nav nav-tabs">' +
//             '<li class="active"> <a href="#">Subcategories</a> </li>' +
//             '<li> <a href="#">Elements</a> </li>' +
//         '</ul>'
//     ], [], [],
// ];
// upa1_contentSpecs["categoryHeader"][3].push(function(cm, jqObj) {
//     jqObj.find('li:first-of-type')
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
// });
//
//
//
//
//
//
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
