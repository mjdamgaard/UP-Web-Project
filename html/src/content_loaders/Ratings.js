
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
        '<<RatingDisplay>>' +
    '</div>',
    sdbInterfaceCL
);
ratingElementCL.addCallback("data", function(data) {
    data.predID = data.getFromAncestor("termID");
    data.copyFromAncestor("subjID");
});

export var ratingDisplayCL = new ContentLoader(
    "RatingDisplay",
    /* Initial HTML template */
    '<div>' +
        '<<TermTitle>>' +
        '<<QueryUserRatingDisplay data:wait>>' +
        '<<InputRatingSlider data:wait>>' +
    '</div>',
    sdbInterfaceCL
);
ratingDisplayCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "queryUserID",
        "inputUserID",
        "predID",
        "subjID",
    ]);
    data.termID = data.predID;
});
ratingDisplayCL.addCallback(function($ci, data) {
    let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
    let reqData = {
        type: "rat",
        u: data.queryUserID,
        p: data.predID,
        s: data.subjID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.queryUserRatVal = (result[0] ?? [0])[0];
        $ci.find('.CI.QueryUserRatingDisplay').trigger("load");
    });
    reqData = {
        type: "rat",
        u: data.inputUserID,
        p: data.predID,
        s: data.subjID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.prevInputRatVal = (result[0] ?? [0])[0];
        $ci.find('.CI.InputRatingSlider').trigger("load");
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
    if (ratVal) {
        $ci.html((ratVal / 6553.5).toFixed(2));
    } else {
        $ci.html("no rating");
    }
});



export var inputRatingSliderCL = new ContentLoader(
    "InputRatingSlider",
    /* Initial HTML template */
    '<div>' +
        '<input type="range" min="0.01" max="10.00" step="0.01" value="5">' +
        '<div class="value-display"></div>' +
        '<div class="button-container">' +
            '<button class="btn btn-default clear">Clear</button>' +
            '<button class="btn btn-default submit">Submit</button>' +
        '</div>' +
    '</div>',
    sdbInterfaceCL
);
inputRatingSliderCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "prevInputRatVal",
        "inputUserID",
        "predID".
        "subjID",
    ]);
});
inputRatingSliderCL.addCallback(function($ci, data) {
    let prevInputRatVal = data.prevInputRatVal;
    if (prevInputRatVal) { // value cannot be 0 (only null or positive).
        let sliderVal = (prevInputRatVal / 6553.5).toFixed(2);
        $ci.find('input[type="range"]').val(sliderVal);
        $ci.find('.value-display').html(sliderVal);
    } else {
        $ci.find('button.clear').hide();
    }
    $ci.find('button.submit').hide();
});
inputRatingSliderCL.addCallback(function($ci, data) {
    $ci.find('button.clear').on("click", function() {
        let $ci = $(this).closest('.CI.InputRatingSlider');
        let data = $ci.data("data");
        if (data.prevInputRatVal) {
            let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
            let reqData = {
                type: "rat",
                u: data.inputUserID,
                p: data.predID,
                s: data.subjID,
                r: 0,
                l: "00"
            };
            dbReqManager.input($ci, reqData, data, function($ci, result, data) {
                $ci.find('input[type="range"]').attr("value", 5);
                $ci.find('button.clear').hide();
            });
        }
        return false;
    });
    $ci.find('input[type="range"]').one("change input", function() {
        let $this = $(this);
        let $ci = $this.closest('.CI.InputRatingSlider');
        $ci.find('button.submit').show().on("click", function() {
            let $ci = $(this).closest('.CI.InputRatingSlider');
            let data = $ci.data("data");
            let inputRatVal = Math.round(
                $ci.find('input[type="range"]').val() * 6553.5
            );
            let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
            let reqData = {
                type: "rat",
                u: data.inputUserID,
                p: data.predID,
                s: data.subjID,
                r: inputRatVal,
                l: "00"
            };
            dbReqManager.input($ci, reqData, data, function($ci, result, data) {
                $ci.find('button.clear').show();
            });
            return false;
        });
        $this.on("change input", function() {
            let $this = $(this);
            let sliderVal = $this.val();
            let $ci = $this.closest('.CI.InputRatingSlider');
            $ci.find('.value-display').html(sliderVal);
            $ci.find('button.clear').hide();
            return false;
        });
        $ci.trigger("input");
        return false;
    });
});
