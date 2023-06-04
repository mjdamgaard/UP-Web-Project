
import {
    DBRequestManager,
} from "/src/DBRequestManager.js";
import {
    ContentLoader,
} from "/src/ContentLoader.js";



// Note that exporting modules can rename the variable names, but not (really)
// the content keys.
export var sdbInterfaceCL = new ContentLoader(
    "ColumnBasedSDBInterface",
    /* Initial HTML template */
    '<div>' +
        '<<ColumnInterfaceHeader>>' +
        '<main>' +
            '<div class="left-margin"></div>' +
            '<<AppColumnList>>' +
            '<div class="right-margin"></div>' +
        '</main>' +
    '</div>',
);
sdbInterfaceCL.dynamicData.dbReqManager = new DBRequestManager();

export var appColumnListCL = new ContentLoader(
    "AppColumnList",
    /* Initial HTML template */
    '<<List>>',
    sdbInterfaceCL
);

export var listCL = new ContentLoader(
    "List",
    /* Initial HTML template */
    '<div>' +
        '<<SelfReplacer data.listElemDataArr[...]>>' +
    '</div>',
    sdbInterfaceCL
);
listCL.addCallback("data", function(data) {
    data.copyFromAncestor("listElemDataArr");
});
export var selfReplacerCL = new ContentLoader(
    "SelfReplacer",
    /* Initial HTML template */
    '<template></template>',
    sdbInterfaceCL
);
selfReplacerCL.addCallback("data", function(data) {
    data.copyFromAncestor("cl");
});
selfReplacerCL.addCallback(function($ci, data, childReturnData, returnData) {
    data.cl.loadReplaced($ci, "self", data.data ?? data, returnData);
});

appColumnListCL.addCallback("data", function(data) {
    data.listElemDataArr = data.getFromAncestor("columnSpecs");
});

export var columnInterfaceHeaderCL = new ContentLoader(
    "ColumnInterfaceHeader",
    /* Initial HTML template */
    '<header>' +
    '</header>',
    sdbInterfaceCL,
);
export var appColumnCL = new ContentLoader(
    "AppColumn",
    /* Initial HTML template */
    '<div>' +
        '<<ColumnHeader>>' +
        '<<ColumnMain>>' +
    '</div>',
    sdbInterfaceCL,
);

export var columnHeaderCL = new ContentLoader(
    "ColumnHeader",
    /* Initial HTML template */
    '<div>' +
        '<<ColumnButtonContainer>>' +
    '</div>',
    appColumnCL,
);
export var columnButtonContainerCL = new ContentLoader(
    "ColumnButtonContainer",
    /* Initial HTML template */
    '<div>' +
        // '<<PinButton>>' +
        '<<CloseButton>>' +
    '<div>',
    columnHeaderCL,
);
export var closeButtonCL = new ContentLoader(
    "CloseButton",
    /* Initial HTML template */
    '<button type="button" class="close">' +
        '<span>&times;</span>' +
    '</button>',
    sdbInterfaceCL,
);
closeButtonCL.addCallback(function($ci) {
    $ci.on("click", function() {
        $(this).trigger("close");
        return false;
    });
});
export var columnMainCL = new ContentLoader(
    "ColumnMain",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    appColumnCL,
);




/* Events to open new app columns */

// make Columns handle the "open-column" events coming from inside them, add a
// close event, and make the Columns turn themselves non-overwritable on first
// click interaction with them.
appColumnCL.addCallback(function($ci) {
    $ci
        .on("open-column", function(
            event, contentKey, data, dir
        ) {
            let $this = $(this);
            if (dir === "right") {
                // TODO: Add a lookup to a variable deciding if the existing
                // column should be removed or not.
                let $existingColumn = $this.next('.CI.AppColumn').remove();
                sdbInterfaceCL.loadAfter($this, contentKey, data);
            } else if (dir === "left") {
                // TODO: Add a lookup to another variable deciding if the
                // existing column should be removed or not.
                let $existingColumn = $this.prev('.CI.AppColumn').remove();
                sdbInterfaceCL.loadBefore($this, contentKey, data);
            }
            return false;
        })
        .on("close", function() {
            $(this).remove();
            return false;
        });
});
