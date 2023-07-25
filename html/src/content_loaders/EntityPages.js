
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterface.js";
import {
    SetQuerier, SetCombiner, MaxRatingSetCombiner,
} from "/src/SetGenerator.js";




export var entityPageCL = new ContentLoader(
    "EntityPage",
    /* Initial HTML template */
    '<div>' +
        '<h2><<EntityTitle>></h2>' +
        '<span class="full-title">Full title: <<FullEntityTitle>></span>' +
        '<div><<EntityIDDisplay>></div>' +
        '<div><<ContextDisplay>></div>' +
         "<<PagesWithTabs data:wait>>" +
     '</div>',
    sdbInterfaceCL
);
entityPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
    ]);
    data.columnEntityID = data.entID;
});
entityPageCL.addCallback(function($ci, data) {
    if (data.cxtID) {
        $ci.children('.CI.PagesWithTabs').trigger("load");
        return;
    };
    let reqData = {
        req: "ent",
        id: data.entID,
    };
    let $this = $(this);
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.typeID = (result[0] ?? [])[0];
        data.cxtID = (result[0] ?? [])[1];
        data.defStr = (result[0] ?? [])[2];
        data.tabAndPageDataArr = [
            ["Info", "EntityInfoPage", {}],
            ["Ratings", "EntityRatingsPage", {}],
            ["Related to", "PropertyCategoryPage", {
                propID: 42,
            }],
        ];
        switch (data.typeID) {
            case 1:
                data.tabAndPageDataArr.push(
                    ["Relevant ratings", "RelevantRatingsTypePage"],
                    ["Relevant properties", "RelevantPropertiesTypePage"],
                    ["Submit entity", "SubmitEntityPage"],
                );
                data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                    "Relevant ratings";
                break;
            case 2:
                data.tabAndPageDataArr.push(
                    ["Subcategories", "PropertyCategoryPage", {propID: 37,}],
                    ["Instances", "CategoryInstancesPage"],
                    ["Supercategories", "PropertyCategoryPage", {propID: 47,}],
                    ["Submit instance", "SubmitCategoryInstancePage"],
                );
                data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                    "Subcategories";
                break;
            case 3:
                data.tabAndPageDataArr.push(
                    ["Submit entity", "SubmitEntityPage"],
                );
                data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                    "Submit entity";
                break;
            default:
                data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                    "Info";
                break;
        }
        // TODO: Implement the following two tabs as well.
        // data.tabAndPageDataArr.push(
        //     ["Comments", "EntityCommentsPage", {}],
        //     ["Discussions", "EntityDiscussionsPage", {}],
        // );
        $ci.children('.CI.PagesWithTabs').trigger("load");
    });
});

export var entIDDisplayCL = new ContentLoader(
    "EntityIDDisplay",
    /* Initial HTML template */
    '<span>ID: </span>',
    sdbInterfaceCL
);
entIDDisplayCL.addCallback(function($ci, data) {
    $ci.append('#' + data.getFromAncestor("entID"));
});


export var propertyCategoryPageCL = new ContentLoader(
    "PropertyCategoryPage",
    /* Initial HTML template */
    '<div>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
propertyCategoryPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "propID",
        "entID",  // optional.
    ]);
});
propertyCategoryPageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier(
        [21, "#" + data.propID + "|#" + data.entID], // catKey.
        // (21 is the ID of the "<Property> of <Entity>" template.)
        data, // dataNode.
    );
});


export var categoryInstancesPageCL = new ContentLoader(
    "CategoryInstancesPage",
    /* Initial HTML template */
    '<div>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
categoryInstancesPageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier(
        data.getFromAncestor("entID"), // catKey.
        data, // dataNode.
    );
});


export var submitCategoryInstancePageCL = new ContentLoader(
    "SubmitCategoryInstancePage",
    /* Initial HTML template */
    '<div>' +
        '<<SubmitInstanceField>>' +
    '</div>',
    sdbInterfaceCL
);





export var entityRatingsPageCL = new ContentLoader(
    "EntityRatingsPage",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant ratings</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
entityRatingsPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "typeID",
    ]);
});
entityRatingsPageCL.addCallback("data", function(data) {
    // Relevant categories:
    data.elemContentKey = "RatingElement";
    let sg1 = new SetQuerier(
        [21, "#54|#" + data.entID], // catKey.
        data, // dataNode.
    );
    let sg2 = new SetQuerier(
        [21, "#52|#" + data.typeID], // catKey.
        data, // dataNode.
    );
    data.setGenerator = new MaxRatingSetCombiner([sg1, sg2]);
});
entityRatingsPageCL.addCallback("data", function(data) {
    data.instID = data.getFromAncestor("columnEntityID");
});



export var submitEntityPageCL = new ContentLoader(
    "SubmitEntityPage",
    /* Initial HTML template */
    '<div>' +
        '<<SubmitEntityField>>' +
    '</div>',
    sdbInterfaceCL
);



export var relevantRatingsTypePageCL = new ContentLoader(
    "RelevantRatingsTypePage",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant categories to rate for type instances of this type</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantRatingsTypePageCL.addCallback("data", function(data) {
    data.copyFromAncestor("entID");
});
relevantRatingsTypePageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier(
        [21, "#52|#" + data.entID], // catKey.
        data, // dataNode.
    );
});

export var relevantPropertiesTypePageCL = new ContentLoader(
    "RelevantPropertiesTypePage",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant categories to rate for type instances of this type</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantPropertiesTypePageCL.addCallback("data", function(data) {
    data.copyFromAncestor("entID");
});
relevantPropertiesTypePageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier(
        [21, "#58|#" + data.entID], // catKey.
        data, // dataNode.
    );
});





export var entityInfoPageCL = new ContentLoader(
    "EntityInfoPage",
    /* Initial HTML template */
    '<div>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
entityInfoPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "typeID",
    ]);
});
entityInfoPageCL.addCallback("data", function(data) {
    data.elemContentKey = "SemanticPropertyElement";
    let sg1 = new SetQuerier(
        [21, "#58|#" + data.entID], // catKey.
        data, // dataNode.
        100, // num,
    );
    let sg2 = new SetQuerier(
        [21, "#59|#" + data.typeID], // catKey.
        data, // dataNode.
        100, // num.
    );
    data.setGenerator = new MaxRatingSetCombiner([sg1, sg2]);
});
