
import {
    DBRequestManager,
} from "/src/DBRequestManager.js";
import {
    AccountManager,
} from "/src/AccountManager.js";
import {
    ContentLoader, DataNode
} from "/src/ContentLoader.js";



export var dbReqManager = new DBRequestManager();
export var accountManager = new AccountManager();


export var sdbInterfaceCL = new ContentLoader(
    "ColumnBasedSDBInterface",
    /* Initial HTML template */
    '<div>' +
        '<<InterfaceHeader>>' +
        '<main>' +
            '<div class="left-margin"><br><span>&#10094;</span><br></div>' +
            '<<AppColumnContainer>>' +
            '<div class="right-margin"><br><span>&#10095;</span><br></div>' +
        '</main>' +
        '<div class="overlay-page-container"></div>' +
    '</div>',
);
sdbInterfaceCL.addCallback(function($ci, data) {
    $ci.children('.overlay-page-container').hide();
    $ci.on("log-in", function() {
        let $this = $(this);
        let $obj = $this.children('.overlay-page-container');
        $obj.empty();
        sdbInterfaceCL.loadAppended($obj, "LoginPage", data);
        $this.children('main').hide();
        $obj.show();
        return false;
    });
    $ci.on("new-account", function() {
        let $this = $(this);
        let $obj = $this.children('.overlay-page-container');
        $obj.empty();
        sdbInterfaceCL.loadAppended($obj, "CreateAccountPage", data);
        $this.children('main').hide();
        $obj.show();
        return false;
    });
    $ci.on("back-to-main", function() {
        let $this = $(this);
        let $obj = $this.children('.overlay-page-container');
        $obj.hide().empty();
        $this.children('main').show();
        return false;
    });
    $ci.on("logged-in", function() {
        $(this).find('.CI.InterfaceHeader .CI.AccountButtonsContainer')
            .trigger("logged-in");
        return false;
    });
});
sdbInterfaceCL.addCallback(function($ci, data) {
    $ci.on("show-tutorial", function() {
        let $this = $(this);
        let $obj = $this.children('.overlay-page-container');
        $obj.empty();
        sdbInterfaceCL.loadAppended($obj, "TutorialPage", data);
        $this.children('main').hide();
        $obj.show();
        return false;
    });
});

// TODO: There is a style bug with the sign-in etc. buttons when the width of
// the screen gets small enough (they jump down from the bar). I can see that
// it has to do with how BS displays columns as rows instead of there is limited
// space. Fix this bug.

export var interfaceHeaderCL = new ContentLoader(
    "InterfaceHeader",
    /* Initial HTML template */
    '<header class="navbar navbar-default">' +
        '<div class="container-fluid">' +
            '<<SuperCoolLogoTBD>>' +
            '<<HeaderButtonsContainer>>' +
            '<<AccountButtonsContainer>>' +
        '</div>' +
    '</header>',
    sdbInterfaceCL,
);

