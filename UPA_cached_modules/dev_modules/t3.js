
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
    let cl = appColumnCL.relatedCL(contextData.columnContentKey);
    delete contextData.columnContentKey;
    cl.loadAppended($ci, contextData);
});

export var closeButtonCL = new ContentLoader(
    "CloseButton",
    /* Initial HTML */
    '<button type="button" class="close" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
    '</button>',
    sdbInterfaceCL,
);


/* Events to open new app columns */

sdbInterfaceCL.outwardCallbacks.push(function($ci) {
    $ci
        .on("open-column", function(event, contextData, dir, isOverwritable) {
            let $callingColumn = $(event.target);
            if (dir === "right") {
                let $existingColumn = $callingColumn.next();
                if ($existingColumn.data("localData").isOverwritable ?? false) {
                    $existingColumn.remove();
                }
                appColumnCL.loadAfter($callingColumn, contextData);
                $callingColumn.next().data("localData").isOverwritable =
                    isOverwritable ?? false;
            } else if (dir === "left") {
                let $existingColumn = $callingColumn.prev();
                if ($existingColumn.data("localData").isOverwritable ?? false) {
                    $existingColumn.remove();
                }
                appColumnCL.loadBefore($callingColumn, contextData);
                $callingColumn.prev().data("localData").isOverwritable =
                    isOverwritable ?? false;
            }
            return false;
        });
        // TODO: Add event to open the default ("This SDB") column.
});
appColumnCL.outwardCallbacks.push(function($ci) {
    $ci
        .on("open-column", function(event, contextData, dir, isOverwritable) {
            $(this).parent().trigger("open-colum",
                [contextData, dir, isOverwritable]
            );
            return false;
        })
        .on("close-column", function() {
            $(this).remove();
            return false;
        })
        .one("click", function() {
            $(this).data("localData").isOverwritable = false;
        });
});







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
export var columnMainCL = new ContentLoader(
    "PageArea",
    /* Initial HTML */
    '<main></main>',
    appColumnCL
);


//
//
//
// /* Events that add tabs and add/load associated pages to these */
//
// pagesWithTabHeaderCL.outwardCallbacks.push(function($ci) {
//     $ci.data("pageSpecs", {})
//         .on("add-page", function(event, tabTitle, contentKey, pageData) {
//             let pageCL = pagesWithTabHeaderCL.relatedCL(contentKey);
//             $(this).data("pageSpecs")[tabTitle] =
//                 {cl:pageCL, data:pageData};
//             return false;
//         })
//         .on("open-page", function(event, tabTitle) {
//             let $this = $(this);
//             let pageSpec = $this.data("pageSpecs")[tabTitle];
//             $(this).children('.CI.ColumnMain')
//                 .trigger("open-page", [tabTitle, pageSpec.cl, pageSpec.data]);
//             return false;
//         })
//         .on("close-page", function(event, tabTitle) {
//             $(this).children('.CI.ColumnMain')
//                 .trigger("open-page", [tabTitle]);
//             return false;
//         })
//         .on("add-tab", function(event, tabTitle) {
//             $(this).children('.CI.ColumnHeader')
//                 .trigger("add-tab", [tabTitle]);
//             return false;
//         })
//         .on("activate-tab", function(event, tabTitle) {
//             $(this).children('.CI.ColumnHeader')
//                 .trigger("activate-tab", [tabTitle]);
//             return false;
//         })
//         .on("add-tab-and-page", function(
//             event, tabTitle, contentKey, pageData
//         ) {
//             $(this)
//                 .trigger("add-page", [tabTitle, contentKey, pageData])
//                 .trigger("add-tab", [tabTitle]);
//             return false;
//         })
//         .on("open-tab-and-page", function(event, tabTitle) {
//             $(this)
//                 .trigger("activate-tab", [tabTitle])
//                 .trigger("open-page", [tabTitle]);
//             return false;
//         })
//         .on("tab-selected", function(event, tabTitle) {
//             $(this).trigger("open-page", [tabTitle]);
//             return false;
//         });
// });
//
// columnHeaderCL.outwardCallbacks.push(function($ci) {
//     $ci
//         .on("add-tab", function(event, tabTitle) {
//             $(this).find('.CI.TabNavList')
//                 .trigger("add-tab", [tabTitle]);
//             return false;
//         })
//         .on("activate-tab", function(event, tabTitle) {
//             $(this).find('.CI.TabNavList')
//                 .trigger("activate-tab", [tabTitle]);
//             return false;
//         });
// });
//
// tabNavListCL.outwardCallbacks.push(function($ci) {
//     $ci
//         .on("add-tab", function(event, tabTitle) {
//             let $newTab = $(this).append(
//                     '<li data-title="' + tabTitle + '">' +
//                         '<a class="nav-link" href="#">' +
//                             tabTitle +
//                         '</a>' +
//                     '</li>'
//                 )
//                 .children(':last-child');
//             $newTab.on("click", function() {
//                 $(this)
//                     .trigger("activate-tab", [tabTitle])
//                     .trigger("tab-selected", [tabTitle]);
//                 return false;
//             });
//             return false;
//         })
//         .on("activate-tab", function(event, tabTitle) {
//             $(this).children('li')
//                 .removeClass("active")
//                 .filter('[data-title="' + tabTitle + '"]')
//                 .addClass("active");
//             return false;
//         });
// });
//
// columnMainCL.outwardCallbacks.push(function($ci) {
//     $ci.data("openPagesTitleArr", [])
//         .on("open-page", function(event, tabTitle, pageCL, pageData) {
//             let $this = $(this);
//             if ($this.data("openPagesTitleArr").includes(tabTitle)) {
//                 $this.children().hide();
//                 $this.children('[data-title="' + tabTitle +'"]').show();
//             } else {
//                 $this.data("openPagesTitleArr").push(tabTitle);
//                 $this.children().hide();
//                 pageCL.loadAppended($this, pageData);
//                 $this.children(':last-child').attr("data-title", tabTitle);
//             }
//             return false;
//         })
//         .on("close-page", function(event, tabTitle) {
//             let $this = $(this);
//             let titleArr = $this.data("openPagesTitleArr");
//             titleArr[titleArr.indexOf(tabTitle)] = null;
//             $this.children('[data-title="' + tabTitle +'"]').remove();
//             return false;
//         })
// });
//
//
//
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
//             let cl = pageFieldCL.relatedCL(contentKey);
//             let len = dataArr.length;
//             for (let i = 0; i < len; i++) {
//                 cl.loadAppended($obj, dataArr[i]);
//             }
//             return false;
//         })
//         .on("prepend-contents", function(event, contentKey, dataArr, selector) {
//             let $obj = (typeof selector === "undefined") ?
//                 $(this) : $(this).find(selector);
//             let cl = pageFieldCL.relatedCL(contentKey);
//             let len = dataArr.length;
//             for (let i = 0; i < len; i++) {
//                 cl.loadPrepended($obj, dataArr[i]);
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
