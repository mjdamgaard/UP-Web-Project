
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=t1";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=t2";




export var upaCL = new ContentLoader(
    "ColumnBasedSDBInterface",
    /* Initial HTML */
    '<div id="upa1" class="sdb-interface-app">' +
        '<<ColumnGroup>>' +
    '</div>'
);
export var columnGroupCL = new ContentLoader(
    "ColumnGroup",
    /* Initial HTML */
    '<div class="app-column-group">' +
        '<<Column>>' +
    '</div>',
    upaCL
);
columnGroupCL.inwardCallbacks.push(function($ci, data) {
    switch (data.termID.substring(0, 1)) {
        case "c":
            $ci.find('.placeholder').attr("data-key", "CategoryColumn");
            break;
        default:
            throw (
                "Term type '" + data.termID.substring(0, 1) +
                "' has not been implemented yet"
            );
    }
});
columnGroupCL.outwardCallbacks.push(function($ci, data) {
    $ci.css({
        padding: "0px 20px 0px 20px"
    });
});

export var columnCL = new ContentLoader(
    "Column",
    /* Initial HTML */
    '<div class="app-column">' +
        "<<ColumnHeader>>" +
        "<<ColumnMain>>" +
        // "<<ColumnFooter>>" +
    '</div>',
    columnGroupCL
);
export var columnHeaderCL = new ContentLoader(
    "ColumnHeader",
    /* Initial HTML */
    '<header class="">' +
        '<<TabNavList>>' +
    '</header>',
    columnCL
);
export var columnMainCL = new ContentLoader(
    "ColumnMain",
    /* Initial HTML */
    '<main class=""></main>',
    columnCL
);

export var tabNavListCL = new ContentLoader(
    "TabNavList",
    /* Initial HTML */
    '<ul class="nav nav-tabs"></ul>',
    upaCL
);
tabNavListCL.nestedCSSRules.push(
    '& > li > a { padding: 7px 12px; }'
)
// tests:
// tabNavListCL.nestedCSSRules.push(
//     'padding: 100px 100px; background-color: blue;'
// ); // Works.
// tabNavListCL.nestedCSSRules.push(
//     '& > li > a { padding: 70px 12px; }'
// ); // Works.
// tabNavListCL.nestedCSSRules.push(
//     'li > a { padding: 70px 12px; }'
// ); // Works.
tabNavListCL.nestedCSSRules.push(
    '&:hover { padding: 70px 12px; }'
); // Works.



