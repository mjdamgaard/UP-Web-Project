
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
        '<<SetRatingsContainer>>' +
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






export var setRatingsContainerCL = new ContentLoader(
    "SetRatingsContainer",
    /* Initial HTML template */
    '<div></div>',
    appColumnCL
);
setRatingsContainerCL.addCallback(function($ci, data) {
    let combRatVal = data.getFromAncestor("combRatVal");
    let score = (combRatVal / 32767 * 10).toFixed(2);
    $ci.append('<div>' + score + '</div>');
});


export var ratingInfoDisplayCL = new ContentLoader(
    "RatingInfoDisplay",
    /* Initial HTML template */
    '<div>' +
        '<<RatingBar>>' +
        '<<RatingValue>>' +
    '</div>',
    appColumnCL
);

export var ratingValueCL = new ContentLoader(
    "RatingValue",
    /* Initial HTML template */
    '<span>' +
    '</span>',
    appColumnCL
);




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



export var elementDropdownPageCL = new ContentLoader(
    "ElementDropdownPage",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    appColumnCL
);
