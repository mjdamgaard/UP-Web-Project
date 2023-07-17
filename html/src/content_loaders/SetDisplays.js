
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
            $ci, "CategoryDisplay", new ChildData(data, {
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
