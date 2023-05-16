
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=1";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=2";

import {
    sdbInterfaceCL, appColumnCL, pagesWithTabsCL, columnMainCL,
} from "/UPA_scripts.php?id=3";







export var categoryColumnCL = new ContentLoader(
    "CategoryColumn",
    /* Initial HTML template */
    '<<AppColumn>>',
    appColumnCL
);
categoryColumnCL.addCallback("data", function(data) {
    var childData = Object.assign({}, data);
    childData.headerSpecs = {
        contentKey: "CategoryHeaderContent",
        data: data, // TODO: change this..
    };
    childData.mainSpecs = {
        contentKey: "CategoryMainContent",
        data: data, // TODO: change this..
    };
    return childData;
});

export var categoryHeaderContentCL = new ContentLoader(
    "CategoryHeaderContent",
    /* Initial HTML template */
    '<div>' +
        '<h3>Category: <span class="title"></span><h3>' +
    '</div>',
    appColumnCL,
);

export var categoryMainContentCL = new ContentLoader(
    "CategoryMainContent",
    /* Initial HTML template */
    '<<PagesWithTabs>>',
    appColumnCL
);
categoryMainContentCL.addCallback("data", function(data) {
    data.tabAndPageDataArr = [
        ["Info", "CategoryInfoPage", data],
        ["Subategories", "SubcategoriesPage", data],
        ["Elements", "ElementsPage", data],
    ];
    data.defaultTab = "Subategories";
});
export var categoryInfoPageCL = new ContentLoader(
    "CategoryInfoPage",
    /* Initial HTML template */
    '<div>Not implemented yet.</div>',
    appColumnCL
);
export var categorySubategoriesPageCL = new ContentLoader(
    "CategorySubategoriesPage",
    /* Initial HTML template */
    '<div>Not implemented yet.</div>',
    appColumnCL
);





// export var pageFieldCL = new ContentLoader(
//     "PageField",
//     /* Initial HTML template */
//     '<div class="container"></div>',
//     appColumnCL
// );
// pageFieldCL.addCallback(function($ci) {
//     $ci
//         .on("query-db", function(event, reqData, cacheKey, callback) {
//             let $this = $(this);
//             let dbReqManager = $this.data('dbReqManager');
//             dbReqManager.query($this, reqData, cacheKey, callback);
//             return false;
//         })
//         .on("append-contents", function(event, contentKey, dataArr, selector) {
//             let $obj = (typeof selector === "undefined") ?
//                 $(this) : $(this).find(selector);
//             let len = dataArr.length;
//             for (let i = 0; i < len; i++) {
//                 pageFieldCL.loadAppended($obj, contentKey, dataArr[i]);
//             }
//             return false;
//         })
//         .on("prepend-contents", function(event, contentKey, dataArr, selector) {
//             let $obj = (typeof selector === "undefined") ?
//                 $(this) : $(this).find(selector);
//             let len = dataArr.length;
//             for (let i = 0; i < len; i++) {
//                 pageFieldCL.loadPrepended($obj, contentKey, dataArr[i]);
//             }
//             return false;
//         });
// });
// export var termListCL = new ContentLoader(
//     "TermList",
//     /* Initial HTML template */
//     '<<PageField>>',
//     appColumnCL
// );
// termListCL.addCallback(function($ci) {
//     $ci.append('<ul class="list-group"></ul>');
// });
// termListCL.addCallback(function($ci) {
//     $ci
//         .on("append-elements", function(event, contentKey, elemDataArr) {
//             $(this).trigger("append-contents",
//                 [contentKey, elemDataArr, 'ul, ol']
//             );
//             return false;
//         })
//         .on("empty", function(event, elemDataArr, elemCL) {
//             $(this).children('ul, ol').empty();
//             return false;
//         });
// });
//
//
// export var extensibleTermListCL = new ContentLoader(
//     "ExtensibleTermList",
//     /* Initial HTML template */
//     '<<TermList>>',
//     appColumnCL
// );
// // TODO: Add a callback that adds a button at the bottom of the ci, which when
// // pressed, adds elements to the list, either cached ones or ones that are then
// // queried.
//
// export var termListElementCL = new ContentLoader(
//     "TermListElement",
//     /* Initial HTML template */
//     '<li class="list-group-item"></li>',
//     appColumnCL
// );
// export var simpleTermListElementCL = new ContentLoader(
//     "SimpleTermListElement",
//     /* Initial HTML template */
//     '<<TermListElement>>',
//     appColumnCL
// );
//
// // simpleTermListElementCL.addCallback(function($ci) {
// //     let termID = $ci.data("contextData").termID;
// //     $ci.data("contextData").dbReqManager.query($ci, )...
// //     $ci.append(
// //         ''
// //     );
// // });
