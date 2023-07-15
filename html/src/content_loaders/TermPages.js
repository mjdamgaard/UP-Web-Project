
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";
import {
    SetQuerier, SetCombiner, MaxRatingSetCombiner,
} from "/src/content_loaders/SetLists.js";




export var termPageCL = new ContentLoader(
    "TermPage",
    /* Initial HTML template */
    '<div>' +
        '<h2><<TermTitle>></h2>' +
        '<span class="full-title">Full title: <<FullTermTitle>></span>' +
        '<div><<TermIDDisplay>></div>' +
        '<div><<ContextDisplay>></div>' +
         "<<PagesWithTabs data:wait>>" +
     '</div>',
    sdbInterfaceCL
);
termPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "termID",
        "cxtID",  // optional.
    ]);
    data.columnTermID = data.termID;
});
termPageCL.addCallback(function($ci, data) {
    if (data.cxtID) {
        $ci.children('.CI.PagesWithTabs').trigger("load");
        return;
    };
    let reqData = {
        type: "term",
        id: data.termID,
    };
    let $this = $(this);
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.cxtID = (result[0] ?? [])[0] ?? 1;
        if (data.cxtID == 1 || data.cxtID > 5) {
            data.tabAndPageDataArr = [
                ["Info", "TermInfoPage", {}],
                ["Ratings", "TermRatingsPage", {}],
                ["Categories", "TermNounPredicatePage", {
                    predNoun: "Subcategories",
                }],
                ["Applies to", "TermAppliesToPage", {}],
                ["Related to", "TermNounPredicatePage", {
                    predNoun: "Related terms",
                }],
                ["Supercategories", "TermNounPredicatePage", {
                    predNoun: "Supercategories",
                }],
                ["Context", "TermContextPage", {}],
                ["Submit instance", "TermSubmitInstancePage", {}],
                // TODO: Implement the following two tabs as well.
                // ["Comments", "TermCommentsPage", {}],
                // ["Discussions", "TermDiscussionsPage", {}],
            ];
            data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                "Applies to";
            $ci.children('.CI.PagesWithTabs').trigger("load");
            return;
        }
        // TODO: Implement the other cases.
    });
});

export var termIDDisplayCL = new ContentLoader(
    "TermIDDisplay",
    /* Initial HTML template */
    '<span>ID: </span>',
    sdbInterfaceCL
);
termIDDisplayCL.addCallback(function($ci, data) {
    $ci.append('#' + data.getFromAncestor("termID"));
});


export var termNounPredicatePageCL = new ContentLoader(
    "TermNounPredicatePage",
    /* Initial HTML template */
    '<<SetDisplay>>',
    sdbInterfaceCL
);
termNounPredicatePageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "predNoun",
        "termID",  // optional.
    ]);
});
termNounPredicatePageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setGenerator = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: data.predNoun + "|#" + data.termID,
        queryUserID: 3,
        inputUserID: 3,
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


export var termAppliesToPageCL = new ContentLoader(
    "TermAppliesToPage",
    /* Initial HTML template */
    '<<SetDisplay>>',
    sdbInterfaceCL
);
termAppliesToPageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setGenerator = new SetQuerier({
        predID: data.getFromAncestor("termID"),
        queryUserID: 3,
        inputUserID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});


export var termRatingsPageCL = new ContentLoader(
    "TermRatingsPage",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant predicates</h4>' +
        '<<SetDisplay data.predData>>' +
        '<h4>Relevant categories</h4>' +
        '<<SetDisplay data.catData>>' +
    '</div>',
    sdbInterfaceCL
);
termRatingsPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "termID",
        "cxtID",
    ]);
});
termRatingsPageCL.addCallback("data", function(data) {
    // Relevant predicates:
    data.predData = {elemContentKey: "RatingElement"};
    let sg1 = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant ratings|#" + data.termID,
        queryUserID: 3,
        inputUserID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    let sg2 = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant ratings for derived terms|#" + data.cxtID,
        queryUserID: 3,
        inputUserID: 3,
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
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant categories for derived terms|#" + data.cxtID,
        queryUserID: 3,
        inputUserID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.catData.initialNum = 50;
    data.catData.incrementNum = 50;
});
termRatingsPageCL.addCallback("data", function(data) {
    data.subjID = data.getFromAncestor("columnTermID");
    data.copyFromAncestor("queryUserID");
});




