
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";





export var entityColumnCL = new ContentLoader(
    "EntityColumn",
    /* Initial HTML template */
    '<<AppColumn>>',
    sdbInterfaceCL
);
entityColumnCL.addCallback("append",
    '.CI.ColumnHeader',
    "<<EntityHeaderContent>>"
);
entityColumnCL.addCallback("append",
    '.CI.ColumnMain',
    "<<EntityMainContent>>"
);

export var entityHeaderContentCL = new ContentLoader(
    "EntityHeaderContent",
    /* Initial HTML template */
    '<div>' +
        '<h3><<EntityTitle>></h3>' +
    '</div>',
    appColumnCL,
);


export var entityMainContentCL = new ContentLoader(
    "EntityMainContent",
    /* Initial HTML template */
    '<<PagesWithTabs>>',
    appColumnCL
);

entityMainContentCL.addCallback("data", function(data) {
    data.copyFromAncestor("entityType")
    if (data.entityType === "t") {
        data.tabAndPageDataArr = [
            ["Subcategories", "SubcategoriesPage", data],
            ["Instances", "InstancesPage", data],
        ];
        data.defaultTab = "Subcategories";
    }
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
        objType: "t", // the Subcategories page is only for Term Columns.
        objID: data.getFromAncestor("entityID"),
        subjType: "t",
        queryNum: 40000,
        userWeights: [{userID: 1, weight: 1}],
        initialNum: 50,
        incrementNum: 50,
    });
});
