
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
        ["Subcategories", "TermNavigationSetPage", {
            predNoun: "Subcategories",
        }],
        ["Instances", "TermNavigationSetPage", {
            predNoun: "Instances",
        }],
    ];
    data.defaultTab = data.getFromAncestor("defaultTab", 1) ?? "Subcategories";
});
