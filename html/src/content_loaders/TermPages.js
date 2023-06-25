
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/SDBInterfaces.js";




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
    ]);
});
termPageCL.addCallback(function($ci, data) {
    let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
    let reqData = {
        type: "term",
        id: data.termID,
    };
    let $this = $(this);
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.cxtID = (result[0] ?? [])[0];
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
    '<<SetView>>',
    sdbInterfaceCL
);


termNounPredicatePageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setDataArr = [{
        predCxtID: 8, // ID of the ">is a useful instance of ..." Context.
        predStr: data.getFromAncestor("predNoun"),
        objID: data.getFromAncestor("termID"),
        userID: 3,
        weight: 1,
        ratTransFun: getStandardScore,
        queryParams: {
            num: 4000,
            ratingLo: 0,
            ratingHi: 0,
        },
    }];
    data.initialNum = 50;
    data.incrementNum = 50;
});

export function getStandardScore(ratVal) {
    return ratVal / 6553.5;
}



export var termAppliesToPageCL = new ContentLoader(
    "TermAppliesToPage",
    /* Initial HTML template */
    '<<SetView>>',
    sdbInterfaceCL
);
termAppliesToPageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setDataArr = [{
        predID: data.getFromAncestor("termID"),
        userID: 3,
        weight: 1,
        ratTransFun: getStandardScore,
        queryParams: {
            num: 4000,
            ratingLo: 0,
            ratingHi: 0,
        },
    }];
    data.initialNum = 50;
    data.incrementNum = 50;
});

export var termRatingsPageCL = new ContentLoader(
    "TermRatingsPage",
    /* Initial HTML template */
    '<<SetView data:wait>>',
    sdbInterfaceCL
);
termRatingsPageCL.addCallback(function($ci, data) {
    data.copyFromAncestor("termID");
    let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
    let reqData = {
        type: "term",
        id: data.termID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.cxtID = (result[0] ?? [])[0] ?? 6; // If Context is null, use
        // "Terms", id=6, as a substitute Context.
        data.elemContentKey = "RatingElement";
        data.setDataArr = [{
            predCxtID: 8, // ID of the ">is a useful instance of ..." Context.
            predStr: "Relevant ratings",
            objID: data.termID,
            userID: 3,
            weight: 1,
            ratTransFun: getStandardScore,
            queryParams: {
                num: 4000,
                ratingLo: 0,
                ratingHi: 0,
            }
        }, {
            predCxtID: 8, // ID of the ">is a useful instance of ..." Context.
            predStr: "Relevant ratings for derived terms",
            objID: data.cxtID,
            userID: 3,
            weight: 2,
            ratTransFun: getStandardScore,
            queryParams: {
                num: 4000,
                ratingLo: 0,
                ratingHi: 0,
            },
        }];
        data.initialNum = 50;
        data.incrementNum = 50;
        $ci.trigger("load");
    });
});
