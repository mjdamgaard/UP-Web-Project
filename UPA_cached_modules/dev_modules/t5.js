
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=1";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=2";

import {
    sdbInterfaceCL, appColumnCL,
} from "/UPA_scripts.php?id=3";







export var categoryColumnCL = new ContentLoader(
    "CategoryColumn",
    /* Initial HTML template */
    '<<AppColumn>>',
    sdbInterfaceCL
);
categoryColumnCL.addCallback(function($ci, data) {
    let $columnHeader = $ci.find('.CI.ColumnHeader');
    appColumnCL.loadAppended($columnHeader, "CategoryHeaderContent", data);
    let $columnMain = $ci.find('.CI.ColumnMain');
    appColumnCL.loadAppended($columnMain, "CategoryMainContent", data);
});

export var categoryHeaderContentCL = new ContentLoader(
    "CategoryHeaderContent",
    /* Initial HTML template */
    '<div>' +
        '<<SupercategoryNav>>' +
        '<h3>Category: <<CategoryTitle>> <h3>' +
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
categoryElementCL.addCallback("data", function(data) {
    data.catID = data.objID;
});
export var categoryTitleCL = new ContentLoader(
    "CategoryTitle",
    /* Initial HTML template */
    '<a href="#">' +
    '</a>',
    appColumnCL
);
categoryTitleCL.addCallback(function($ci, data) {
    if (typeof data.title === "string") {
        $ci.append(data.title);
        return;
    }
    let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
    let reqData = {
        type: "cat",
        id: data.catID,
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
categoryTitleCL.addCallback(function($ci, data) {
    $ci
        .on("click", function(event) {debugger;
            let columnData = {
                preferenceUser: data.preferenceUser,
                entityType: "c",
                entityID: data.catID,
                user: data.user,
            };
            $(this).trigger("open-column", [
                "CategoryColumn", columnData, "right", true
            ]);
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




export var supercategoryNavCL = new ContentLoader(
    "SupercategoryNav",
    /* Initial HTML template */
    '<div>' +
        '<<SupercategoryNavItem data.reversedSuperCatDefs[...]>>' +
    '</div>',
    appColumnCL
);
export var supercategoryNavItemCL = new ContentLoader(
    "SupercategoryNavItem",
    /* Initial HTML template */
    '<span>' +
        '<<CategoryTitle>>' +
    '</span>',
    appColumnCL
);
supercategoryNavCL.addCallback(function($ci, data) {
    $ci
        .on("reload", function(event) {
            let data = $ci.data("data");
            supercategoryNavCL.loadReplaced($(this), "self", data)
            return false;
        });
});
supercategoryNavCL.addCallback(function($ci, data) {
    if (typeof data.reversedSuperCatDefs !== "undefined") {
        return;
    }
    let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
    let reqData = {
        type: "superCatTitles",
        id: data.catID,
        n: 20,
    };
    dbReqManager.query($ci, reqData, function($ci, result) {
        let data = $ci.data("data");
        data.reversedSuperCatDefs = result.reverse()
            .map(function(row) {
                return Object.assign(
                    Object.assign({}, data),
                    {title: row[0], catID: row[1]}
                );
            });
        $ci.trigger("reload");
    });
});











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
