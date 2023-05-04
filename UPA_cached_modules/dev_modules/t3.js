
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
        '<<TabNavList>>' +
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


export var tabNavListCL = new ContentLoader(
    "TabNavList",
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
upaCL.childLoaders.push(tabNavListCL);




columnMainCL.outwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci.data("open-pages-title-arr", [])
        .on("open-page", function(event, tabTitle, contentKey, otherData) {
            let $this = $(this);
            if ($this.data("open-pages-title-arr").includes(tabTitle)) {
                $this.children().hide();
                $this.children('[data-title="' + tabTitle +'"]').show();
            } else {
                let pageCL = columnMainCL.getRelatedContentLoader(
                    contentKey, parentCLArr
                );
                $this.data("open-pages-title-arr")[];
                $this.children().hide();
                let pageData = otherData ?? data;
                // note that the parentCLArr context will be that of the
                // columnMain CI for the loaded page.
                pageCL.loadAppended($this, pageData, parentCLArr);
            }
            return false;
        })
        .on("close-page", function(event, tabTitle) {
            let $this = $(this);
            let titleArr = $this.data("open-pages-title-arr");
            titleArr[titleArr.indexOf(tabTitle)] = null;
            $this.children('[data-title="' + tabTitle +'"]').remove();
            return false;
        })
});

columnCL.outwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci.data("content-key-store", {})
        .on("add-main-page", function(event, tabTitle, contentKey, otherData) {
            $(this).data("content-key-store")[tabTitle] = contentKey;
            return false;
        })
        .on("open-main-page", function(event, tabTitle, otherData) {
            let $this = $(this);
            let contentKey = $this.data("content-key-store")[tabTitle];
            $(this).children('.CI.ColumnMain')
                .trigger("open-page", [tabTitle, contentKey, otherData]);
            return false;
        })
        .on("close-main-page", function(event, tabTitle) {
            $(this).children('.CI.ColumnMain')
                .trigger("open-page", [tabTitle]);
            return false;
        })
        .on("add-header-tab", function(event, tabTitle) {
            $(this).children('.CI.ColumnHeader')
                .trigger("add-tab", [tabTitle]);
            return false;
        })
        .on("activate-header-tab", function(event, tabTitle) {
            $(this).children('.CI.ColumnHeader')
                .trigger("activate-tab", [tabTitle]);
            return false;
        })
        .on("add-tab-and-main-page", function(
            event, tabTitle, contentKey, otherData
        ) {
            $(this)
                .trigger("add-main-page", [tabTitle, contentKey, otherData])
                .trigger("add-header-tab", [tabTitle]);
            return false;
        })
        .on("open-tab-and-main-page", function(event, tabTitle, otherData) {
            $(this)
                .trigger("activate-header-tab", [tabTitle])
                .trigger("open-main-page", [tabTitle, otherData]);
            return false;
        });
});




/* <<TabNavList>>
 * This CL class is responsible for the apperance of a tab
 * nav bar, and for sending click event signals to its CI parent and handling
 * events coming from its parent (e.g. to add or change tabs).
 **/

tabNavListCL.outwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci
        .on("add-tab", function(event, tabTitle) {
            let $newTab = $(this).append(
                    '<li data-title="' + tabTitle + '"> <a href="#">' +
                    tabTitle + '</a> </li>'
                )
                .children(':last-child');
            $newTab.on("click", function() {console.log($(this).closest('.CI'));
                $(this).closest('.CI') // gets the TabNavList parent
                    .trigger("activate-tab", [tabTitle])
                    .closest('CI') // gets the parent of TabNavList.
                    .trigger("tab-selected", [tabTitle]);
                return false;
            });
            return false;
        })
        .on("activate-tab", function(event, tabTitle) {
            $(this).children('li')
                .removeClass("active")
                .filter('[data-title="' + tabTitle + '"]')
                .addClass("active");
            return false;
        });
});

columnHeaderCL.outwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci
        .on("add-tab", function(event, tabTitle) {
            $(this).find('.CI.TabNavList')
                .trigger("add-tab", [tabTitle]);
            return false;
        })
        .on("tab-selected", function(event, tabTitle) {
            $(this).closest('.CI')
                .trigger("tab-selected", [tabTitle]);
            return false;
        });
});



export var mainPageCL = new ContentLoader(
    "MainPage",
    /* Initial HTML */
    '<div>' +
        '<<DataBaseQuerier>>' +
    '</div>'
);
column.childLoaders.push(mainPageCL);

export var categoryColumnCL = new ContentLoader(
    "CategoryColumn",
    /* Initial HTML */
    '<<Column>>'
);
columnGroupCL.childLoaders.push(categoryColumnCL);


categoryColumnCL.outwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci.find('.CI.ColumnHeader').first()
        .trigger("add-tab", ["Supercategories"])
        .trigger("add-tab", ["Subcategories"])
        .trigger("add-tab", ["Elements"]);
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
