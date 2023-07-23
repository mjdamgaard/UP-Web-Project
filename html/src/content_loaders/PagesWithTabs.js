
import {
    ContentLoader, DataNode
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterface.js";




/* Pages with tab headers */

export var pagesWithTabsCL = new ContentLoader(
    "PagesWithTabs",
    /* Initial HTML template */
    '<div>' +
        "<<TabHeader>>" +
        "<<PagesContainer>>" +
    '</div>',
    sdbInterfaceCL
);

export var tabHeaderCL = new ContentLoader(
    "TabHeader",
    /* Initial HTML template */
    '<div>' +
        '<ul class="nav nav-tabs"></ul>' +
    '</div>',
    pagesWithTabsCL
);
export var pagesContainerCL = new ContentLoader(
    "PagesContainer",
    /* Initial HTML template */
    '<div></div>',
    pagesWithTabsCL
);

// TODO: Refactor the code below..


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
                let resultingPageData = new DataNode(
                    $this.data("data"), pageData ?? {}
                );
                $this.data("openPagesTitleArr").push(tabTitle);
                $this.children().hide();
                pagesContainerCL.loadAppended(
                    $this, contentKey, resultingPageData
                );
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
    data.tabAndPageDataArr ??= data.getFromAncestor("tabAndPageDataArr");
    let len = (data.tabAndPageDataArr ?? []).length;
    for (let i = 0; i < len; i++) {
        $ci.trigger("add-tab-and-page", data.tabAndPageDataArr[i]);
    }
});

// make PagesWithTabs open a specified default tab automatically.
pagesWithTabsCL.addCallback("data", function(data) {
    data.defaultTab = data.getFromAncestor("defaultTab") ?? false;
});
pagesWithTabsCL.addCallback(function($ci, data) {
    if (data.defaultTab) {
        $ci.trigger("open-tab-and-page", [data.defaultTab]);
        return false;
    }
});
