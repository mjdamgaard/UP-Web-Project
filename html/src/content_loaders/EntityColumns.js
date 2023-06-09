
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
    '.CI.ColumnHeader',
    "<<TermHeaderContent>>"
);
termColumnCL.addCallback("append",
    '.CI.ColumnMain',
    "<<TermMainContent>>"
);

export var termHeaderContentCL = new ContentLoader(
    "TermHeaderContent",
    /* Initial HTML template */
    '<div>' +
        '<h3><<TermTitle>></h3>' +
    '</div>',
    appColumnCL,
);


export var termMainContentCL = new ContentLoader(
    "TermMainContent",
    /* Initial HTML template */
    '<<PagesWithTabs>>',
    appColumnCL
);

termMainContentCL.addCallback("data", function(data) {
    data.tabAndPageDataArr = [
        ["Subcategories", "SubcategoriesPage", data],
        ["Instances", "InstancesPage", data],
    ];
    data.defaultTab = "Subcategories";
});
export var subcategoriesPageCL = new ContentLoader(
    "SubcategoriesPage",
    /* Initial HTML template */
    '<<TermSetPage>>',
    appColumnCL
);
subcategoriesPageCL.addCallback("data", function(data) {
    data.relID = "10"; // ID of the "Subcategories" Relation.
});
export var instancesPageCL = new ContentLoader(
    "InstancesPage",
    /* Initial HTML template */
    '<<TermSetPage>>',
    appColumnCL
);
instancesPageCL.addCallback("data", function(data) {
    data.relID = "13"; // ID of the "Instances" Relation.
});



export var termSetPageCL = new ContentLoader(
    "TermSetPage",
    /* Initial HTML template */
    '<div>' +
        '<<RelationSetField>>' +
    '</div>',
    appColumnCL
);
termSetPageCL.addCallback("data", function(data) {
    Object.assign(data, {
        elemContentKey: "TermElement",
        objID: data.getFromAncestor("termID"),
        subjType: "t",
        queryNum: 40000,
        userWeights: [{userID: 1, weight: 1}],
        initialNum: 50,
        incrementNum: 50,
    });
});
