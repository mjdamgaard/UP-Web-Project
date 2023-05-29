
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=11";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=12";

import {
    sdbInterfaceCL, appColumnCL,
} from "/UPA_scripts.php?id=13";





export var entityColumnCL = new ContentLoader(
    "EntityColumn",
    /* Initial HTML template */
    '<<AppColumn>>',
    sdbInterfaceCL
);
entityColumnCL.addCallback("append",
    '.CI.ColumnHeader',
    "<<EntityHeaderContent>>"
);
entityColumnCL.addCallback("append",
    '.CI.ColumnMain',
    "<<EntityMainContent>>"
);

export var entityHeaderContentCL = new ContentLoader(
    "EntityHeaderContent",
    /* Initial HTML template */
    '<div>' +
        '<div class="supercat-nav-container"></div>' +
        '<<EntityRepresentation>>' +
    '</div>',
    appColumnCL,
);
entityHeaderContentCL.addCallback(function($ci, data) {
    $ci.children('.CI.EntityRepresentation').prepend(
        (data.entityType === "c") ? 'Category: ' :
            (data.entityType === "t") ? 'Term: ' :
                'Relation: '
    );
});
export var entityMainContentCL = new ContentLoader(
    "EntityMainContent",
    /* Initial HTML template */
    '<<PagesWithTabs>>',
    appColumnCL
);





entityMainContentCL.addCallback("data", function(newData, data) {
    if (data.entityType === "c") {
        newData.tabAndPageDataArr = [
            ["Subcategories", "CategorySubcategoriesPage", data],
            ["Elements", "CategoryElementsPage", data],
        ];
        newData.defaultTab = "Subcategories";
    }
});
export var categorySubcategoriesPageCL = new ContentLoader(
    "CategorySubcategoriesPage",
    /* Initial HTML template */
    '<div>' +
        '<<SubcategoriesSetField>>' +
    '</div>',
    appColumnCL
);
export var subategoriesSetFieldCL = new ContentLoader(
    "SubcategoriesSetField",
    /* Initial HTML template */
    '<<SetField>>',
    appColumnCL
);
subategoriesSetFieldCL.addCallback("data", function(newData, data) {
    return {
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
        '<<EntityTitle>>' +
        '<<SetRatingContainer>>' +
        '<<CategoryElementDropdown>>' +
    '</div>',
    appColumnCL
);

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
        '<<SupercategoryNavItem data.reversedSuperCatDefs[...]:wait>>' +
    '</div>',
    appColumnCL
);
export var supercategoryNavItemCL = new ContentLoader(
    "SupercategoryNavItem",
    /* Initial HTML template */
    '<span>' +
        '<<EntityTitle>>' +
    '</span>',
    appColumnCL
);
// supercategoryNavCL.addCallback(function($ci, data) {
//     $ci
//         .on("reload", function(event) {
//             let data = $ci.data("data");
//             supercategoryNavCL.loadReplaced($(this), "self", data)
//             return false;
//         });
// });
supercategoryNavCL.addCallback(function($ci, data) {
    if (typeof data.reversedSuperCatDefs !== "undefined") {
        return;
    }
    let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
    let reqData = {
        type: "superCatTitles",
        id: data.entityID,
        n: 20,
    };
    dbReqManager.query($ci, reqData, function($ci, result) {
        let data = $ci.data("data");
        data.reversedSuperCatDefs = result.reverse()
            .map(function(row) {
                return Object.assign(
                    Object.assign({}, data),
                    {title: row[0], entityID: row[1], entityType: "c"}
                );
            });
        $ci.children('.CI.SupercategoryNavItem')
            .trigger("load");
    });
});







export var categoryElementsPageCL = new ContentLoader(
    "CategoryElementsPage",
    /* Initial HTML template */
    '<div>' +
        '<<ElementsSetField>>' +
    '</div>',
    appColumnCL
);
export var elementsSetFieldCL = new ContentLoader(
    "ElementsSetField",
    /* Initial HTML template */
    '<<SetField>>',
    appColumnCL
);
elementsSetFieldCL.addCallback("data", function(newData, data) {
    return {
        subjID: data.entityID,
        relID: "2",
        elemContentKey: "TermElement",
    };
});
export var termElementCL = new ContentLoader(
    "TermElement",
    /* Initial HTML template */
    '<div class="element">' +
        '<<CategoryNav>>' +
        '<<EntityTitle>>' +
        '<<SetRatingContainer>>' +
        '<<TermElementDropdown>>' +
    '</div>',
    appColumnCL
);






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
