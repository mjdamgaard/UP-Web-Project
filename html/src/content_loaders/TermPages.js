
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/ColumnInterface.js";





export var termPageCL = new ContentLoader(
    "TermPage",
    /* Initial HTML template */
    '<div>' +
        '<h3><<TermTitle>></h3>' +
         "<<PagesWithTabs>>" +
     '</div>',
    sdbInterfaceCL
);
termPageCL.addCallback("data", function(data) {
    data.tabAndPageDataArr = [
        ["Info", "TermInfoPage", {}],
        ["Ratings", "TermRatingsPage", {}],
        ["Subcategories", "TermNounPredicatePage", {
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
        // TODO: Implement the following two tabs as well.
        // ["Comments", "TermCommentsPage", {}],
        // ["Discussions", "TermDiscussionsPage", {}],
    ];
    data.defaultTab = data.getFromAncestor("defaultTab", 1) ?? "Applies to";
});




export var termNounPredicatePageCL = new ContentLoader(
    "TermNounPredicatePage",
    /* Initial HTML template */
    '<<SetView>>',
    sdbInterfaceCL
);

termNounPredicatePageCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        // "elemContentKey",
    ]);
});
termNounPredicatePageCL.addCallback("data", function(data) {
    data.elemContentKey = "GeneralTermElement";
    data.setDataArr = [{
        predCxtID: 9, // ID of the ">is a useful instance of ..." Context.
        predStr: data.getFromAncestor("predNoun"),
        objID: data.getFromAncestor("termID"),
        userID: 5,
        weight: 1,
        ratTransFun: getLinearRatTransFun(1),
        queryParams: {
            num: 4000,
            ratingLo: "",
            ratingHi: "",
        },
    }];
    data.initialNum = 50;
    data.incrementNum = 25;
});

export function getLinearRatTransFun(factor) {
    return function(ratValHex) {
        let num = parseInt(ratValHex.substring(0, 4), 16);
        if (ratValHex.length <= 2) {
            num *= 65535 / 255;
        }
        // TODO: Reconsider what should be the standard score range. 0-10? -5-5?
        let score = (num - 32767.5) * 20 / 65535;
        return factor * score;
    };
}
