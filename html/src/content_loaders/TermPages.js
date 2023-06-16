
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
    data.elemContentKey = "TermElement";
    data.copyFromAncestor("defaultUserWeightArr");
    data.predSetDataArr = [{
        predCxtID: 9, // ID of the ">is a useful instance of ..." Context.
        predStr: data.getFromAncestor("predNoun"),
        objID: data.getFromAncestor("termID"),
    }];
    data.defaultQueryNum = 4000;
    data.defaultRatingLo = "";
    data.initialNum = 50;
    data.incrementNum = 25;
});
