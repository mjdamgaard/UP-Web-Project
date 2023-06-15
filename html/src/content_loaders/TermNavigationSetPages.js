
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/ColumnInterface.js";



export var termNavigationSetPageCL = new ContentLoader(
    "TermNavigationSetPage",
    /* Initial HTML template */
    '<<SetView>>',
    sdbInterfaceCL
);
termNavigationSetPageCL.addCallback("data", function(data) {
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

export var termNavigationSetElementCL = new ContentLoader(
    "TermElement",
    /* Initial HTML template */
    '<div>' +
        'test..' +
    '</div>',
    sdbInterfaceCL
);
