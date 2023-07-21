
import {
    ContentLoader, DataNode,
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
        '<<AppendMoreElementsButton>>' +
    '</div>',
    sdbInterfaceCL
);
setDisplayCL.addCallback("data", function(data) {
    data.copyFromAncestor(["initialNum", "incrementNum"], 1);
    data.initialNum ??= 50;
    data.incrementNum ??= 50;
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
        // '<span class="symbol">&#8964;</span>' +
        // '<span class="symbol">&#9663;</span>' +
        // '<span class="symbol">&or;</span>' +
        '&or;' +
    '</span>',
    sdbInterfaceCL
);
dropdownButtonCL.addCallback("data", function(data) {
    data.symbolIsDown = true;
});
dropdownButtonCL.addCallback(function($ci, data) {
    $ci.on("toggle-button-symbol", function() {
        let $this = $(this);
        let data = $this.data("data");
        if (data.symbolIsDown) {
            // $this.children('.symbol').html('&#8963;');
            $this.html('&and;');
            data.symbolIsDown = false;
        } else {
            $this.html('&or;');
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
