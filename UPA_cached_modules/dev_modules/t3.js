
import {
    ContentLoader,
} from "/UPA_scripts.php?id=t2";




export var upaCL = new ContentLoader(
    "ColumnBasedSDBInterface",
    /* Initial HTML */
    '<div id="upa1" class="container sdb-interface-app">' +
        '<<ColumnGroup>>' +
    '</div>'
);
export var columnGroupCL = new ContentLoader(
    "ColumnGroup",
    /* Initial HTML */
    '<div class="container app-column-group">' +
        '<<Column>>' +
    '</div>'
);
columnGroupCL.inwardCallbacks.push(function($ci, data, parentCLArr) {
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

export var columnCL = new ContentLoader(
    "Column",
    /* Initial HTML */
    '<div class="container app-column">' +
        "<<ColumnHeader>>" +
        "<<ColumnMain>>" +
        // "<<ColumnFooter>>" +
    '</div>'
);

export var columnHeaderCL = new ContentLoader(
    "ColumnHeader",
    /* Initial HTML */
    '<header class="container">' +
        '<<TabNavList>>' +
    '</header>'
);
export var columnMainCL = new ContentLoader(
    "ColumnMain",
    /* Initial HTML */
    '<main class="container"></main>'
);
export var columnFooterCL = new ContentLoader(
    "ColumnFooter",
    /* Initial HTML */
    '<footer class="container"></footer>'
);


export var tabNavListCL = new ContentLoader(
    "TabNavList",
    /* Initial HTML */
    '<ul class="nav nav-tabs"></ul>'
);

// push the newly declared contant loaders into upaCL's children array. (These
// children CLs will be modified below (and more children will also be pushed
// to this array), but since they are reference types, these changes will also
// take effect inside upaCL.)
upaCL.childLoaders.push(columnGroupCL);
columnGroupCL.childLoaders.push(columnCL);
columnCL.childLoaders.push(columnHeaderCL);
columnCL.childLoaders.push(columnMainCL);
columnCL.childLoaders.push(columnFooterCL);
upaCL.childLoaders.push(tabNavListCL);




columnMainCL.inwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci.data("open-pages-title-arr", [])
        .on("open-page", function(event, tabTitle, pageCL, pageData) {
            let $this = $(this);
            if ($this.data("open-pages-title-arr").includes(tabTitle)) {
                $this.children().hide();
                $this.children('[data-title="' + tabTitle +'"]').show();
            } else {
                $this.data("open-pages-title-arr").push(tabTitle);
                $this.children().hide();
                pageCL.loadAppended($this, pageData, parentCLArr);
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

columnCL.inwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci.data("page-spec-store", {})
        .on("add-main-page", function(event, tabTitle, contentKey, pageData) {
            let pageCL = columnCL.getRelatedContentLoader(
                contentKey, parentCLArr
            );
            $(this).data("page-spec-store")[tabTitle] =
                {cl:pageCL, data:pageData};
            return false;
        })
        .on("open-main-page", function(event, tabTitle) {
            let $this = $(this);
            let pageSpec = $this.data("page-spec-store")[tabTitle];
            $(this).children('.CI.ColumnMain')
                .trigger("open-page", [tabTitle, pageSpec.cl, pageSpec.data]);
            return false;
        })
        .on("close-main-page", function(event, tabTitle) {
            $(this).children('.CI.ColumnMain')
                .trigger("open-page", [tabTitle]);
            return false;
        })
        .on("add-header-tab", function(event, tabTitle) {
            $(this).children('.CI.ColumnHeader')
                .trigger("add-tab", [tabTitle]);
            return false;
        })
        .on("activate-header-tab", function(event, tabTitle) {
            $(this).children('.CI.ColumnHeader')
                .trigger("activate-tab", [tabTitle]);
            return false;
        })
        .on("add-tab-and-main-page", function(
            event, tabTitle, contentKey, pageData
        ) {
            $(this)
                .trigger("add-main-page", [tabTitle, contentKey, pageData])
                .trigger("add-header-tab", [tabTitle]);
            return false;
        })
        .on("open-tab-and-main-page", function(event, tabTitle) {
            $(this)
                .trigger("activate-header-tab", [tabTitle])
                .trigger("open-main-page", [tabTitle]);
            return false;
        })
        .on("tab-selected", function(event, tabTitle) {
            $(this).trigger("open-main-page", [tabTitle]);
            return false;
        });
});




/* <<TabNavList>>
 * This CL class is responsible for the apperance of a tab
 * nav bar, and for sending click event signals to its CI parent and handling
 * events coming from its parent (e.g. to add or change tabs).
 **/

tabNavListCL.inwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci
        .on("add-tab", function(event, tabTitle) {
            let $newTab = $(this).append(
                    '<li data-title="' + tabTitle + '"> <a href="#">' +
                    tabTitle + '</a> </li>'
                )
                .children(':last-child');
            $newTab.on("click", function() {
                $(this).parent().closest('.CI') // gets the TabNavList parent
                    .trigger("activate-tab", [tabTitle])
                    .parent().closest('.CI') // gets the parent of TabNavList.
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

columnHeaderCL.inwardCallbacks.push(function($ci, data, parentCLArr) {
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
        })
        .on("tab-selected", function(event, tabTitle) {
            $(this).parent().closest('.CI')
                .trigger("tab-selected", [tabTitle]);
            return false;
        });
});



export var mainPageCL = new ContentLoader(
    "MainPage",
    /* Initial HTML */
    '<div>' +
        '<<ColumnFooter>>' +
    '</div>'
);
columnCL.childLoaders.push(mainPageCL);

// test.
mainPageCL.inwardCallbacks.push(function($ci, data, parentCLArr) {
    $ci.prepend(
        '<span>Hello, I will be a main page generated from: ' +
        JSON.stringify(data)
    );
});

export var categoryColumnCL = new ContentLoader(
    "CategoryColumn",
    /* Initial HTML */
    '<<Column>>'
);
columnGroupCL.childLoaders.push(categoryColumnCL);


categoryColumnCL.outwardCallbacks.push(function($ci, data, parentCLArr) {
    var pageData = "Supercategories";
    $ci.trigger(
        "add-tab-and-main-page", ["Supercategories", "MainPage", pageData]
    );
    pageData = "Subcategories";
    $ci.trigger(
        "add-tab-and-main-page", ["Subcategories", "MainPage", pageData]
    );
    pageData = "Elements";
    $ci.trigger(
        "add-tab-and-main-page", ["Elements", "MainPage", pageData]
    );

    $ci.trigger("open-tab-and-main-page", ["Subcategories"]);
});
