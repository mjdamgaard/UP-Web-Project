
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
        "recLevel",
        "maxRecLevel",
    ]);
    data.recLevel ??= -1;;
    data.recLevel++;
    data.maxRecLevel ??= 2;;
});
termTitleCL.addCallback(function($ci, data) {
    if (data.recLevel > data.maxRecLevel) {
        data.linkContent = data.termID;
        termTitleCL.loadAppended($ci, "TermLink", data);
        return;
    }
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
            data.cxtDefStr = (result[0] ?? [])[1];
            loadTermTitleHTML($ci, data);
        });
        // parse the defItem string array from defStr, then prefetch all Terms
        // referenced by IDs (with the syntax pattern /^#[1-9][0-9]*$/), but
        // only if the current recLevel is less than maxRecLevel.
        if (data.recLevel < data.maxRecLevel) {
            data.defItemStrArr = data.defStr
                .replaceAll("\\\\", "&bsol;")
                .replaceAll("\\|", "&#124;")
                .split("|");
            data.defItemStrArr.forEach(function(val) {
                if (/^#[1-9][0-9]*$/.test(val)) {
                    let reqData = {
                        type: "term",
                        id: val.substring(1),
                    };
                    dbReqManager.query($ci, reqData, function($ci, result) {});
                }
            });
        }
    });
});

export function loadTermTitleHTML($ci, data) {
    data = data ?? $ci.data("data");
    if (!data.cxtID) {
        data.linkContent = data.defStr;
        termTitleCL.loadAppended($ci, "TermLink", data);
    } else if (data.cxtID === 2) {
        termTitleCL.loadAppended($ci, "UserTitle", data);
    } else if (data.cxtID === 4) {
        termTitleCL.loadAppended($ci, "TextTitle", data);
    } else if (data.cxtID === 5) {
        termTitleCL.loadAppended($ci, "BinaryTitle", data);
    } else  {
        termTitleCL.loadAppended($ci, "TemplateInstanceTitle", data);
    }
}

export var termLinkCL = new ContentLoader(
    "TermLink",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
termLinkCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "termID",
        "linkContent",
    ]);
});
termLinkCL.addCallback(function($ci, data) {
    $ci.addClass("clickable-text text-primary");
    $ci.append(data.linkContent);
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
    ]);
});
templateInstanceTitleCL.addCallback(function($ci, data) {
    data.linkContent = getTransformedTitleTemplate(data.cxtDefStr);
    templateInstanceTitleCL.loadAppended($ci, "TermLink", data);
    let defItemStrArr = data.defItemStrArr;
    let nextDefItemStr = 0;
    $ci.find('.def-item').each(function() {
        let defItemStr = defItemStrArr[nextDefItemStr];
        nextDefItemStr++;
        if (/^#[1-9][0-9]*$/.test(defItemStr)) {
            templateInstanceTitleCL.loadReplaced($(this), "TermTitle",
                new ChildData(data, {
                    termID: defItemStr.substring(1),
                })
            );
        } else {
            if (defItemStr.substring(0, 1) === "\\") {
                defItemStr = defItemStr.substring(1);
            }
            $(this).append(defItemStr);
        }
    });
});
export function getTransformedTitleTemplate(title) {
    return title
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .replace(/^[^\{]*\{/g, "")
        .replace(/\}[^\{]*$/g, "")
        .replaceAll(/\}[^\{]*\{/g, "")
        .replaceAll(/<[^<>]>/g, '<span class="def-item"></span>')
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

// export function sanitize(string) {
//     return string = string
//         .replaceAll("&", "&amp;")
//         .replaceAll("<", "&lt;")
//         .replaceAll(">", "&gt;")
//         .replaceAll('"', "&quot;")
//         .replaceAll("'", "&apos;");
// }
// export function reverseSanitize(string) {
//     return string = string
//         .replaceAll("&apos;", "'")
//         .replaceAll("&quot;", '"')
//         .replaceAll("&gt;", ">")
//         .replaceAll("&lt;", "<")
//         .replaceAll("&amp;", "&");
// }


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
