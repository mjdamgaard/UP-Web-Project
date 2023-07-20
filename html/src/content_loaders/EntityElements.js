
import {
    ContentLoader, ChildData,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";
import {
    SetQuerier, SetCombiner, MaxRatingSetCombiner,
} from "/src/content_loaders/SetLists.js";




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
        '<<SetCategoriesRatingsDisplay>>' +
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

export var setCategoriesRatingsDisplayCL = new ContentLoader(
    "SetCategoriesRatingsDisplay",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    sdbInterfaceCL
);
setCategoriesRatingsDisplayCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "setGenerator",
    ]);
});
setCategoriesRatingsDisplayCL.addCallback(function($ci, data) {
    let catIDArr = data.setGenerator.getSetCategories();
    let instID = data.getFromAncestor("entID");
    catIDArr.forEach(function(val) {
        setCategoriesRatingsDisplayCL.loadAppended(
            $ci, "RatingDisplay", new ChildData(data, {
                catID: val,
                instID: instID,
            })
        );
    });
});




export var semanticPropertyElementCL = new ContentLoader(
    "SemanticPropertyElement",
    /* Initial HTML template */
    '<div>' +
        '<<SemanticPropertyTitle>>' +
        '<<SetDisplay data:wait>>' +
    '</div>',
    sdbInterfaceCL
);
semanticPropertyElementCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "columnEntityID",
    ]);
});
semanticPropertyElementCL.addCallback(function($ci, data) {
    $ci.on("toggle", function() {
        let $this = $(this);
        if (!data.setDisplayIsLoaded) {
                data.elemContentKey = "GeneralEntityElement";
                data.setGenerator = new SetQuerier({
                    catCxtID: 21,
                    catStr: "#" + data.entID + "|#" + data.columnEntityID,
                    queryUserID: 9,
                    inputUserID: 9,
                    num: 4000,
                    ratingLo: 0,
                    ratingHi: 0,
                });
                data.initialNum = 50;
                data.incrementNum = 50;
            $this.children('.CI.SetDisplay').trigger("load");
            data.setDisplayIsLoaded = true;
        } else {
            $this.children('.CI.SetDisplay').toggle();
        }
        return false;
    });
});
export var semanticPropertyTitleCL = new ContentLoader(
    "SemanticPropertyTitle",
    /* Initial HTML template */
    '<span>' +
        '<<DropdownButton>>' +
        '<<EntityTitle>>' +
    '<span>',
    sdbInterfaceCL
);
semanticPropertyTitleCL.addCallback("data", function(data) {
    data.isLinkArr = [];
});
semanticPropertyTitleCL.addCallback(function($ci, data) {
    $ci.on("click", function() {
        let $this = $(this);
        $this.children('.CI.DropdownButton').trigger("toggle-button-symbol");
        $this.trigger("toggle");
        return false;
    });
});
