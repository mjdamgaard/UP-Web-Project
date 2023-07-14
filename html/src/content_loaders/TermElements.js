
import {
    ContentLoader, ChildData,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";




export var generalTermElementCL = new ContentLoader(
    "GeneralTermElement",
    /* Initial HTML template */
    '<div>' +
        '<<TermTitle>>' +
        '<<ElementRatingDisplay>>' +
        '<<DropdownBox>>' +
    '</div>',
    sdbInterfaceCL
);
generalTermElementCL.addCallback("data", function(data) {
    data.dropdownCL = generalTermElementCL.getRelatedCL(
        "GeneralTermElementDropdownPage"
    );
});
export var generalTermElementDropdownPageCL = new ContentLoader(
    "GeneralTermElementDropdownPage",
    /* Initial HTML template */
    '<div>' +
        '<div>Full title: <<FullTermTitle>></div>' +
        '<div><<TermIDDisplay>></div>' +
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
    let subjID = data.getFromAncestor("termID");
    predIDArr.forEach(function(val) {
        setPredicatesRatingsDisplayCL.loadAppended(
            $ci, "RatingDisplay", new ChildData(data, {
                predID: val,
                subjID: subjID,
            })
        );
    });
});
