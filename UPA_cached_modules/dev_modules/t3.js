
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
sdbInterfaceCL.inwardCallbacks.push(function($ci) {
    $ci.data("contextData").dbReqManager = new DBRequestManager();
});

export var appColumnCL = new ContentLoader(
    "AppColumn",
    /* Initial HTML */
    '<div>' +
        '<<CloseButton>>' +
    '</div>',
    sdbInterfaceCL,
);
appColumnCL.cssRules.push(
    'margin: 5px 5px; width: 300px;'
);

// make the AppColumn load the CL pointed to by contextData.columnContentKey
// in the first outward callback.
appColumnCL.outwardCallbacks.push(function($ci) {
    let contextData = $ci.data("contextData");
    let contentKey = contextData.columnContentKey;
    delete contextData.columnContentKey;
    appColumnCL.loadAppended($ci, contentKey, contextData);
});

export var closeButtonCL = new ContentLoader(
    "CloseButton",
    /* Initial HTML */
    '<button type="button" class="close" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
    '</button>',
    sdbInterfaceCL,
);
closeButtonCL.outwardCallbacks.push(function($ci) {
    $ci.on("click", function() {
        $(this).trigger("close");
    });
});


/* Events to open new app columns */

// add event for columns to call to the ColumnBasedSDBInterface and open new
// columns next to them, to the right or to the left.
sdbInterfaceCL.outwardCallbacks.push(function($ci) {
    $ci
        .on("open-column", function(event, contextData, dir, isOverwritable) {
            let $callingColumn = $(event.target);
            if (dir === "right") {
                let $existingColumn = $callingColumn.next();
                if ($existingColumn.data("localData").isOverwritable ?? false) {
                    $existingColumn.remove();
                }
                sdbInterfaceCL.loadAfter(
                    $callingColumn, "AppColumn", contextData
                );
                $callingColumn.next().data("localData").isOverwritable =
                    isOverwritable ?? false;
            } else if (dir === "left") {
                let $existingColumn = $callingColumn.prev();
                if ($existingColumn.data("localData").isOverwritable ?? false) {
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
sdbInterfaceCL.outwardCallbacks.push(function($ci) {
    $ci.children('.CI.AppColumn').each(function() {
        $(this).data("localData").isOverwritable = false;
    });
});
// make Columns handle and send on "open-column" events coming from inside them
// such that the ColumnBasedSDBInterface parent sees the event coming from them.
// Also add a close event, and make the Columns turn themselves non-overwritable
// on first click interaction with them.
appColumnCL.outwardCallbacks.push(function($ci) {
    $ci
        .on("open-column", function(event, contextData, dir, isOverwritable) {
            $(this).parent().trigger("open-colum",
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
// Since we want to use the close button for tabs with their own click event,
// we should make the bubbling-up of the click event jump straight to the
// ancestor Column.
closeButtonCL.outwardCallbacks.push(function($ci) {
    $ci.on("click", function() {
        $(this).closest('.CI.AppColumn').trigger("click");
        return false;
    });
});


/* Events that add tabs and add/load associated pages to these */

pagesWithTabHeaderCL.outwardCallbacks.push(function($ci) {
    $ci.data("pageSpecs", {})
        .on("add-page", function(event, tabTitle, contentKey, pageData) {
            $(this).data("pageSpecs")[tabTitle] =
                {key:contentKey, data:pageData};
            return false;
        })
        .on("open-page", function(event, tabTitle) {
            let $this = $(this);
            let pageSpec = $this.data("pageSpecs")[tabTitle];
            $(this).children('.CI.PageArea')
                .trigger("open-page", [tabTitle, pageSpec.key, pageSpec.data]);
            return false;
        })
        .on("close-page", function(event, tabTitle) {
            $(this).children('.CI.PageArea')
                .trigger("open-page", [tabTitle]);
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
            $(this).trigger("open-page", [tabTitle]);
            return false;
        });
});
tabHeaderCL.outwardCallbacks.push(function($ci) {
    $ci
        .on("add-tab", function(event, tabTitle) {
            let $newTab = $(this).find('.nav-tabs').append(
                    '<li data-title="' + tabTitle + '">' +
                        '<a class="nav-link" href="#">' +
                            tabTitle +
                        '</a>' +
                    '</li>'
                )
                .children(':last-child');
            tabHeaderCL.loadPrepended($newTab, "CloseButton").hide();
            $newTab
                .on("click", function() {
                    $(this)
                        .trigger("activate-tab", [tabTitle])
                        .trigger("tab-selected", [tabTitle]);
                    return false;
                })
                .on("close", function() {
                    $(this)
                        .trigger("close-page", [tabTitle])
                        .find('.CI.CloseButton').hide();
                    return false;
                });
            return true; // makes the click event bubble up to the Column.
        })
        .on("activate-tab", function(event, tabTitle) {
            $(this).children('li')
                .removeClass("active")
                .filter('[data-title="' + tabTitle + '"]')
                .addClass("active")
                .find('.CI.CloseButton').show();
            return false;
        })
        .on("close", function(event, tabTitle) {
            $(this).children('li')
                .removeClass("active")
                .filter('[data-title="' + tabTitle + '"]')
                .addClass("active");
            return false;
        });
});
pageAreaCL.outwardCallbacks.push(function($ci) {
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



//
//
// export var pageFieldCL = new ContentLoader(
//     "PageField",
//     /* Initial HTML */
//     '<div class="container"></div>',
//     columnCL
// );
// pageFieldCL.outwardCallbacks.push(function($ci) {
//     $ci
//         .on("query-db", function(event, reqData, cacheKey, callback) {
//             let $this = $(this);
//             let dbReqManager = $this.data('dbReqManager');
//             dbReqManager.query($this, reqData, cacheKey, callback);
//             return false;
//         })
//         .on("append-contents", function(event, contentKey, dataArr, selector) {
//             let $obj = (typeof selector === "undefined") ?
//                 $(this) : $(this).find(selector);
//             let len = dataArr.length;
//             for (let i = 0; i < len; i++) {
//                 pageFieldCL.loadAppended($obj, contentKey, dataArr[i]);
//             }
//             return false;
//         })
//         .on("prepend-contents", function(event, contentKey, dataArr, selector) {
//             let $obj = (typeof selector === "undefined") ?
//                 $(this) : $(this).find(selector);
//             let len = dataArr.length;
//             for (let i = 0; i < len; i++) {
//                 pageFieldCL.loadPrepended($obj, contentKey, dataArr[i]);
//             }
//             return false;
//         });
// });
// export var termListCL = new ContentLoader(
//     "TermList",
//     /* Initial HTML */
//     '<<PageField>>',
//     columnCL
// );
// termListCL.outwardCallbacks.push(function($ci) {
//     $ci.append('<ul class="list-group"></ul>');
// });
// termListCL.outwardCallbacks.push(function($ci) {
//     $ci
//         .on("append-elements", function(event, contentKey, elemDataArr) {
//             $(this).trigger("append-contents",
//                 [contentKey, elemDataArr, 'ul, ol']
//             );
//             return false;
//         })
//         .on("empty", function(event, elemDataArr, elemCL) {
//             $(this).children('ul, ol').empty();
//             return false;
//         });
// });
//
//
// export var extensibleTermListCL = new ContentLoader(
//     "ExtensibleTermList",
//     /* Initial HTML */
//     '<<TermList>>',
//     columnCL
// );
// // TODO: Add a callback that adds a button at the bottom of the ci, which when
// // pressed, adds elements to the list, either cached ones or ones that are then
// // queried.
//
// export var termListElementCL = new ContentLoader(
//     "TermListElement",
//     /* Initial HTML */
//     '<li class="list-group-item"></li>',
//     columnCL
// );
// export var simpleTermListElementCL = new ContentLoader(
//     "SimpleTermListElement",
//     /* Initial HTML */
//     '<<TermListElement>>',
//     columnCL
// );
//
// // simpleTermListElementCL.outwardCallbacks.push(function($ci) {
// //     let termID = $ci.data("contextData").termID;
// //     $ci.data("contextData").dbReqManager.query($ci, )...
// //     $ci.append(
// //         ''
// //     );
// // });
//
// /* Test */
//
// export var categoryListElementCL = new ContentLoader(
//     "CategoryListElement",
//     /* Initial HTML */
//     '<<TermListElement>>',
//     columnCL
// );
// categoryListElementCL.outwardCallbacks.push(function($ci) {
//     let contextData = $ci.data("contextData");
//     $ci.append(
//         '<span>Hello, I will become a category term list element ' +
//         'generated from: ' + JSON.stringify(contextData) + '</span>'
//     );
// });
//
// export var supercategoryPageCL = new ContentLoader(
//     "SupercategoryPage",
//     /* Initial HTML */
//     '<<Column>>',
//     columnCL
// );
// supercategoryPageCL.outwardCallbacks.push(function($ci) {
//     let contextData = $ci.data("contextData");
//     $ci.trigger("add-tab-and-page",
//         ["Defining supercategories", "DefSuperCatsPage", contextData]
//     );
//     $ci.trigger("open-tab-and-page", ["Defining supercategories"]);
// });
//
// export var defSuperCatsPageCL = new ContentLoader(
//     "DefSuperCatsPage",
//     /* Initial HTML */
//     '<<ExtensibleTermList>>',
//     columnCL
// );
// defSuperCatsPageCL.outwardCallbacks.push(function($ci) {
//     let contextData = $ci.data("contextData");
//     let elemDataArr = [contextData, contextData, contextData];
//     $ci.trigger("append-elements", ["CategoryListElement", elemDataArr]);
// });
// defSuperCatsPageCL.inwardCallbacks.push(function($ci) {
//     // $ci.find('ul').addClass("list-group-numbered");
//     $ci.data("contextData").ordered = true;
// });
// termListCL.outwardCallbacks.push(function($ci) {
//     if ($ci.data("contextData").ordered ?? false === true) {
//         $ci.empty();
//         $ci.append('<ol class="list-group list-group-numbered"></ol>');
//         // $ci.find('ul').addClass("list-group-numbered");
//     }
// });
//
// export var mainPageCL = new ContentLoader(
//     "MainPage",
//     /* Initial HTML */
//     '<div></div>',
//     columnCL
// );
// mainPageCL.inwardCallbacks.push(function($ci) {
//     let contextData = $ci.data("contextData");
//     $ci.prepend(
//         '<span>Hello, I will be a main page generated from: ' +
//         JSON.stringify(contextData) + '</span>'
//     );
// });
//
// export var categoryColumnCL = new ContentLoader(
//     "CategoryColumn",
//     /* Initial HTML */
//     '<<Column>>',
//     sdbInterfaceCL
// );
//
//
// categoryColumnCL.outwardCallbacks.push(function($ci) {
//     let contextData = $ci.data("contextData");
//     $ci.trigger("add-tab-and-page",
//         ["Supercategories", "SupercategoryPage", contextData]
//     );
//     $ci.trigger("add-tab-and-page",
//         ["Subcategories", "MainPage", contextData]
//     );
//     $ci.trigger("add-tab-and-page",
//         ["Elements", "MainPage", contextData]
//     );
//     // open the "Subcategories" tab as the default one.
//     $ci.trigger("open-tab-and-page", ["Subcategories"]);
// });
//
//
//
//
//
//
// tabNavListCL.cssRules.push(
//     '& > li > a { padding: 7px 12px; }'
// );
// tabNavListCL.cssRules.push(
//     '&.odd { margin-left: 2px }'
// );
// columnCL.inwardCallbacks.push(function($ci) {
//     let parentColumnParity = $ci.data("contextData").columnParity ?? true;
//     $ci.data("contextData").columnParity = !parentColumnParity;
// });
// tabNavListCL.outwardCallbacks.push(function($ci) {
//     if ($ci.data("contextData").columnParity) {
//         $ci.addClass("odd");
//     }
// });
