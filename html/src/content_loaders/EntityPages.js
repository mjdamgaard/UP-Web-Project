
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
        '<div><<TemplateDisplay>></div>' +
         "<<PagesWithTabs data:wait>>" +
     '</div>',
    sdbInterfaceCL
);
entityPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "tmplID",  // optional.
    ]);
    data.columnEntityID = data.entID;
});
entityPageCL.addCallback(function($ci, data) {
    if (data.tmplID) {
        $ci.children('.CI.PagesWithTabs').trigger("load");
        return;
    };
    let reqData = {
        type: "ent",
        id: data.entID,
    };
    let $this = $(this);
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.entType = (result[0] ?? [""])[0];
        if (true) { // TODO: Branch according to type.
            data.tabAndPageDataArr = [
                ["Info", "EntityInfoPage", {}],
                ["Ratings", "EntityRatingsPage", {}],
                ["Categories", "EntityNounPredicatePage", {
                    predNoun: "Subcategories",
                }],
                ["Instances", "EntityNounPredicatePage", {
                    predNoun: "Instances",
                }],
                ["Applies to", "EntityAppliesToPage", {}],
                ["Related to", "EntityNounPredicatePage", {
                    predNoun: "Related entities",
                }],
                ["Supercategories", "EntityNounPredicatePage", {
                    predNoun: "Supercategories",
                }],
                ["Template", "EntityTemplatePage", {}],
                ["Submit instance", "EntitySubmitInstancePage", {}],
                // TODO: Implement the following two tabs as well.
                // ["Comments", "EntityCommentsPage", {}],
                // ["Discussions", "EntityDiscussionsPage", {}],
            ];
            data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                "Categories";
            $ci.children('.CI.PagesWithTabs').trigger("load");
            return;
        }
        // TODO: Implement the other cases.
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


export var entityNounPredicatePageCL = new ContentLoader(
    "EntityNounPredicatePage",
    /* Initial HTML template */
    '<<SetDisplay>>',
    sdbInterfaceCL
);
entityNounPredicatePageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "predNoun",
        "entID",  // optional.
    ]);
});
entityNounPredicatePageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier({
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: data.predNoun + "|#" + data.entID,
        queryUserID: 11,
        inputUserID: 11,
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


export var entityAppliesToPageCL = new ContentLoader(
    "EntityAppliesToPage",
    /* Initial HTML template */
    '<<SetDisplay>>',
    sdbInterfaceCL
);
entityAppliesToPageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier({
        predID: data.getFromAncestor("entID"),
        queryUserID: 11,
        inputUserID: 11,
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
        '<h4>Relevant predicates</h4>' +
        '<<SetDisplay data.predData>>' +
        '<h4>Relevant categories</h4>' +
        '<<SetDisplay data.catData>>' +
    '</div>',
    sdbInterfaceCL
);
entityRatingsPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "tmplID",
    ]);
});
entityRatingsPageCL.addCallback("data", function(data) {
    // Relevant predicates:
    data.predData = {elemContentKey: "RatingElement"};
    let sg1 = new SetQuerier({
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant ratings|#" + data.entID,
        queryUserID: 11,
        inputUserID: 11,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    let sg2 = new SetQuerier({
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant ratings for derived entities|#" + data.tmplID,
        queryUserID: 11,
        inputUserID: 11,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.predData.setGenerator = new MaxRatingSetCombiner([sg1, sg2]);
    data.predData.initialNum = 50;
    data.predData.incrementNum = 50;
        // Relevant categories:
    data.catData = {elemContentKey: "RatingElement"};
    data.catData.setGenerator = new SetQuerier({
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant categories for derived entities|#" + data.tmplID,
        queryUserID: 11,
        inputUserID: 11,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.catData.initialNum = 50;
    data.catData.incrementNum = 50;
});
entityRatingsPageCL.addCallback("data", function(data) {
    data.subjID = data.getFromAncestor("columnEntityID");
    data.copyFromAncestor("queryUserID");
});




export var entityTemplatePageCL = new ContentLoader(
    "EntityTemplatePage",
    /* Initial HTML template */
    '<div>' +
        '<h3><<TemplateDisplay>></h3>' +
        '<<SubmitDerivedEntityField>>' +
        '<<RelevantPredicatesField>>' +
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


export var relevantPredicatesFieldCL = new ContentLoader(
    "RelevantPredicatesField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant ratings for derived entities</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantPredicatesFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("tmplID");
});
relevantPredicatesFieldCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralEntityElement";
    data.setGenerator = new SetQuerier({
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant ratings for derived entities|#" + data.tmplID,
        queryUserID: 11,
        inputUserID: 11,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
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
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant categories for derived entities|#" + data.tmplID,
        queryUserID: 11,
        inputUserID: 11,
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
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant properties for derived entities|#" + data.tmplID,
        queryUserID: 11,
        inputUserID: 11,
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
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant lists for derived entities|#" + data.tmplID,
        queryUserID: 11,
        inputUserID: 11,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});


export var entitySubmitInstancePageCL = new ContentLoader(
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
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant properties|#" + data.entID,
        queryUserID: 11,
        inputUserID: 11,
        num: 100,
        ratingLo: 0,
        ratingHi: 0,
    });
    let propSG2 = new SetQuerier({
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant properties for derived entities|#" + data.tmplID,
        queryUserID: 11,
        inputUserID: 11,
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
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant lists|#" + data.entID,
        queryUserID: 11,
        inputUserID: 11,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    let listSG2 = new SetQuerier({
        predTmplID: 12, // ID of the "is an important/useful inst..." template.
        predStr: "Relevant lists for derived entities|#" + data.tmplID,
        queryUserID: 11,
        inputUserID: 11,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.listsData.setGenerator = new MaxRatingSetCombiner([listSG1, listSG2]);
    data.listsData.initialNum = 5;
    data.listsData.incrementNum = 10;
});
