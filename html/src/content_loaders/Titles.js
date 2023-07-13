
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
    data.isFullTitle = data.getFromAncestor("isFullTitle", 1) ?? false;
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
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
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
        let childData = new ChildData (data, {
            cl: sdbInterfaceCL.getRelatedCL("TermPage"),
            recLevel: null,
            maxRecLevel: null,
        });
        $(this).trigger("open-column", ["AppColumn", childData, "right"]);
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
        "defItemStrArr",
        "isFullTitle",
    ]);
});
templateInstanceTitleCL.addCallback(function($ci, data) {
    if (data.isFullTitle) {
        data.linkContent = getTransformedFullTitleTemplate(data.cxtDefStr);
    } else {
        data.linkContent = getTransformedTitleTemplate(data.cxtDefStr);
    }
    templateInstanceTitleCL.loadAppended($ci, "TermLink", data);
    let defItemStrArr = data.defItemStrArr;
    let nextDefItemStr = 0;
    $ci.find('.def-item').each(function() {
        let defItemStr = defItemStrArr[nextDefItemStr];
        nextDefItemStr++;
        loadDefItemAppended($(this), defItemStr, data);
    });
    // for full titles, append any extra def items that are not expected by the
    // template.
    if (data.isFullTitle) {
        let len = defItemStrArr.length;
        if (nextDefItemStr < len) {
            $ci.find('.CI.TermLink').append(
                '; <span class="extra-def-items"></span>'
            );
            let $obj = $ci.find('.extra-def-items');
            for (let i = nextDefItemStr; i < len - 1; i++) {
                loadExtraDefItemAppended($obj, defItemStrArr[i], data);
                $obj.append(', ');
            }
            loadExtraDefItemAppended($obj, defItemStrArr[len - 1], data);
        }
    }
});
export function loadDefItemAppended($obj, defItemStr, data) {
    if (/^#[1-9][0-9]*$/.test(defItemStr)) {
        templateInstanceTitleCL.loadAppended($obj, "TermTitle",
            new ChildData(data, {
                termID: defItemStr.substring(1),
            })
        );
    } else {
        if (defItemStr.substring(0, 1) === "\\") {
            defItemStr = defItemStr.substring(1);
        }
        $obj.append(defItemStr);
    }
}
export function loadExtraDefItemAppended($obj, defItemStr, data) {
    let colonIndex = defItemStr.indexOf(':');
    if (colonIndex == -1) {
        loadDefItemAppended($obj, defItemStr, data);
    } else {
        $obj.append(defItemStr.substring(0, colonIndex + 1) + " ");
        loadDefItemAppended($obj, defItemStr.substring(colonIndex + 1), data);
    }
}
export function getTransformedTitleTemplate(title) {
    return title
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .replace(/^[^\{]*\{/g, "")
        .replace(/\}[^\{]*$/g, "")
        .replaceAll(/\}[^\{]*\{/g, "")
        .replaceAll(/<[^<>]*>/g, '<>')
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll(/&lt;&gt;/g, '<span class="def-item"></span>');
}
export function getTransformedFullTitleTemplate(title) {
    return title
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .replaceAll(/\{/g, "")
        .replaceAll(/\}/g, "")
        .replaceAll(/<[^<>]*>/g, '<>')
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll(/&lt;&gt;/g, '<span class="def-item"></span>');
}



export var fullTermTitleCL = new ContentLoader(
    "FullTermTitle",
    /* Initial HTML template */
    '<<TermTitle>>', // TODO: change to look up the username.
    sdbInterfaceCL
);
fullTermTitleCL.addCallback("data", function(data) {
    data.isFullTitle = true;
});

export var contextDisplayCL = new ContentLoader(
    "ContextDisplay",
    /* Initial HTML template */
    '<span>' +
        'Context: <<TermTitle>>' +
    '</span>',
    sdbInterfaceCL
);
contextDisplayCL.addCallback("data", function(data) {
    data.termID = data.getFromAncestor("cxtID") ?? 1;
    data.cxtID = null;
});


export var userTitleCL = new ContentLoader(
    "UserTitle",
    /* Initial HTML template */
    '<span></span>', // TODO: change to look up the username.
    sdbInterfaceCL
);
// TODO: Implement to fetch and display the username (perhaps like:
// "User: username (id)").
