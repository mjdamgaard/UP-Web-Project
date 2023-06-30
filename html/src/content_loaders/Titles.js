
import {
    ContentLoader, ChildData
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/SDBInterfaces.js";





export var termTitleCL = new ContentLoader(
    "TermTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
termTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "termID",
    ]);
});
termTitleCL.addCallback(function($ci, data) {
    let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
    let reqData = {
        type: "term",
        id: data.termID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.cxtID = (result[0] ?? [])[0];
        data.defStr = (result[0] ?? [])[1];
        if (!data.cxtID) {
            loadTermTitleHTML($ci, data);
            return;
        }
        let reqData = {
            type: "term",
            id: data.cxtID,
        };
        dbReqManager.query($ci, reqData, data, function($ci, result, data) {
            data.cxtCxtID = (result[0] ?? [])[0];
            data.cxtDefStr = (result[0] ?? [])[1];
            loadTermTitleHTML($ci, data);
        });
    });
});

export function loadTermTitleHTML($ci, data) {
    data = data ?? $ci.data("data");
    if (!data.cxtID) {
        termTitleCL.loadAppended($ci, "SimpleTitle", data);

    } else if (data.cxtID === 2) {
        termTitleCL.loadAppended($ci, "UserTitle", data);

    } else if (data.cxtID === 4) {
        termTitleCL.loadAppended($ci, "TextTitle", data);

    } else if (data.cxtID === 5) {
        termTitleCL.loadAppended($ci, "BinaryTitle", data);

    } else if (data.cxtCxtID === 7) {
        termTitleCL.loadAppended($ci, "TemplateInstanceTitle", data);

    } else {
        // TODO: Change such that the Context title is in its own span (that
        // can then be hidden if one wants to), and possibly remove the
        // parenthises and let CSS add whatever instead.
        termTitleCL.loadAppended($ci, "SimpleTitle", data);
        $ci.append(' (');
        termTitleCL.loadAppended($ci, "SimpleTitle", new ChildData(data, {
            defStr: data.cxtDefStr,
            termID: data.cxtID,
            cxtID: data.cxtCxtID,
            cxtDefStr: null,
        }));
        $ci.append(')');
    }
}

export var simpleTitleCL = new ContentLoader(
    "SimpleTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
simpleTitleCL.addCallback(function($ci, data) {
    $ci.addClass("clickable-text text-primary");
    $ci.append(data.getFromAncestor("defStr"));
    $ci.on("click", function() {
        data.cl = sdbInterfaceCL.getRelatedCL("TermPage");
        $(this).trigger("open-column", [
            "AppColumn", data, "right"
        ]);
        return false;
    })
});

export var termIDTitleCL = new ContentLoader(
    "TermIDTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
termIDTitleCL.addCallback(function($ci, data) {
    $ci.addClass("clickable-text text-primary");
    $ci.append(data.getFromAncestor("termID"));
    $ci.on("click", function() {
        data.cl = sdbInterfaceCL.getRelatedCL("TermPage");
        $(this).trigger("open-column", [
            "AppColumn", data, "right"
        ]);
        return false;
    })
});

export var templateInstanceTitleCL = new ContentLoader(
    "TemplateInstanceTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
templateInstanceTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "defStr",
        "cxtDefStr",
        "defTermID",
    ]);
});
templateInstanceTitleCL.addCallback(function($ci, data) {
    $ci.addClass("clickable-text text-primary");
    $ci.append(getTransformedTitleTemplate(data.cxtDefStr));
    $ci.find('.def-string').each(function() {
        templateInstanceTitleCL.loadReplaced($(this), "SimpleTitle", data);
    });
    $ci.find('.def-term').each(function() {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let reqData = {
            type: "term",
            id: data.defTermID,
        };
        let $this = $(this);
        dbReqManager.query($this, reqData, data, function($obj, result, data) {
            templateInstanceTitleCL.loadReplaced($obj, "SimpleTitle",
                new ChildData(data, {
                    termID: data.defTermID,
                    cxtID: (result[0] ?? [])[0],
                    defStr: (result[0] ?? [])[1],
                    defTermID: (result[0] ?? [])[2],
                })
            );
        });
    });
    let idArr;
    $ci.find('.list-item').each(function() {
        let $this = $(this);
        let n = parseInt($this.attr("class").slice(-1));
        if (!idArr) {
            if (!/^[1-9][0-9]*(,[1-9][0-9]*)*$/.test(data.defStr)) {
                $this.replaceWith('$l[' + n.toString() + ']');
                return;
            }
            idArr = data.defStr.split(',');
        }
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let reqData = {
            type: "term",
            id: idArr[n],
        };
        dbReqManager.query($this, reqData, data, function($obj, result, data) {
            templateInstanceTitleCL.loadReplaced($obj, "SimpleTitle",
                new ChildData(data, {
                    termID: idArr[n],
                    cxtID: (result[0] ?? [])[0],
                    defStr: (result[0] ?? [])[1],
                    defTermID: (result[0] ?? [])[2],
                })
            );
        });
    });
    $ci.on("click", function() {
        data.cl = sdbInterfaceCL.getRelatedCL("TermPage");
        $(this).trigger("open-column", [
            "AppColumn", data, "right"
        ]);
        return false;
    })
});

export function getTransformedTitleTemplate(title) {
    return title
        .replaceAll("\\\\", "&bsol;")
        .replaceAll("\\$", "&dollar;")
        .replaceAll("\\{", "&#x2774;")
        .replaceAll("\\}", "&#x2775;")
        .replace(/^[^\{]*\{/g, "")
        .replace(/\}[^\{]*$/g, "")
        .replaceAll(/\}[^\{]*\{/g, "")
        .replaceAll("$s", '<template class="def-string"></template>')
        .replaceAll("$t", '<template class="def-term"></template>')
        .replaceAll(/\$l\[[0-9]\]/g, s =>
            '<template class="list-item ' +
            s.substring(3, 4) +
            '"></template>'
        );
}





export var userTitleCL = new ContentLoader(
    "UserTitle",
    /* Initial HTML template */
    '<span></span>', // TODO: change to look up the username.
    sdbInterfaceCL
);
// TODO: Implement to fetch and display the username (perhaps like:
// "User: username (id)").



export var fullContextAndTitleFieldCL = new ContentLoader(
    "FullContextAndTitleField",
    /* Initial HTML template */
    '<span></span>', // TODO: change to look up the username.
    sdbInterfaceCL
);

fullContextAndTitleFieldCL.addCallback(prependAllTermInfo);

export function prependAllTermInfo($ci, data) {
    // TODO: Implement.
    // let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
    // let reqData = {
    //     type: "term",
    //     id: data.termID,
    // };
    // // ...
    // dbReqManager.query($ci, reqData, data, function($ci, result, data) {
    //     data.cxtID = (result[0] ?? [])[0];
    //     data.defStr = (result[0] ?? [])[1];
    //     data.defTermID = (result[0] ?? [])[2];
    //     if (!data.cxtID) {
    //         loadTermTitleHTML($ci, data);
    //         return;
    //     }
    //     let reqData = {
    //         type: "term",
    //         id: data.cxtID,
    //     };
    //     dbReqManager.query($ci, reqData, data, function($ci, result, data) {
    //         data.cxtDefStr = (result[0] ?? [])[1];
    //         data.cxtDefTermID = (result[0] ?? [])[2];
    //         loadTermTitleHTML($ci, data);
    //     });
    // });
}
// TODO, just fetch and load paragraphs of SimpleTitles and TermIDTitles (of
// the defTerms) one after the other until a NULL Context is reached and
// prepend each one.
