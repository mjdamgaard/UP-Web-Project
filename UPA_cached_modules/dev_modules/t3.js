
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=1";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=2";



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
export var selfReplacerCL = new ContentLoader(
    "SelfReplacer",
    /* Initial HTML template */
    '<template></template>',
    sdbInterfaceCL
);
selfReplacerCL.addCallback(function($ci, data, childReturnData, returnData) {
    data.cl.loadReplaced($ci, "self", data.data ?? data, returnData);
});

appColumnListCL.addCallback("data", function(data) {
    data.listElemDataArr = data.columnSpecs;
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
// Since we want to use the close button for tabs with their own click event,
// we should make the bubbling-up of the click event jump straight to the
// ancestor Column.
closeButtonCL.addCallback(function($ci) {
    $ci.on("click", function() {
        $(this).trigger("close")
            .closest('.CI.AppColumn').trigger("click");
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
        .on("open-column", function(event, data, dir, isOverwritable) {
            let $this = $(this);
            if (dir === "right") {
                let $existingColumn = $this.next();
                let existingData = $existingColumn.data("data") ?? {};
                if (existingData.isOverwritable ?? false) {
                    $existingColumn.remove();
                }
                sdbInterfaceCL.loadAfter($this, "AppColumn", data);
                $this.next().data("data").isOverwritable =
                    isOverwritable ?? false;
            } else if (dir === "left") {
                let $existingColumn = $this.prev();
                let existingData = $existingColumn.data("data") ?? {};
                if (existingData.isOverwritable ?? false) {
                    $existingColumn.remove();
                }
                sdbInterfaceCL.loadBefore($this, "AppColumn", data);
                $this.prev().data("data").isOverwritable =
                    isOverwritable ?? false;
            }
            return false;
        })
        .on("close", function() {
            $(this).remove();
            return false;
        })
        .one("click", function() {
            $(this).data("data").isOverwritable = false;
            return false;
        });
});
// make all the initial columns non-overwritable from the beginning.
sdbInterfaceCL.addCallback(function($ci) {
    $ci.children('.CI.AppColumn').each(function() {
        $(this).data("data").isOverwritable = false;
    });
});


/* Pages with tab headers */

export var pagesWithTabsCL = new ContentLoader(
    "PagesWithTabs",
    /* Initial HTML template */
    '<div>' +
        "<<TabHeader>>" +
        "<<PagesContainer>>" +
    '</div>',
    appColumnCL
);

export var tabHeaderCL = new ContentLoader(
    "TabHeader",
    /* Initial HTML template */
    '<div>' +
        '<ul class="nav nav-tabs"></ul>' +
    '</div>',
    appColumnCL
);
export var pagesContainerCL = new ContentLoader(
    "PagesContainer",
    /* Initial HTML template */
    '<div></div>',
    pagesWithTabsCL
);



/* Events that add tabs and add/load associated pages to these */

pagesWithTabsCL.addCallback(function($ci) {
    $ci.data("pageSpecs", {})
        .on("add-page", function(event, tabTitle, contentKey, pageData) {
            $(this).data("pageSpecs")[tabTitle] =
                {key:contentKey, data:pageData};
            return false;
        })
        .on("open-page", function(event, tabTitle) {
            let $this = $(this);
            let pageSpec = $this.data("pageSpecs")[tabTitle];
            $this.children('.CI.PagesContainer')
                .trigger("open-page", [tabTitle, pageSpec.key, pageSpec.data]);
            return false;
        })
        .on("close-page", function(event, tabTitle) {
            $(this).children('.CI.PagesContainer')
                .trigger("close-page", [tabTitle]);
            return false;
        })
        .on("add-tab", function(event, tabTitle) {
            $(this).children('.CI.TabHeader')
                .trigger("add-tab", [tabTitle]);
            return false;
        })
        .on("activate-tab", function(event, tabTitle) {
            $(this).children('.CI.TabHeader')
                .trigger("activate-tab", [tabTitle]);
            return false;
        })
        .on("add-tab-and-page", function(
            event, tabTitle, contentKey, pageData
        ) {
            $(this)
                .trigger("add-page", [tabTitle, contentKey, pageData])
                .trigger("add-tab", [tabTitle]);
            return false;
        })
        .on("open-tab-and-page", function(event, tabTitle) {
            $(this)
                .trigger("activate-tab", [tabTitle])
                .trigger("open-page", [tabTitle]);
            return false;
        })
        .on("tab-selected", function(event, tabTitle) {
            $(this)
                .trigger("open-page", [tabTitle]);
            return false;
        });
});
tabHeaderCL.addCallback(function($ci) {
    $ci
        .on("add-tab", function(event, tabTitle) {
            let $newTab = $(this).find('.nav-tabs')
                .append(
                    '<li data-title="' + tabTitle + '">' +
                        '<a class="nav-link" href="#">' +
                            tabTitle +
                        '</a>' +
                    '</li>'
                )
                .children(':last-child');
            tabHeaderCL.loadPrepended($newTab, "CloseButton");
            $newTab.find('.CI.CloseButton').hide();
            $newTab
                .on("click", function(event) {
                    $(this)
                        .trigger("activate-tab", [tabTitle])
                        .trigger("tab-selected", [tabTitle]);
                    return true; // makes the click event bubble up.
                })
                .on("close", function() {
                    $(this)
                        .trigger("close-page", [tabTitle])
                        .removeClass("active")
                        .find('.CI.CloseButton').hide();
                    return false;
                });
            return false;
        })
        .on("activate-tab", function(event, tabTitle) {
            $(this).find('li')
                .removeClass("active")
                .filter('[data-title="' + tabTitle + '"]')
                .addClass("active")
                .find('.CI.CloseButton').show();
            return false;
        });
});
pagesContainerCL.addCallback(function($ci) {
    $ci.data("openPagesTitleArr", [])
        .on("open-page", function(event, tabTitle, contentKey, pageData) {
            let $this = $(this);
            if ($this.data("openPagesTitleArr").includes(tabTitle)) {
                $this.children().hide();
                $this.children('[data-title="' + tabTitle +'"]').show();
            } else {
                $this.data("openPagesTitleArr").push(tabTitle);
                $this.children().hide();
                pagesContainerCL.loadAppended($this, contentKey, pageData);
                $this.children(':last-child').attr("data-title", tabTitle);
            }
            return false;
        })
        .on("close-page", function(event, tabTitle) {
            let $this = $(this);
            let titleArr = $this.data("openPagesTitleArr");
            titleArr[titleArr.indexOf(tabTitle)] = null;
            $this.children('[data-title="' + tabTitle +'"]').remove();
            return false;
        });
});




// make PagesWithTabs automatically look for tab titles and associated
// pageSpecs in the "data" object.
pagesWithTabsCL.addCallback(function($ci, data) {
    let len = (data.tabAndPageDataArr ?? []).length;
    for (let i = 0; i < len; i++) {
        $ci.trigger("add-tab-and-page", data.tabAndPageDataArr[i]);
    }
});

// make PagesWithTabs open a specified default tab automatically.
pagesWithTabsCL.addCallback("data", function(data) {
    data.defaultTab ??= false;
    var childData = Object.assign({}, data);
    delete childData.defaultTab;
    return childData;
});
pagesWithTabsCL.addCallback(function($ci, data) {
    if (data.defaultTab) {
        $ci.trigger("open-tab-and-page", [data.defaultTab]);
        return false;
    }
});






/* Let us define the CSS all together for this module */

sdbInterfaceCL.addCSS(
    'height: 100%;' +
    'display: grid;' +
    'grid-template-columns: auto;' +
    'grid-template-rows: 20px auto;' +
    ''
);
columnInterfaceHeaderCL.addCSS(
    'height: 10px;' +
    'background-color: blue;'
);
sdbInterfaceCL.addCSS(
    '& main {' +
        'display: grid;' +
        'grid-template-columns: 30px auto 30px;' +
        'grid-template-rows: auto;' +
    '}'
);
sdbInterfaceCL.addCSS(
    '& .app-column-container {' +
        'display: flex;' +
        'flex-direction: column;' +
        'overflow-x: auto;' +
        'overflow-y: hidden;' +
        'white-space: nowrap;' +
        'background-color: #f9fef5;' +
    '}'
);
appColumnCL.addCSS(
    'flex-grow: 1;' +
    'overflow: initial;' +
    'white-space: initial;' +
    'display: inline-block;' +
    'margin: 0px 10px;' +
    'width: 600px;' +
    'border: 1px solid #DDD;' +
    'border-radius: 8px;' +
    'background-color: #FFF;' +
    ''
);
closeButtonCL.addCSS(
    'padding: 0px 4px;' +
    'position: relative;' +
    'z-index: 2;' +
    ''
);
tabHeaderCL.addCSS(
    'padding: 4px 0px 0px;' +
    // 'background-color: #f7f7f7;' +
    ''
);
tabHeaderCL.addCSS(
    '& .CI.CloseButton {' +
        "position: absolute;" +
        "z-index: 2;" +
        "right: 1px;" +
        "top: 1px;" +
    '}'
);
tabHeaderCL.addCSS(
    '& ul > li .nav-link {' +
        'pointer-events: none;' +
        'border-bottom: 1px solid #ddd;' +
        'background-color: #fefefe;' +
        // 'box-shadow: 10px 10px 5px lightblue;' +
    '}'
);
tabHeaderCL.addCSS(
    '& ul {' +
        'display: flex;' +
        // 'justify-content: flex-end;' +
        'flex-wrap: wrap-reverse;' +
        'flex-direction: row;' +
        'margin: 0px 0px 0px 2px;' +
    '}'
);
tabHeaderCL.addCSS(
    '& ul > li {' +
        'margin: 2px 1px -1px 0px;' +
    '}'
);
tabHeaderCL.addCSS(
    '& ul > li.active .nav-link {' +
        'border-bottom: 1px solid #fff;' +
        'background-color: #fff;' +
    '}'
);
pagesContainerCL.addCSS(
    // 'min-height: 30px;' +
    // 'width: 100%;' +
    // 'position: absolute;' +
    // 'z-index: 1;' +
    // // 'margin: 6px 6px;' +
    // 'background-color: #fff;' +
    ''
);



// /* Test */
//
// export var testPagesCL = new ContentLoader(
//     "TestPages",
//     /* Initial HTML template */
//     '<<PagesWithTabs>>',
//     appColumnCL
// );
//
//
// testPagesCL.addCallback(function($ci) {
//     let data = $ci.data("data");
//     $ci
//         .trigger("add-tab-and-page",
//             ["Supercategories", "TestPage", data]
//         )
//         .trigger("add-tab-and-page",
//             ["Subcategories", "TestPage", data]
//         )
//         .trigger("add-tab-and-page",
//             ["Elements", "TestPage", data]
//         );
// });
//
// export var testPageCL = new ContentLoader(
//     "TestPage",
//     /* Initial HTML template */
//     '<div></div>',
//     appColumnCL
// );
// testPageCL.addCallback("inward", function($ci) {
//     let data = $ci.data("data");
//     $ci.prepend(
//         '<span>Hello, I will be a main page generated from: ' +
//         JSON.stringify(data) + '</span>'
//     );
// });

















// defSuperCatsPageCL.addCallback(function($ci) {
//     let data = $ci.data("data");
//     let elemDataArr = [data, data, data];
//     $ci.trigger("append-elements", ["CategoryListElement", elemDataArr]);
// });





// tabHeaderCL.addCSS(
//     '& li > a { padding: 7px 12px; }'
// );
// tabHeaderCL.addCSS(
//     '& .nav-tabs.odd { margin-left: 2px }'
// );
// appColumnCL.addCallback("inward", function($ci) {
//     let parentColumnParity = $ci.data("data").columnParity ?? true;
//     $ci.data("data").columnParity = !parentColumnParity;
// });
// tabHeaderCL.addCallback(function($ci) {
//     if ($ci.data("data").columnParity) {
//         $ci.addClass("odd");
//     }
// });
