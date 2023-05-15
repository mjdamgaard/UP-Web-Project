
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=1";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=2";


export var sdbInterfaceCL = new ContentLoader(
    "ColumnBasedSDBInterface",
    /* Initial HTML */
    '<div>' +
        '<<AppColumn>>' +
    '</div>'
);
// sdbInterfaceCL.addCallback("inward", function($ci) {
//     $ci.data("contextData").dbReqManager = new DBRequestManager();
// });
sdbInterfaceCL.dynamicData.dbReqManager = new DBRequestManager();

export var appColumnCL = new ContentLoader(
    "AppColumn",
    /* Initial HTML */
    '<div>' +
        '<<ColumnButtonContainer>>' +
    '</div>',
    sdbInterfaceCL,
);
export var columnButtonContainerCL = new ContentLoader(
    "ColumnButtonContainer",
    /* Initial HTML */
    '<div>' +
        // '<<PinButton>>' +
        '<<CloseButton>>' +
    '<div>',
    sdbInterfaceCL,
);
export var closeButtonCL = new ContentLoader(
    "CloseButton",
    /* Initial HTML */
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


// make the AppColumn load the CL pointed to by contextData.columnContentKey
// in the first outward callback.
appColumnCL.addCallback(function($ci) {
    let contextData = $ci.data("contextData");
    let contentKey = contextData.columnContentKey;
    delete contextData.columnContentKey;
    appColumnCL.loadAppended($ci, contentKey, contextData);
});



/* Events to open new app columns */

// add event for columns to call to the ColumnBasedSDBInterface and open new
// columns next to them, to the right or to the left.
sdbInterfaceCL.addCallback(function($ci) {
    $ci
        .on("open-column-next-to-caller", function(
            event, contextData, dir, isOverwritable
        ) {
            let $callingColumn = $(event.target);
            if (dir === "right") {
                let $existingColumn = $callingColumn.next();
                let existingLocalData = $existingColumn.data("localData") ?? {};
                if (existingLocalData.isOverwritable ?? false) {
                    $existingColumn.remove();
                }
                sdbInterfaceCL.loadAfter(
                    $callingColumn, "AppColumn", contextData
                );
                $callingColumn.next().data("localData").isOverwritable =
                    isOverwritable ?? false;
            } else if (dir === "left") {
                let $existingColumn = $callingColumn.prev();
                let existingLocalData = $existingColumn.data("localData") ?? {};
                if (existingLocalData.isOverwritable ?? false) {
                    $existingColumn.remove();
                }
                sdbInterfaceCL.loadBefore(
                    $callingColumn, "AppColumn", contextData
                );
                $callingColumn.prev().data("localData").isOverwritable =
                    isOverwritable ?? false;
            }
            return false;
        });
        // TODO: Add event to open the default ("This SDB") column.
});
// make all the initial columns non-overwritable from the beginning.
sdbInterfaceCL.addCallback(function($ci) {
    $ci.children('.CI.AppColumn').each(function() {
        $(this).data("localData").isOverwritable = false;
    });
});
// make Columns handle and send on "open-column" events coming from inside them
// such that the ColumnBasedSDBInterface parent sees the event coming from them.
// Also add a close event, and make the Columns turn themselves non-overwritable
// on first click interaction with them.
appColumnCL.addCallback(function($ci) {
    $ci
        .on("open-column", function(event, contextData, dir, isOverwritable) {
            $(this).trigger("open-column-next-to-caller",
                [contextData, dir, isOverwritable]
            );
            return false;
        })
        .on("close", function() {
            $(this).remove();
            return false;
        })
        .one("click", function() {
            $(this).data("localData").isOverwritable = false;
        });
});



/* Pages with tab headers */

export var pagesWithTabHeaderCL = new ContentLoader(
    "PagesWithTabHeader",
    /* Initial HTML */
    '<div>' +
        "<<TabHeader>>" +
        "<<PageArea>>" +
    '</div>',
    appColumnCL
);

export var tabHeaderCL = new ContentLoader(
    "TabHeader",
    /* Initial HTML */
    '<header>' +
        '<ul class="nav nav-tabs"></ul>' +
    '</header>',
    appColumnCL
);
export var pageAreaCL = new ContentLoader(
    "PageArea",
    /* Initial HTML */
    '<main></main>',
    appColumnCL
);


// TODO: Remove all the unused events below and above.


/* Events that add tabs and add/load associated pages to these */

pagesWithTabHeaderCL.addCallback(function($ci) {
    $ci.data("pageSpecs", {})
        .on("add-page", function(event, tabTitle, contentKey, pageData) {
            $(this).data("pageSpecs")[tabTitle] =
                {key:contentKey, data:pageData};
            return false;
        })
        .on("open-page", function(event, tabTitle) {
            let $this = $(this);
            let pageSpec = $this.data("pageSpecs")[tabTitle];
            $this.children('.CI.PageArea')
                .trigger("open-page", [tabTitle, pageSpec.key, pageSpec.data]);
            return false;
        })
        .on("close-page", function(event, tabTitle) {
            $(this).children('.CI.PageArea')
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
pagesWithTabHeaderCL.addCallback(function($ci) {
    $ci
        .on("open-tab-in-new-column", function(event, tabTitle) {
            let $this = $(this);
            let outerContentKey = $this.data("localData").contentKey;
            let contextData = Object.assign(
                {columnContentKey: outerContentKey, defaultTab: tabTitle},
                $this.data("contextData")
            );
            $(this).trigger("open-column", [contextData, "right", false]);
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
                })
                .on("click auxclick dblclick", function(event) {
                    if (
                        event.type === "click" && event.ctrlKey ||
                        event.type === "auxclick" && event.button == 1 ||
                        event.type === "dblclick"
                    ) {
                        $(this).trigger("open-tab-in-new-column", [tabTitle]);
                    }
                    return true;
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
pageAreaCL.addCallback(function($ci) {
    $ci.data("openPagesTitleArr", [])
        .on("open-page", function(event, tabTitle, contentKey, pageData) {
            let $this = $(this);
            if ($this.data("openPagesTitleArr").includes(tabTitle)) {
                $this.children().hide();
                $this.children('[data-title="' + tabTitle +'"]').show();
            } else {
                $this.data("openPagesTitleArr").push(tabTitle);
                $this.children().hide();
                pageAreaCL.loadAppended($this, contentKey, pageData);
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

// make PagesWithTabHeader open a specified default tab automatically.
pagesWithTabHeaderCL.addCallback("inward", function($ci) {
    var contextData = $ci.data("contextData");
    $ci.data("localData").defaultTab = contextData.defaultTab ?? false;
    delete contextData.defaultTab;
});
pagesWithTabHeaderCL.addCallback(function($ci) {
    let defaultTab = $ci.data("localData").defaultTab;
    if (defaultTab) {
        $ci.on("open-default-tab", function() {
            $(this).trigger("open-tab-and-page", [defaultTab]);
            return false;
        });
    }
});
pagesWithTabHeaderCL.addCallback(function($ci) {
    $ci.data("localData").afterDecCallbacks.push(function($ci) {
        $ci.trigger("open-default-tab");
    });
});


/* Let us define the CSS all together for this module */

sdbInterfaceCL.addCSS(
    'height: 100%;' +
    'overflow-x: auto;' +
    'overflow-y: hidden;' +
    'white-space: nowrap;' +
    'background-color: #f9fef5;' +
    ''
);
appColumnCL.addCSS(
    'height: 101%;' +
    'overflow: initial;' +
    'white-space: initial;' +
    'display: inline-block;' +
    'margin: 0px 10px;' +
    'width: 600px;' +
    'border: 1px solid #DDD;' +
    'border-radius: 8px;' +
    'background-color: #FFF;'
);
closeButtonCL.addCSS(
    'padding: 0px 4px;' +
    'position: relative;' +
    'z-index: 2;' +
    ''
);
tabHeaderCL.addCSS(
    'padding: 4px 0px 0px;' +
    'background-color: #f7f7f7;'
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
pageAreaCL.addCSS(
    'margin: 6px 6px;'
);



// /* Test */
//
// export var testPagesCL = new ContentLoader(
//     "TestPages",
//     /* Initial HTML */
//     '<<PagesWithTabHeader>>',
//     appColumnCL
// );
//
//
// testPagesCL.addCallback(function($ci) {
//     let contextData = $ci.data("contextData");
//     $ci
//         .trigger("add-tab-and-page",
//             ["Supercategories", "TestPage", contextData]
//         )
//         .trigger("add-tab-and-page",
//             ["Subcategories", "TestPage", contextData]
//         )
//         .trigger("add-tab-and-page",
//             ["Elements", "TestPage", contextData]
//         );
// });
//
// export var testPageCL = new ContentLoader(
//     "TestPage",
//     /* Initial HTML */
//     '<div></div>',
//     appColumnCL
// );
// testPageCL.addCallback("inward", function($ci) {
//     let contextData = $ci.data("contextData");
//     $ci.prepend(
//         '<span>Hello, I will be a main page generated from: ' +
//         JSON.stringify(contextData) + '</span>'
//     );
// });

















// defSuperCatsPageCL.addCallback(function($ci) {
//     let contextData = $ci.data("contextData");
//     let elemDataArr = [contextData, contextData, contextData];
//     $ci.trigger("append-elements", ["CategoryListElement", elemDataArr]);
// });





// tabHeaderCL.addCSS(
//     '& li > a { padding: 7px 12px; }'
// );
// tabHeaderCL.addCSS(
//     '& .nav-tabs.odd { margin-left: 2px }'
// );
// appColumnCL.addCallback("inward", function($ci) {
//     let parentColumnParity = $ci.data("contextData").columnParity ?? true;
//     $ci.data("contextData").columnParity = !parentColumnParity;
// });
// tabHeaderCL.addCallback(function($ci) {
//     if ($ci.data("contextData").columnParity) {
//         $ci.addClass("odd");
//     }
// });