columnCL.outwardCallbacks.push(function($ci, data) {
    $ci.data("page-spec-store", {})
        .on("add-page", function(event, tabTitle, contentKey, pageData) {
            let pageCL = columnCL.getRelatedContentLoader(contentKey);
            $(this).data("page-spec-store")[tabTitle] =
                {cl:pageCL, data:pageData};
            return false;
        })
        .on("open-page", function(event, tabTitle) {
            let $this = $(this);
            let pageSpec = $this.data("page-spec-store")[tabTitle];
            $(this).children('.CI.ColumnMain')
                .trigger("open-page", [tabTitle, pageSpec.cl, pageSpec.data]);
            return false;
        })
        .on("close-page", function(event, tabTitle) {
            $(this).children('.CI.ColumnMain')
                .trigger("open-page", [tabTitle]);
            return false;
        })
        .on("add-tab", function(event, tabTitle) {
            $(this).children('.CI.ColumnHeader')
                .trigger("add-tab", [tabTitle]);
            return false;
        })
        .on("activate-tab", function(event, tabTitle) {
            $(this).children('.CI.ColumnHeader')
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




columnHeaderCL.outwardCallbacks.push(function($ci, data) {
    $ci
        .on("add-tab", function(event, tabTitle) {
            $(this).find('.CI.TabNavList')
                .trigger("add-tab", [tabTitle]);
            return false;
        })
        .on("activate-tab", function(event, tabTitle) {
            $(this).find('.CI.TabNavList')
                .trigger("activate-tab", [tabTitle]);
            return false;
        });
});


tabNavListCL.outwardCallbacks.push(function($ci, data) {
    $ci
        .on("add-tab", function(event, tabTitle) {
            let $newTab = $(this).append(
                    '<li data-title="' + tabTitle + '"> <a href="#">' +
                    tabTitle + '</a> </li>'
                )
                .children(':last-child');
            $newTab.on("click", function() {
                $(this)
                    .trigger("activate-tab", [tabTitle])
                    .trigger("tab-selected", [tabTitle]);
                return false;
            });
            return false;
        })
        .on("activate-tab", function(event, tabTitle) {
            $(this).children('li')
                .removeClass("active")
                .filter('[data-title="' + tabTitle + '"]')
                .addClass("active");
            return false;
        });
});


columnMainCL.outwardCallbacks.push(function($ci, data) {
    $ci.data("open-pages-title-arr", [])
        .on("open-page", function(event, tabTitle, pageCL, pageData) {
            let $this = $(this);
            if ($this.data("open-pages-title-arr").includes(tabTitle)) {
                $this.children().hide();
                $this.children('[data-title="' + tabTitle +'"]').show();
            } else {
                $this.data("open-pages-title-arr").push(tabTitle);
                $this.children().hide();
                pageCL.loadAppended($this, pageData);
                $this.children(':last-child').attr("data-title", tabTitle);
            }
            return false;
        })
        .on("close-page", function(event, tabTitle) {
            let $this = $(this);
            let titleArr = $this.data("open-pages-title-arr");
            titleArr[titleArr.indexOf(tabTitle)] = null;
            $this.children('[data-title="' + tabTitle +'"]').remove();
            return false;
        })
});





export var pageFieldCL = new ContentLoader(
    "PageField",
    /* Initial HTML */
    '<div></div>',
    columnCL
);
pageFieldCL.outwardCallbacks.push(function($ci, data) {
    $ci.data('db-request-manager', new DBRequestManager())
        .on("query-db", function(event, reqData, cacheKey, callback) {
            let $this = $(this);
            let dbReqManager = $this.data('db-request-manager');
            dbReqManager.query($this, reqData, cacheKey, callback);
            return false;
        })
        .on("append-cis", function(event, contentKey, dataArr, selector) {
            let $obj = (typeof selector === "undefined") ?
                $(this) : $(this).find(selector);
            let cl = pageFieldCL.getRelatedContentLoader(contentKey);
            let len = dataArr.length;
            for (let i = 0; i < len; i++) {
                cl.loadAppended($obj, dataArr[i]);
            }
            return false;
        });
        // TODO: add a prepend-cis event also, after having debugged.
});
export var termListCL = new ContentLoader(
    "TermList",
    /* Initial HTML */
    '<<PageField>>',
    columnCL
);
termListCL.outwardCallbacks.push(function($ci, data) {
    $ci.append('<ul class="container"></ul>');
});
termListCL.outwardCallbacks.push(function($ci, data) {
    $ci
        .on("append-elements", function(event, contentKey, elemDataArr) {
            $(this).trigger("append-cis", [contentKey, elemDataArr, 'ul, ol']);
            return false;
        })
        .on("empty", function(event, elemDataArr, elemCL) {
            $(this).children('ul, ol').empty();
            return false;
        });
});


export var extensibleTermListCL = new ContentLoader(
    "ExtensibleTermList",
    /* Initial HTML */
    '<<TermList>>',
    columnCL
);
// TODO: Add a callback that adds a button at the bottom of the ci, which when
// pressed, adds elements to the list, either cached ones or ones that are then
// queried.



export var termListElementCL = new ContentLoader(
    "TermListElement",
    /* Initial HTML */
    '<div></div>',
    columnCL
);



/* Test */

export var categoryListElementCL = new ContentLoader(
    "CategoryListElement",
    /* Initial HTML */
    '<<TermListElement>>',
    columnCL
);
categoryListElementCL.outwardCallbacks.push(function($ci, data) {
    $ci.append(
        '<span>Hello, I will become a category term list element</span>'
    );
});

export var supercategoryPageCL = new ContentLoader(
    "SupercategoryPage",
    /* Initial HTML */
    '<<Column>>',
    columnCL
);
supercategoryPageCL.outwardCallbacks.push(function($ci, data) {
    $ci.trigger(
        "add-tab-and-page",
        ["Defining supercategories", "DefSuperCatsPage", data]
    );
    $ci.trigger("open-tab-and-page", ["Defining supercategories"]);
    // open the "DefSuperCatsPage" tab as the default one.
    // TODO
});

export var defSuperCatsPageCL = new ContentLoader(
    "DefSuperCatsPage",
    /* Initial HTML */
    '<<ExtensibleTermList>>',
    columnCL
);
defSuperCatsPageCL.outwardCallbacks.push(function($ci, data) {
    let elemDataArr = [{}, {}, {}];
    $ci.trigger("append-elements", ["CategoryListElement", elemDataArr]);
});

export var mainPageCL = new ContentLoader(
    "MainPage",
    /* Initial HTML */
    '<div></div>',
    columnCL
);
mainPageCL.inwardCallbacks.push(function($ci, data) {
    $ci.prepend(
        '<span>Hello, I will be a main page generated from: ' +
        JSON.stringify(data) + '</span>'
    );
});

export var categoryColumnCL = new ContentLoader(
    "CategoryColumn",
    /* Initial HTML */
    '<<Column>>',
    columnGroupCL
);


categoryColumnCL.outwardCallbacks.push(function($ci, data) {
    var pageData = "Supercategories";
    $ci.trigger(
        "add-tab-and-page", ["Supercategories", "SupercategoryPage", pageData]
    );
    pageData = "Subcategories";
    $ci.trigger(
        "add-tab-and-page", ["Subcategories", "MainPage", pageData]
    );
    pageData = "Elements";
    $ci.trigger(
        "add-tab-and-page", ["Elements", "MainPage", pageData]
    );
    // open the "Subcategories" tab as the default one.
    $ci.trigger("open-tab-and-page", ["Subcategories"]);
});
