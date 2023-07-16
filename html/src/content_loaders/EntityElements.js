
import {
    ContentLoader, ChildData,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";




export var generalEntityElementCL = new ContentLoader(
    "GeneralEntityElement",
    /* Initial HTML template */
    '<div>' +
        '<<EntityTitle>>' +
        '<<ElementRatingDisplay>>' +
        '<<DropdownBox>>' +
    '</div>',
    sdbInterfaceCL
);
generalEntityElementCL.addCallback("data", function(data) {
    data.dropdownCL = generalEntityElementCL.getRelatedCL(
        "GeneralEntityElementDropdownPage"
    );
});
export var generalEntityElementDropdownPageCL = new ContentLoader(
    "GeneralEntityElementDropdownPage",
    /* Initial HTML template */
    '<div>' +
        '<div>Full title: <<FullEntityTitle>></div>' +
        '<div><<EntityIDDisplay>></div>' +
        '<<SetPredicatesRatingsDisplay>>' +
    '</div>',
    sdbInterfaceCL
);


export var elementRatingDisplayCL = new ContentLoader(
    "ElementRatingDisplay",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    sdbInterfaceCL
);
elementRatingDisplayCL.addCallback(function($ci, data) {
    let ratVal = data.getFromAncestor("ratVal");
    $ci.html((ratVal / 6553.5).toFixed(2));
});

export var setPredicatesRatingsDisplayCL = new ContentLoader(
    "SetPredicatesRatingsDisplay",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    sdbInterfaceCL
);
setPredicatesRatingsDisplayCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "setGenerator",
    ]);
});
setPredicatesRatingsDisplayCL.addCallback(function($ci, data) {
    let predIDArr = data.setGenerator.getSetPredicates();
    let subjID = data.getFromAncestor("entID");
    predIDArr.forEach(function(val) {
        setPredicatesRatingsDisplayCL.loadAppended(
            $ci, "RatingDisplay", new ChildData(data, {
                predID: val,
                subjID: subjID,
            })
        );
    });
});
