
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";
import {
    SetQuerier, SetCombiner, MaxRatingSetCombiner,
} from "/src/content_loaders/SetLists.js";




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
        // "tmplID",  // optional.
    ]);
    data.columnEntityID = data.entID;
});
entityPageCL.addCallback(function($ci, data) {
    if (data.tmplID) {
        $ci.children('.CI.PagesWithTabs').trigger("load");
        return;
    };
    let reqData = {
        req: "ent",
        id: data.entID,
    };
    let $this = $(this);
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.typeID = result[0][0];
        data.tabAndPageDataArr = [
            ["Info", "EntityInfoPage", {}],
            ["Ratings", "EntityRatingsPage", {}],
            ["Related to", "PropertyCategoryPage", {
                propID: 42,
            }],
        ];
        switch (data.typeID) {
            case 2:
                data.tabAndPageDataArr.push(
                    ["Subcategories", "PropertyCategoryPage", {propID: 37,}],
                    ["Instances", "CategoryInstancesPage"],
                    ["Supercategories", "PropertyCategoryPage", {propID: 47,}],
                    ["Submit category instance", "SubmitCategoryInstancePage"],
                );
                data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                    "Subcategories";
                break;
            case 3:
                data.tabAndPageDataArr.push(
                    ["Submit template instance", "SubmitTemplateInstancePage"],
                );
                data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                    "Submit template instance";
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
    '<<SetDisplay>>',
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
    data.setGenerator = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "#" + data.propID + "|#" + data.entID,
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});


// TODO: Obvoiusly gather the repeated code above and below at some point, and
// probably gather it into a BasicSetQuerier class (subclass of SetQuerier).
// Make that class take the CI data as an input parameter, from which to get the
// input and query user IDs.


export var categoryInstancesPageCL = new ContentLoader(
    "CategoryInstancesPage",
    /* Initial HTML template */
    '<<SetDisplay>>',
    sdbInterfaceCL
);
categoryInstancesPageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier({
        catID: data.getFromAncestor("entID"),
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});


export var entityRatingsPageCL = new ContentLoader(
    "EntityRatingsPage",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant categories</h4>' +
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
    let sg1 = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "#54|#" + data.entID,
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    let sg2 = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "#52|#" + data.typeID,
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.setGenerator = new MaxRatingSetCombiner([sg1, sg2]);
    data.initialNum = 50;
    data.incrementNum = 50;
});
entityRatingsPageCL.addCallback("data", function(data) {
    data.instID = data.getFromAncestor("columnEntityID");
    data.copyFromAncestor("queryUserID");
});




export var submitTemplateInstancePageCL = new ContentLoader(
    "SubmitTemplateInstancePage",
    /* Initial HTML template */
    '<div>' +
        '<<SubmitDerivedEntityField>>' +
        '<<RelevantCategoriesField>>' +
        '<<RelevantPropertiesField>>' +
        '<<RelevantListsField>>' +
    '</div>',
    sdbInterfaceCL
);



export var submitDerivedEntityFieldCL = new ContentLoader(
    "SubmitDerivedEntityField",
    /* Initial HTML template */
    '<<SubmitEntityField>>',
    sdbInterfaceCL
);
submitDerivedEntityFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("tmplID");
});


export var relevantCategoriesFieldCL = new ContentLoader(
    "RelevantCategoriesField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant categories for derived entities</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantCategoriesFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("tmplID");
});
relevantCategoriesFieldCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "Relevant categories for derived entities|#" + data.tmplID,
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});


export var relevantPropertiesFieldCL = new ContentLoader(
    "RelevantPropertiesField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant properties for derived entities</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantPropertiesFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("tmplID");
});
relevantPropertiesFieldCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "Relevant properties for derived entities|#" + data.tmplID,
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});

export var relevantListsFieldCL = new ContentLoader(
    "RelevantListsField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant lists for derived entities</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantListsFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("tmplID");
});
relevantListsFieldCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "Relevant lists for derived entities|#" + data.tmplID,
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});


export var submitCategoryInstancePageCL = new ContentLoader(
    "EntitySubmitInstancePage",
    /* Initial HTML template */
    '<div>' +
        '<<SubmitInstanceField>>' +
    '</div>',
    sdbInterfaceCL
);




export var entityInfoPageCL = new ContentLoader(
    "EntityInfoPage",
    /* Initial HTML template */
    '<div>' +
        '<h3>One-to-one properties</h3>' +
        '<<SetDisplay data.propsData>>' +
        '<h3>One-to-many properties</h3>' +
        '<<SetDisplay data.listsData>>' +
    '</div>',
    sdbInterfaceCL
);
entityInfoPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "tmplID",
    ]);
});
entityInfoPageCL.addCallback("data", function(data) {
    // Relevant properties:
    data.propsData = {elemContentKey: "SemanticPropertyElement"};
    let propSG1 = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "Relevant properties|#" + data.entID,
        queryUserID: 9,
        inputUserID: 9,
        num: 100,
        ratingLo: 0,
        ratingHi: 0,
    });
    let propSG2 = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "Relevant properties for derived entities|#" + data.tmplID,
        queryUserID: 9,
        inputUserID: 9,
        num: 100,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.propsData.setGenerator = new MaxRatingSetCombiner([propSG1, propSG2]);
    data.propsData.initialNum = 1;
    data.propsData.incrementNum = 1;
    // Relevant lists:
    data.listsData = {elemContentKey: "SemanticListElement"};
    let listSG1 = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "Relevant lists|#" + data.entID,
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    let listSG2 = new SetQuerier({
        catTmplID: 21, // ID of the "<Property> of <Entity>" template.
        catStr: "Relevant lists for derived entities|#" + data.tmplID,
        queryUserID: 9,
        inputUserID: 9,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.listsData.setGenerator = new MaxRatingSetCombiner([listSG1, listSG2]);
    data.listsData.initialNum = 5;
    data.listsData.incrementNum = 10;
});