export var termContextPageCL = new ContentLoader(
    "TermContextPage",
    /* Initial HTML template */
    '<div>' +
        '<h3><<ContextDisplay>></h3>' +
        '<<SubmitDerivedTermField>>' +
        '<<RelevantPredicatesField>>' +
        '<<RelevantCategoriesField>>' +
        '<<RelevantPropertiesField>>' +
        '<<RelevantListsField>>' +
    '</div>',
    sdbInterfaceCL
);



export var submitDerivedTermFieldCL = new ContentLoader(
    "SubmitDerivedTermField",
    /* Initial HTML template */
    '<<SubmitTermField>>',
    sdbInterfaceCL
);
submitDerivedTermFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("cxtID");
});


export var relevantPredicatesFieldCL = new ContentLoader(
    "RelevantPredicatesField",
    /* Initial HTML template */
    '<div>' +
        '<h4>Relevant ratings for derived terms</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantPredicatesFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("cxtID");
});
relevantPredicatesFieldCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setGenerator = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant ratings for derived terms|#" + data.cxtID,
        queryUserID: 3,
        inputUserID: 3,
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
        '<h4>Relevant categories for derived terms</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantCategoriesFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("cxtID");
});
relevantCategoriesFieldCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setGenerator = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant categories for derived terms|#" + data.cxtID,
        queryUserID: 3,
        inputUserID: 3,
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
        '<h4>Relevant properties for derived terms</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantPropertiesFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("cxtID");
});
relevantPropertiesFieldCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setGenerator = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant properties for derived terms|#" + data.cxtID,
        queryUserID: 3,
        inputUserID: 3,
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
        '<h4>Relevant lists for derived terms</h4>' +
        '<<SetDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
relevantListsFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("cxtID");
});
relevantListsFieldCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setGenerator = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant lists for derived terms|#" + data.cxtID,
        queryUserID: 3,
        inputUserID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});


export var termSubmitInstancePageCL = new ContentLoader(
    "TermSubmitInstancePage",
    /* Initial HTML template */
    '<div>' +
        '<<SubmitInstanceField>>' +
    '</div>',
    sdbInterfaceCL
);




export var termInfoPageCL = new ContentLoader(
    "TermInfoPage",
    /* Initial HTML template */
    '<div>' +
        '<h3>One-to-one properties</h3>' +
        '<<SetDisplay data.propsData>>' +
        '<h3>One-to-many properties</h3>' +
        '<<SetDisplay data.listsData>>' +
    '</div>',
    sdbInterfaceCL
);
termInfoPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "termID",
        "cxtID",
    ]);
});
termInfoPageCL.addCallback("data", function(data) {
    // Relevant properties:
    data.propsData = {elemContentKey: "SemanticPropertyElement"};
    let propSG1 = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant properties|#" + data.termID,
        queryUserID: 3,
        inputUserID: 3,
        num: 100,
        ratingLo: 0,
        ratingHi: 0,
    });
    let propSG2 = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant properties for derived terms|#" + data.cxtID,
        queryUserID: 3,
        inputUserID: 3,
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
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant lists|#" + data.termID,
        queryUserID: 3,
        inputUserID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    let listSG2 = new SetQuerier({
        predCxtID: 6, // ID of the "is an important/useful inst..." Context.
        predStr: "Relevant lists for derived terms|#" + data.cxtID,
        queryUserID: 3,
        inputUserID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.listsData.setGenerator = new MaxRatingSetCombiner([listSG1, listSG2]);
    data.listsData.initialNum = 5;
    data.listsData.incrementNum = 10;
});
