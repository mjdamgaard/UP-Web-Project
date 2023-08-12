
import {
    ContentLoader, DataNode,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterface.js";
import {
    SetQuerier, SetCombiner, MaxRatingSetCombiner,
} from "/src/SetGenerator.js";




export var generalEntityElementCL = new ContentLoader(
    "GeneralEntityElement",
    /* Initial HTML template */
    '<div>' +
        '<div>' +
            '<h4><<EntityTitle>></h4>' +
            '<<ElementRatingDisplay>>' +
        '</div>' +
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
    $ci.html((ratVal / 6553.5).toFixed(1));
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
        "entID",
    ]);
});
setCategoriesRatingsDisplayCL.addCallback(function($ci, data) {
    let catKeyArr = data.setGenerator.getSetCategoryKeys();
    catKeyArr.forEach(function(val) {
        if (!isNaN(parseInt(val))) {
            setCategoriesRatingsDisplayCL.loadAppended(
                $ci, "RatingDisplay", new DataNode(data, {
                    catID: val,
                    instID: data.entID,
                })
            );
        } else {
            let catKey = JSON.parse(val);
            setCategoriesListCL.loadAppended(
                $ci, "MissingCategoryDisplay", new DataNode(data, catKey)
            );
        }
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
            data.setDisplayIsLoaded = true;
            let reqData = {
                req: "ent",
                id: data.entID,
            };
            dbReqManager.query($ci, reqData, data, function($ci, result, data) {
                let defStr = (result[0] ?? [""])[2];
                let defItemStrArr = defStr
                    .replaceAll("\\\\", "&bsol;")
                    .replaceAll("\\|", "&#124;")
                    .split("|");
                let type = defItemStrArr[1];
                let quantityWord = defItemStrArr[2];
                switch (type) {
                    case "#7": // the "Text data" type.
                        data.elemContentKey = "TextDataDisplayElement";
                    break;
                    case "#64": // the "Time" type.
                        data.elemContentKey = "DefStrDisplayElement";
                    break;
                    // TODO: Add more of these type--CL pairings when needed.
                    default:
                        data.elemContentKey = "GeneralEntityElement";
                    break;
                }
                switch (quantityWord) {
                    case "one":
                        data.initialNum = 1;
                        data.incrementNum = 1;
                    break;
                    case "few":
                        data.initialNum = 6;
                        data.incrementNum = 6;
                    break;
                    case "many":
                        data.initialNum = 50;
                        data.incrementNum = 50;
                    break;
                    default:
                        if (/^[1-9][0-9]{0,2}$/.test(quantityWord)) {
                            data.initialNum = parseInt(quantityWord);
                            data.incrementNum = parseInt(quantityWord);
                        } else {
                            data.initialNum = 50;
                            data.incrementNum = 50;
                        }
                    break;
                }
                data.setGenerator = new SetQuerier(
                    [21, "#" + data.entID + "|#" + data.columnEntityID], //
                    // catKey.
                    data, // dataNode.
                    null, // num.
                    36864, // ratingLo (= CONV("9000", 16, 10)).
                );
                $this.children('.CI.SetDisplay').trigger("load");
            });
        } else {
            $this.children('.CI.SetDisplay').toggle();
        }
        return false;
    });
});
export var semanticPropertyTitleCL = new ContentLoader(
    "SemanticPropertyTitle",
    /* Initial HTML template */
    '<h3>' +
        '<<DropdownButton>>' +
        '<<EntityTitle>>' +
    '</h3>',
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



export var defStrDisplayElementCL = new ContentLoader(
    "DefStrDisplayElement",
    /* Initial HTML template */
    '<div></div>',
    sdbInterfaceCL
);
defStrDisplayElementCL.addCallback("data", function(data) {
    data.copyFromAncestor("entID");
});
defStrDisplayElementCL.addCallback(function($ci, data) {
    let reqData = {
        req: "ent",
        id: data.entID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        let defStr = (result[0] ?? [""])[2];
        $ci.append(defStr);
    });
});




export var categoryForSortingElementCL = new ContentLoader(
    "CategoryForSortingElement",
    /* Initial HTML template */
    '<div>' +
        '<<EntityTitle>>' +
    '</div>',
    sdbInterfaceCL
);
