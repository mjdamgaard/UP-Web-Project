
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/ColumnInterface.js";




export var generalTermElementCL = new ContentLoader(
    "GeneralTermElement",
    /* Initial HTML template */
    '<div>' +
        'test..' +
        '<<TermTitle>>' +
        '<<CombinedRatingDisplay>>' +
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
        '<<FullContextAndTitleField>>' +
        // '<<TermShortDescriptionField>>' +
        '<<SetPredicatesRatingsDisplay>>' +
    '</div>',
    sdbInterfaceCL
);


export var combinedRatingDisplayCL = new ContentLoader(
    "CombinedRatingDisplay",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    sdbInterfaceCL
);
combinedRatingDisplayCL.addCallback(function($ci, data) {
    $ci.html(data.getFromAncestor("combRatVal").toFixed(2));
});




//
