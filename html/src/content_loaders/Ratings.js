
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
ratingSliderCL.addCallback(function($ci, data) {

});
