
import {
    ContentLoader, ChildData,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";




export var setDisplayCL = new ContentLoader(
    "SetDisplay",
    /* Initial HTML template */
    '<div>' +
        '<<SetHeader>>' +
        '<<SetList>>' +
        '<<AppendMoreButtonOrPagination>>' +
    '</div>',
    sdbInterfaceCL
);

export var setHeaderCL = new ContentLoader(
    "SetHeader",
    /* Initial HTML template */
    '<<DropdownBox>>',
    sdbInterfaceCL
);
setHeaderCL.addCallback("data", function(data) {
    data.dropdownCL = setHeaderCL.getRelatedCL("SetMenu");
});

export var dropdownBoxCL = new ContentLoader(
    "DropdownBox",
    /* Initial HTML template */
    '<div>' +
        '<<SelfReplacer data:wait>>' +
        '<<DropdownButtonBar>>' +
    '</div>',
    sdbInterfaceCL
);
dropdownBoxCL.addCallback("data", function(data) {
    data.cl = data.getFromAncestor("dropdownCL");
});
dropdownBoxCL.addCallback(function($ci, data) {
    $ci.one("click", function() {
        let $this = $(this);
        $this.find('.CI.DropdownButtonBar')
            .trigger("toggle-button-symbol")
            .on("click", function() {
                $(this).trigger("toggle-button-symbol")
                    .prev().toggle();
                return false;
            });
        $this.find('.CI.SelfReplacer').trigger("load");
        return false;
    });
});
export var dropdownButtonBarCL = new ContentLoader(
    "DropdownButtonBar",
    /* Initial HTML template */
    '<div>' +
        '<span class="symbol">&#8964</span>' +
    '</div>',
    sdbInterfaceCL
);
dropdownButtonBarCL.addCallback("data", function(data) {
    data.symbolIsDown = true;
});
dropdownButtonBarCL.addCallback(function($ci, data) {
    $ci.on("toggle-button-symbol", function() {
        let $this = $(this);
        let data = $this.data("data");
        if (data.symbolIsDown) {
            $this.children('.symbol').html('&#8963');
            data.symbolIsDown = false;
        } else {
            $this.children('.symbol').html('&#8964');
            data.symbolIsDown = true;
        }
        return false;
    });
});

export var setMenurCL = new ContentLoader(
    "SetMenu",
    /* Initial HTML template */
    '<div>' +
        '<<SetPredicatesList>>' +
        '<<SortingMenu>>' +
        // TODO: Extend.
    '</div>',
    sdbInterfaceCL
);

export var setPredicatesListCL = new ContentLoader(
    "SetPredicatesList",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    sdbInterfaceCL
);
setPredicatesListCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "setGenerator",
    ]);
});
setPredicatesListCL.addCallback(function($ci, data) {
    let predIDArr = data.setGenerator.getSetPredicates();
    predIDArr.forEach(function(val) {
        setPredicatesListCL.loadAppended(
            $ci, "PredicateDisplay", new ChildData(data, {
                termID: val,
            })
        );
    });
});
export var predicateDisplayCL = new ContentLoader(
    "PredicateDisplay",
    /* Initial HTML template */
    '<div>' +
        '<<TermTitle>>' +
    '</div>',
    sdbInterfaceCL
);
// I'm considering how to add Terms to sets, and to add missing predicates. I
// think that I will just add.. well, either add a submission field in Applies
// to, or perhaps it's better to add this in a separate tab.. But anyway, the
// secod question is harder: How to add missing predicates. A solution could be
// to just use dialog boxes, or whatever they're called, as temporary solution,
// but I would rather not do that.. I feel like the longer-term solution is to
// have a queue of such missing predicates, where the user can go to that queue
// and add as many of the recently encountered predicates as they want.. But do
// I implement this now?
// TODO: Figure this question out.
// Okay, I'm actually just gonna make inserting the missing predicates automatic
// in the beginning (even though this has to change).
