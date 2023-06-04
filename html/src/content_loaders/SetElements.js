
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";



export var setElementCL = new ContentLoader(
    "SetElement",
    /* Initial HTML template */
    '<div>' +
        '<<ElementHeading>>' +
        '<<ElementCombRatingDisplay>>' +
        '<<DropdownButton>>' +
        '<<ElementDropdownPage data:wait>>' +
    '</div>',
    appColumnCL
);
setElementCL.addCallback(function($ci, data) {
    $ci.on("click", function() {
        $(this).children('.CI.ElementDropdownPage').trigger("load");
        return false;
    });
});
export var elementHeadingCL = new ContentLoader(
    "ElementHeading",
    /* Initial HTML template */
    '<div></div>', // content is appended by decorators.
    appColumnCL
);
export var elementCombRatingDisplayCL = new ContentLoader(
    "ElementCombRatingDisplay",
    /* Initial HTML template */
    '<div></div>',
    appColumnCL
);
elementCombRatingDisplayCL.addCallback(function($ci, data) {
    let combRatVal = data.getFromAncestor("combRatVal");
    let score = (combRatVal / 32767 * 10).toFixed(2);
    $ci.append(score.toString());
});


export var elementDropdownPageCL = new ContentLoader(
    "ElementDropdownPage",
    /* Initial HTML template */
    '<div>' +
        '<<SetRatingsContainer>>' +
    '</div>',
    appColumnCL
);

export var termElementCL = new ContentLoader(
    "TermElement",
    /* Initial HTML template */
    '<<SetElement>>',
    appColumnCL
);
termElementCL.addCallback("prepend",
    '.CI.ElementHeading',
    '</div>' +
        '<<ContextNav>>' +
        '<<TermTitle>>' +
    '</div>'
);
termElementCL.addCallback("data", function(data) {
    data.titleCutOutLevels = [1, 1];
});


export var setRatingContainerCL = new ContentLoader(
    "SetRatingsContainer",
    /* Initial HTML template */
    '<div>' +
        // '<<RatingInfoDisplay>>' +
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
