
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/ColumnInterface.js";




export var termElementCL = new ContentLoader(
    "TermElement",
    /* Initial HTML template */
    '<div>' +
        'test..' +
    '</div>',
    sdbInterfaceCL
);
