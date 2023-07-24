
import {
    ContentLoader, DataNode,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterface.js";




export var setDisplayCL = new ContentLoader(
    "SetDisplay",
    /* Initial HTML template */
    '<div>' +
        '<<SetHeader>>' +
        '<div class="set-container"></div>' +
        '<<AppendMoreElementsButton>>' +
    '</div>',
    sdbInterfaceCL
);
setDisplayCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "elemContentKey",
        "setGenerator",
    ]);
    data.copyFromAncestor(["initialNum", "incrementNum"], 1);
    data.initialNum ??= 50;
    data.incrementNum ??= 50;
});
setDisplayCL.addCallback(function($ci, data) {
    $ci.one("initial-elements-loaded", function() {
        let $this = $(this);
        $this.on("append-elements", function(event, set) {
            let $this = $(this);
            let data = $this.data("data");
            let currNum = data.currentNum;
            if (currNum >= data.set.length) {
                return;
            }
            let newNum = currNum + data.incrementNum;
            data.listElemDataArr = data.set.slice(currNum, newNum).map(val => ({
                ratVal: val[0],
                entID: val[1],
            }));
            data.currentNum = currNum + data.listElemDataArr.length;
            let $setContainer = $this.children('.set-container');
            setDisplayCL.loadAppended($setContainer, "List", data);
            return false;
        });
        return false;
    });
    data.cl = setDisplayCL.getRelatedCL(data.elemContentKey);
    $ci.one("load-initial-elements", function(event, set) {
        let $this = $(this);
        let data = $this.data("data");
        data.set = set;
        data.listElemDataArr = set.slice(0, data.initialNum).map(val => ({
            ratVal: val[0],
            entID: val[1],
        }));
        data.currentNum = data.listElemDataArr.length;
        let $setContainer = $this.children('.set-container');
        setDisplayCL.loadAppended($setContainer, "List", data);
        $this.trigger("initial-elements-loaded");
        return false;
    });
    data.setGenerator.generateSet($ci, function($ci, set) {
        $ci.trigger("load-initial-elements", [set]);
    });
});


export var appendMoreElementsButtonCL = new ContentLoader(
    "AppendMoreElementsButton",
    /* Initial HTML template */
    '<<DropdownButtonBar>>',
    sdbInterfaceCL
);
appendMoreElementsButtonCL.addCallback(function($ci, data) {
    $ci.on("click", function() {
        $(this).trigger("append-elements");
        return false;
    });
});


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
        $this.find('.CI.DropdownButton')
            .trigger("toggle-button-symbol")
            .on("click", function() {
                $(this).trigger("toggle-button-symbol")
                    .closest('.CI.DropdownBox').children().first().toggle();
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
        '<<DropdownButton>>' +
    '</div>',
    sdbInterfaceCL
);
export var dropdownButtonCL = new ContentLoader(
    "DropdownButton",
    /* Initial HTML template */
    '<span>' +
        '<span class="caret"></span>' +
        // '<span class="glyphicon glyphicon-triangle-bottom"></span>' +
    '</span>',
    sdbInterfaceCL
);
dropdownButtonCL.addCallback(function($ci, data) {
    data.symbolIsDown = true;
    $ci.on("toggle-button-symbol", function() {
        let $this = $(this);
        let data = $this.data("data");
        if (data.symbolIsDown) {
            $this.addClass('dropup');
            data.symbolIsDown = false;
        } else {
            $this.removeClass('dropup');
            data.symbolIsDown = true;
        }
        return false;
    });
});

export var setMenurCL = new ContentLoader(
    "SetMenu",
    /* Initial HTML template */
    '<div>' +
        '<<SetCategoriesList>>' +
        '<<SortingMenu>>' +
        // TODO: Extend.
    '</div>',
    sdbInterfaceCL
);

export var setCategoriesListCL = new ContentLoader(
    "SetCategoriesList",
    /* Initial HTML template */
    '<div>' +
    '</div>',
    sdbInterfaceCL
);
setCategoriesListCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "setGenerator",
    ]);
});
setCategoriesListCL.addCallback(function($ci, data) {
    let catIDArr = data.setGenerator.getSetCategories();
    catIDArr.forEach(function(val) {
        setCategoriesListCL.loadAppended(
            $ci, "CategoryDisplay", new DataNode(data, {
                entID: val,
            })
        );
    });
});
export var categoryDisplayCL = new ContentLoader(
    "CategoryDisplay",
    /* Initial HTML template */
    '<div>' +
        '<<EntityTitle>>' +
    '</div>',
    sdbInterfaceCL
);
