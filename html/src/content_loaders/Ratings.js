
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
        '<<QueryUserRatingDisplay data:wait>>' +
        '<<InputRatingSlider data:wait>>' +
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
        data.queryUserRatVal = (result[0] ?? [0])[0];
        $ci.find('.CI.QueryUserRatingDisplay').trigger("load");
    });
    reqData = {
        type: "rat",
        u: data.inputUserID,
        p: data.termID,
        s: data.ratingSliderSubjID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.prevInputRatVal = (result[0] ?? [0])[0];
        $ci.find('.CI.RatingSlider').trigger("load");
    });
});


export var queryUserRatingDisplayCL = new ContentLoader(
    "QueryUserRatingDisplay",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    sdbInterfaceCL
);
queryUserRatingDisplayCL.addCallback(function($ci, data) {
    let ratVal = data.getFromAncestor("queryUserRatVal");
    $ci.html((ratVal / 6553.5).toFixed(2));
});



export var inputRatingSliderCL = new ContentLoader(
    "InputRatingSlider",
    /* Initial HTML template */
    '<div>' +
        '<input type="range" min="0.01" max="10.00" step="0.01"> value="5">' +
        '<div class="button-container">' +
            '<button class="btn btn-default">Clear</button>' +
            '<button type="submit" class="btn btn-default">Submit</button>' +
        '</div>' +
    '</div>',
    sdbInterfaceCL
);
inputRatingSliderCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "prevInputRatVal",
    ]);
    data.sliderHasBeenChanged = false;
});
inputRatingSliderCL.addCallback(function($ci, data) {
    let prevInputRatVal = data.prevInputRatVal;
    if (prevInputRatVal) { // ratVal cannot be 0 (only null or positive).
        data.hasPrevRatVal = true;
        $ci.find('input[type="range"]').attr(
            "value", (initRatVal / 6553.5).toFixed(2)
        );
    } else {
        data.hasPrevRatVal = false;
        // $ci.find('input[type="range"]').attr("value", "5");
    }
});
