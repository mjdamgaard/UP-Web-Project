
import {
    DBRequestManager,
} from "/src/DBRequestManager.js";
import {
    ContentLoader,
} from "/src/ContentLoader.js";




export var sdbInterfaceCL = new ContentLoader(
    "ColumnBasedSDBInterface",
    /* Initial HTML template */
    '<div>' +
        '<<InterfaceHeader>>' +
        '<main>' +
            '<div class="left-margin"></div>' +
            '<div class="app-column-container">' +
                '<<AppColumn>>' +
            '</div>' +
            '<div class="right-margin"></div>' +
        '</main>' +
    '</div>',
);
export var dbReqManager = new DBRequestManager();

export var interfaceHeaderCL = new ContentLoader(
    "InterfaceHeader",
    /* Initial HTML template */
    '<header class="navbar navbar-default">' +
        '<div class="container-fluid">' +
                '<<SuperCoolLogoTBA>>' +
                '<span class="navbar-brand">openSDB</span>' +// will do for now.
            // '</div>' +
            '<<StartColumnButtonsContainer>>' +
            '<<AccountButtonsContainer>>' +
        '</div>' +
    '</header>',
    sdbInterfaceCL,
);

export var startColumnButtonsContainerCL = new ContentLoader(
    "StartColumnButtonsContainer",
    /* Initial HTML template */
    '<ul class="nav navbar-nav">' +
        '<li class="entities"><a href="#">' +
            'Entities' +
        '</a></li>' +
        // TODO: Add one or a few more.
    '</ul>',
    sdbInterfaceCL,
);

export var accountButtonsContainerCL = new ContentLoader(
    "AccountButtonsContainer",
    /* Initial HTML template */
    '<ul class="nav navbar-nav navbar-right">' +
        '<li class="log-in"><a href="#">' +
            '<span class="glyphicon glyphicon-log-in"></span> Sing in' +
        '</a></li>' +
        '<li class="new-account"><a href="#">' +
            '<span class="glyphicon glyphicon-user"></span> Sign up' +
        '</a></li>' +
        '<li class="log-out"><a href="#">' +
            '<span class="glyphicon glyphicon-log-out"></span> Sign out' +
        '</a></li>' +
    '</ul>',
    sdbInterfaceCL,
);
accountButtonsContainerCL.addCallback(function($ci, data) {
    if (typeof(Storage) === "undefined") {
        return;
    }
    if (!localStorage.session) {
        $ci.children('.log-out').hide();
    } else {
        if (localStorage.session.expTime > Date.now()) {
            $ci.children('.log-out').hide();
        } else {
            $ci.children('.log-in, .new-account').hide();
        }
    }
});
accountButtonsContainerCL.addCallback(function($ci, data) {
    $ci.children('.log-in').on("click", function() {
        $(this).trigger("log-in");
        return false;
    });
    $ci.children('.new-account').on("click", function() {
        $(this).trigger("new-account");
        return false;
    });
    $ci.children('.log-out').on("click", function() {
        $(this).trigger("log-out");
        return false;
    });
});

sdbInterfaceCL.addCallback(function($ci, data) {
    $ci.on("log-in", function() {
        // TODO: Implement.
        return false;
    });
    $ci.on("new-account", function() {
        // TODO: Implement.
        return false;
    });
    $ci.on("log-out", function() {
        // TODO: Implement.
        dbReqManager;
        return false;
    });
});







export var appColumnCL = new ContentLoader(
    "AppColumn",
    /* Initial HTML template */
    '<div>' +
        '<<ColumnButtonContainer>>' +
        '<<SelfReplacer>>' +
    '</div>',
    sdbInterfaceCL,
);




export var columnButtonContainerCL = new ContentLoader(
    "ColumnButtonContainer",
    /* Initial HTML template */
    '<div>' +
        // '<<PinButton>>' +
        '<<CloseButton>>' +
    '<div>',
    sdbInterfaceCL,
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




/* Events to open new app columns */

// make Columns handle the "open-column" events coming from inside them, add a
// close event, and make the Columns turn themselves non-overwritable on first
// click interaction with them.
appColumnCL.addCallback(function($ci) {
    $ci.on("open-column", function(event, contentKey, data, dir) {
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
    });
    $ci.on("close", function() {
        $(this).remove();
        return false;
    });
});




/* A List CL that automatically loads a list of child CIs */

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
