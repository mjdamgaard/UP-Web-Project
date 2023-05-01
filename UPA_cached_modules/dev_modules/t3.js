
import {
    ContentLoader
} from "/UPA_scripts.php?id=t2";




export var upaCL = new ContentLoader(
    "ColumnBasedSDBInterface",
    /* Initial HTML */
    '<div id="upa1" class="container app-column-container">' +
        '<<TermColumn>>' +
    '</div>'
);

export var termColumnCL = new ContentLoader(
    "TermColumn",
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
        '<ul class="nav nav-tabs">' +
            // '<li class="active"> <a href="#">Subcategories</a> </li>' +
            // '<li> <a href="#">Elements</a> </li>' +
        '</ul>' +
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

// push the newly declared contant loaders into upaCL's children array. (These
// children CLs will be modified below (and more children will also be pushed
// to this array), but since they are reference types, these changes will also
// take effect inside upaCL.)
upaCL.childLoaders.push(termColumnCL);
upaCL.childLoaders.push(columnHeaderCL);
upaCL.childLoaders.push(columnMainCL);
upaCL.childLoaders.push(columnFooterCL);


// add an event listener to add tabs to the nav-tabs list.
columnHeaderCL.outwardCallbacks.push(function($startMarker) {
    $startMarker.next().find('.nav-tabs').data("tabCount", 0);
    $startMarker.on("add-tab", function(event, tabTitle, mainCL) {
        let $navTabList = $startMarker.next().find('.nav-tabs')
            .append('<li> <a href="#">' + tabTitle + '</a> </li>');
        ...
    });
});

// // test:
// if (typeof window["t3Counter"] === "undefined") {
//     window["t3Counter"] = 1;
// } else {
//     window["t3Counter"] += 1;
// }
// // Works as expected: t3Counter is still 1 even though the module is imported
// // first by the main module, and then in a subsequent module imported
// // afterwards.






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







upa1_contentSpecs["categoryTerm"] = function(jqObj, contextData) {
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
            if (jqObj.attr("is-loaded") !== "true") {
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

upa1_contentSpecs["categoryTermHeader"] = function(jqObj, contextData) {
    jqObj.html('<ul class="nav nav-tabs"></ul>')
        .find('ul')
        .append('<li class="active"> <a href="#">Subcategories</a> </li>')
        .append('<li> <a href="#">Elements</a> </li>')
        .find('li:first-of-type')
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
}


upa1_contentSpecs["subcategoryList"] = function(jqObj, contextData) {
    jqObj.html('<div hidden content-key="setData"></div>');
}
upa1_contentSpecs["elementList"] = function(jqObj, contextData) {
    jqObj.html('And I am gonna be a list of elements!');
}


upa1_contentSpecs["categoryTermFooter"] = function(jqObj, contextData) {
    jqObj.html("I'm gonna be a footer.");
}
