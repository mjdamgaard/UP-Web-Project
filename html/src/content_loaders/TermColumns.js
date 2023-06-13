
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";





export var termColumnCL = new ContentLoader(
    "TermColumn",
    /* Initial HTML template */
    '<<AppColumn>>',
    sdbInterfaceCL
);
termColumnCL.addCallback("append",
    '<h3><<TermTitle>></h3>' +
     "<<PagesWithTabs>>"
);
termColumnCL.addCallback("data", function(data) {
    data.tabAndPageDataArr = [
        ["Subcategories", "TermNavigationSetPage", {
            predNoun: "Subcategories",
        }],
        ["Instances", "TermNavigationSetPage", {
            predNoun: "Instances",
        }],
    ];
    data.defaultTab = data.getFromAncestor("defaultTab", 1) ?? "Subcategories";
});
