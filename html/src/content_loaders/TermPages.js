
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/SDBInterfaces.js";
import {
    SetQuerier, SetCombiner, MaxRatingSetCombiner,
} from "/src/content_loaders/SetLists.js";




export var termPageCL = new ContentLoader(
    "TermPage",
    /* Initial HTML template */
    '<div>' +
        '<h3><<TermTitle>></h3>' +
         "<<PagesWithTabs data:wait>>" +
     '</div>',
    sdbInterfaceCL
);
termPageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "termID",
        "cxtID",  // optional.
    ]);
});
termPageCL.addCallback(function($ci, data) {
    if (data.cxtID) {
        $ci.children('.CI.PagesWithTabs').trigger("load");
        return;
    };
    let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
    let reqData = {
        type: "term",
        id: data.termID,
    };
    let $this = $(this);
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.cxtID = (result[0] ?? [])[0] ?? 6;
        if (!data.cxtID || data.cxtID > 5) {
            data.tabAndPageDataArr = [
                ["Info", "TermInfoPage", {}],
                ["Ratings", "TermRatingsPage", {}],
                ["Categories", "TermNounPredicatePage", {
                    predNoun: "Subcategories",
                }],
                ["Instances", "TermAppliesToPage", {}],
                ["Related to", "TermNounPredicatePage", {
                    predNoun: "Related terms",
                }],
                ["Supercategories", "TermNounPredicatePage", {
                    predNoun: "Supercategories",
                }],
                ["Context", "TermContextPage", {}],
                // TODO: Implement the following two tabs as well.
                // ["Comments", "TermCommentsPage", {}],
                // ["Discussions", "TermDiscussionsPage", {}],
            ];
            data.defaultTab = data.getFromAncestor("defaultTab", 1) ??
                "Categories";
            $ci.children('.CI.PagesWithTabs').trigger("load");
            return;
        }
        // TODO: Implement other cases.
    });
});


export var termNounPredicatePageCL = new ContentLoader(
    "TermNounPredicatePage",
    /* Initial HTML template */
    '<<SetDisplay>>',
    sdbInterfaceCL
);


termNounPredicatePageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setGenerator = new SetQuerier({
        predCxtID: 8, // ID of the ">is a useful instance of ..." Context.
        predStr: data.getFromAncestor("predNoun"),
        objID: data.getFromAncestor("termID"),
        userID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.initialNum = 50;
    data.incrementNum = 50;
});



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
        userID: 3,
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
    '<<SetDisplay>>',
    sdbInterfaceCL
);
termRatingsPageCL.addCallback("data", function(data) {
    data.elemContentKey = "RatingElement";
    let sg1 = new SetQuerier({
        predCxtID: 8, // ID of the ">is a useful instance of ..." Context.
        predStr: "Relevant ratings",
        objID: data.getFromAncestor("termID"),
        userID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    let sg2 = new SetQuerier({
        predCxtID: 8, // ID of the ">is a useful instance of ..." Context.
        predStr: "Relevant ratings for derived terms",
        objID: data.getFromAncestor("cxtID"),
        userID: 3,
        num: 4000,
        ratingLo: 0,
        ratingHi: 0,
    });
    data.setGenerator = new MaxRatingSetCombiner([sg1, sg2]);
    data.initialNum = 50;
    data.incrementNum = 50;
});
termRatingsPageCL.addCallback("data", function(data) {
    data.ratingSliderSubjID = data.getFromAncestor("termID");
    data.copyFromAncestor("queryUserID");
});
