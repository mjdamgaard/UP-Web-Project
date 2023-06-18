
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
        '<<CombinedRatValDisplay>>' +
        '<<TermTitleDisplay>>' +
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
        'TermElementDropdownPage..' +
    '</div>',
    sdbInterfaceCL
);
