
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/SDBInterfaces.js";



export var ratingElementCL = new ContentLoader(
    "RatingElement",
    /* Initial HTML template */
    '<div>' +
        '<<TermTitle>>' +
        '<<RatingSlider data:wait>>' +
    '</div>',
    sdbInterfaceCL
);
ratingElementCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "queryUserID",
        "termID",
        "ratingSliderSubjID",
    ]);
});
ratingElementCL.addCallback(function($ci, data) {
    let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
    let reqData = {
        type: "rat",
        u: data.queryUserID,
        p: data.termID,
        s: data.ratingSliderSubjID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.initRatVal = (result[0] ?? [0])[0];
        $ci.children('.CI.RatingSlider').trigger("load");
    });
});



export var ratingSliderCL = new ContentLoader(
    "RatingSlider",
    /* Initial HTML template */
    '<div>' +
        '<input type="range" min="0.01" max="10.00" step="0.01"> value="5">' +
        '<button class="btn btn-default">Clear</button>' +
        '<button type="submit" class="btn btn-default">Submit</button>' +
    '</div>',
    sdbInterfaceCL
);
ratingSliderCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "initRatVal",
    ]);
});
ratingSliderCL.addCallback(function($ci, data) {
    $ci.find('input[type="range"]').attr("value", data.initRatVal);
});
