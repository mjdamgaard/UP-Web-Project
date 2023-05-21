
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
        ["Subategories", "CategorySubategoriesPage", data],
        ["Elements", "ElementsPage", data],
    ];
    data.defaultTab = "Subategories";
});
export var categorySubategoriesPageCL = new ContentLoader(
    "CategorySubategoriesPage",
    /* Initial HTML template */
    '<div>' +
        '<<SubategoriesSetField>>' +
    '</div>',
    appColumnCL
);
export var subategoriesSetFieldCL = new ContentLoader(
    "SubategoriesSetField",
    /* Initial HTML template */
    '<<SetField>>',
    appColumnCL
);
subategoriesSetFieldCL.addCallback("data", function(data) {
    return {
        user: data.user,
        subjID: data.entityID,
        relID: "1",
        elemContentKey: "CategoryElement",
    };
});
export var categoryElementCL = new ContentLoader(
    "CategoryElement",
    /* Initial HTML template */
    '<div class="element">' +
        '<<SupercategoryNav>>' +
        '<<CategoryTitle>>' +
        '<<SetRatingContainer>>' +
        '<<CategoryElementDropdown>>' +
    '</div>',
    appColumnCL
);
export var categoryTitleCL = new ContentLoader(
    "CategoryTitle",
    /* Initial HTML template */
    '<span>' +
    '</span>',
    appColumnCL
);
categoryTitleCL.addCallback(function($ci, data) {
    let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
    let reqData = {
        type: "cat",
        id: data.objID,
    };
    dbReqManager.query($ci, reqData, function($ci, result) {
        $ci.append(
            (
                result[0] ??
                ['<span class="missing-title">Title is missing</span>']
            )[0]
        );
    });
});
// At some point, we'll have composite sets as well, for which we'll need to
// display several ratings in the list.
export var setRatingContainerCL = new ContentLoader(
    "SetRatingContainer",
    /* Initial HTML template */
    '<div>' +
        '<<RatingInfoDisplay>>' +
    '</div>',
    appColumnCL
);

export var ratingInfoDisplayCL = new ContentLoader(
    "RatingInfoDisplay",
    /* Initial HTML template */
    '<div>' +
        '<<RatingBar>>' +
        '<<RatingValue>>' +
    '</div>',
    appColumnCL
);
// TODO: Make a RatingInfoDisplay look its own data up iff the rating value is
// not found in the input data object.

export var ratingValueCL = new ContentLoader(
    "RatingValue",
    /* Initial HTML template */
    '<span>' +
    '</span>',
    appColumnCL
);
ratingValueCL.addCallback(function($ci, data) {
    if (data.ratVal.length == 2) {
        let score = parseInt(data.ratVal, 16) * 10 / 127;
        $ci.append(score.toFixed(2));
    } else {
        let score = parseInt(data.ratVal.substring(0, 4), 16) * 10 / 32767;
        $ci.append(score.toFixed(2));
    }
});


export var elementCL = new ContentLoader(
    "Element",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    appColumnCL
);



export var supercategoryNavCL = new ContentLoader(
    "SupercategoryNav",
    /* Initial HTML template */
    '<div class="element">' +
        '<<SupercategoryNav>>' +
        '<<CategoryTitle>>' +
        '<<SetRatingContainer>>' +
        '<<CategoryElementDropdown>>' +
    '</div>',
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