export var headerButtonsContainerCL = new ContentLoader(
    "HeaderButtonsContainer",
    /* Initial HTML template */
    '<ul class="nav navbar-nav">' +
        '<li class="tutorial"><a href="#">' +
            'Tutorial' +
        '</a></li>' +
        '<li class="minus"><a href="#">' +
            '<span style="font-size: 18pt;">-</span>' +
        '</a></li>' +
        '<li class="plus"><a href="#">' +
            '<span style="font-size: 18pt;">+</span>' +
        '</a></li>' +
        // TODO: Add one or a few more.
    '</ul>',
    sdbInterfaceCL,
);
headerButtonsContainerCL.addCallback(function($ci, data) {
    $ci.children('.tutorial').on("click", function() {
        $(this).trigger("show-tutorial");
        return false;
    });
    // (See below for the actions of the + and - buttons.)
});

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
            '<span class="glyphicon glyphicon-log-out"></span> Log out' +
        '</a></li>' +
    '</ul>',
    sdbInterfaceCL,
);
accountButtonsContainerCL.addCallback(function($ci, data) {
    if (typeof(Storage) === "undefined") {
        alert(
            "This web application requires browser support for local storage " +
            "in order to function correctly. It seems that your browser does " +
            "not support local storage."
        );
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
    $ci.children('.log-in').on("click", function() {
        $(this).trigger("log-in");
        return false;
    });
    $ci.children('.new-account').on("click", function() {
        $(this).trigger("new-account");
        return false;
    });
    $ci.children('.log-out').on("click", function() {
        accountManager.logout();
        let $ci = $(this).closest('.CI.AccountButtonsContainer');
        $ci.children('.log-out').hide();
        $ci.children('.log-in, .new-account').show();
        return false;
    });
    $ci.on("logged-in", function() {
    let $ci = $(this).closest('.CI.AccountButtonsContainer');
        $ci.children('.log-in, .new-account').hide();
        $ci.children('.log-out').show();
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
appColumnCL.addCallback("data", function(data) {
    data.copyFromAncestor("cl", 1);
    data.cl ??= appColumnCL.getRelatedCL("EntityPage");;
    data.recLevel = null;
    data.maxRecLevel = null;
});



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



export var appColumnContainerCL = new ContentLoader(
    "AppColumnContainer",
    /* Initial HTML template */
    '<div>' +
        '<<AppColumn>>' +
    '</div>',
    sdbInterfaceCL
);

/* Events to open new app columns and to cycle between them etc. */

appColumnCL.addCallback(function($ci) {
    $ci.on("open-column", function(event, contentKey, data, dir) {
        let $this = $(this);
        if (dir === "right") {
            sdbInterfaceCL.loadAfter($this, contentKey, data);
            $this.trigger("adjust-right");
        } else if (dir === "left") {
            sdbInterfaceCL.loadBefore($this, contentKey, data);
            $this.trigger("adjust-left");
        }
        return false;
    });
    $ci.on("close", function() {
        let $this = $(this);
        let $parent = $this.parent();
        $this.remove();
        $parent.trigger("adjust-left").trigger("adjust-right");
        return false;
    });
});

// TODO: Make the columns move smoothly sideways in a future implementation.
appColumnContainerCL.addCallback(function($ci, data) {
    data.activeColumnNum = 2;
    $ci.on("cycle-left", function() {
        let $columns = $(this).children();
        let $colBefore = $columns.filter(':visible').first().prev();
        if ($colBefore.length == 1) {
            let $colLast = $columns.filter(':visible').last();
            $colBefore.show(30);
            $colLast.hide(30);
        }
        return false;
    });
    $ci.on("cycle-right", function() {
        let $columns = $(this).children();
        let $colAfter = $columns.filter(':visible').last().next();
        if ($colAfter.length == 1) {
            let $colFirst = $columns.filter(':visible').first();
            $colAfter.show(30);
            $colFirst.hide(30);
        }
        return false;
    });
    $ci.on("adjust-left", function() {
        let $columns = $(this).children();
        let len = $columns.filter(':visible').length;
        while (len > data.activeColumnNum) {
            let $colLast = $columns.filter(':visible').last();
            $colLast.hide(); // (Setting a delay time here will cause bugs.)
            len--;
        }
        while (len < data.activeColumnNum) {
            let $colBefore = $columns.filter(':visible').first().prev();
            if ($colBefore.length != 1) {
                break;
            }
            $colBefore.show(); // (Setting a delay time here will cause bugs.)
            len++;
        }
        return false;
    });
    $ci.on("adjust-right", function() {
        let $columns = $(this).children();
        let len = $columns.filter(':visible').length;
        while (len > data.activeColumnNum) {
            let $colFirst = $columns.filter(':visible').first();
            $colFirst.hide(); // (Setting a delay time here will cause bugs.)
            len--;
        }
        while (len < data.activeColumnNum) {
            let $colAfter = $columns.filter(':visible').last().next();
            if ($colAfter.length != 1) {
                break;
            }
            $colAfter.show(); // (Setting a delay time here will cause bugs.)
            len++;
        }
        return false;
    });
    $ci.on("increase-column-number", function() {
        let $this = $(this);
        let data = $this.data("data");
        if (data.activeColumnNum < 3) {
            data.activeColumnNum++;
        }
        $this.css(
            'grid-template-columns',
            '1fr '.repeat(data.activeColumnNum)
        );
        $this.trigger("adjust-left").trigger("adjust-right");
        return false;
    });
    $ci.on("decrease-column-number", function() {
        let $this = $(this);
        let data = $this.data("data");
        if (data.activeColumnNum > 1) {
            data.activeColumnNum--;
        }
        $this.css(
            'grid-template-columns', '1fr '.repeat(data.activeColumnNum)
        );
        $this.trigger("adjust-left").trigger("adjust-right");
        return false;
    });
    $(document).on("keydown", function(event) {
        switch(event.which) {
            case 37: // left arrow key
                $ci.trigger("cycle-left");
                break;
            case 39: // right arrow key
                $ci.trigger("cycle-right");
                break;
            // I commented this out, cause it weird when you can also scroll:
            // case 38: // up arrow key
            //     $ci.trigger("increase-column-number");
            //     break;
            // case 40: // down arrow key
            //     $ci.trigger("decrease-column-number");
            //     break;
        }
        return true;
    });
    $ci.on("prepend-home-column", function() {
        let $this = $(this);
        let data = $this.data("data");
        let $visibleColumns = $this.children().filter(':visible');
        let newData = new DataNode(data, {entID: 10});
        if ($visibleColumns.length > 0) {
            $visibleColumns.first().trigger(
                "open-column", ["AppColumn", newData, "left"]
            );
        } else {
            appColumnContainerCL.loadPrepended($this, "AppColumn", newData);
        }
        return false;
    });
});
sdbInterfaceCL.addCallback(function($ci, data) {
    $ci.children('main').children('.left-margin').on("click", function() {
        $(this).next().trigger("cycle-left");
        return false;
    });
    $ci.children('main').children('.right-margin').on("click", function() {
        $(this).prev().trigger("cycle-right");
        return false;
    });
});
headerButtonsContainerCL.addCallback(function($ci, data) {
    $ci.children('.minus').on("click", function() {
        $(this).closest('.CI.ColumnBasedSDBInterface')
            .find('.CI.AppColumnContainer')
            .trigger("decrease-column-number");
        return false;
    });
    $ci.children('.plus').on("click", function() {
        $(this).closest('.CI.ColumnBasedSDBInterface')
            .find('.CI.AppColumnContainer')
            .trigger("increase-column-number");
        return false;
    });
});



export var superCoolLogoCL = new ContentLoader(
    "SuperCoolLogoTBD",
    /* Initial HTML template */
    '<span class="navbar-brand">openSDB</span>',
    sdbInterfaceCL,
);
superCoolLogoCL.addCallback(function($ci, data) {
    $ci.on("click", function() {
        let $obj = $(this).closest('.CI.ColumnBasedSDBInterface')
            .find('.CI.AppColumnContainer');
        if ($obj.filter(':visible').length > 0) {
            $obj.trigger("prepend-home-column");
        } else {
            $obj.trigger("back-to-main");
        }
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
