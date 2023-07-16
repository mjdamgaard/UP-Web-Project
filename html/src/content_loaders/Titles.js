
import {
    ContentLoader, ChildData
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";





export var entityTitleCL = new ContentLoader(
    "EntityTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
entityTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "recLevel",
        "maxRecLevel",
    ]);
    data.recLevel ??= -1;;
    data.recLevel++;
    data.maxRecLevel ??= 2;;
    // TODO: This solution does not seem robust since a EntityTitle might inherit
    // a too high (not reset) recLevel (right?). So figure this out and then
    // find an altered solution if this is indeed needed.
    data.isFullTitle = data.getFromAncestor("isFullTitle", 1) ?? false;
});
entityTitleCL.addCallback(function($ci, data) {
    if (!data.entID) {
        return;
        // TODO: Solve a current bug where the last Entity is displayed when
        // entID is a non-existing positive ID.
    }
    if (data.recLevel > data.maxRecLevel) {
        data.linkContent = data.entID;
        entityTitleCL.loadAppended($ci, "EntityLink", data);
        return;
    }
    let reqData = {
        type: "ent",
        id: data.entID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.entType = (result[0] ?? [])[0]; // TODO: Display the type as well,
        // at least for full titles.
        data.tmplID = (result[0] ?? [])[1];
        data.defStr = (result[0] ?? [])[2];
        if (!data.tmplID) {
            loadEntityTitleHTML($ci, data);
            return;
        }
        let reqData = {
            type: "ent",
            id: data.tmplID,
        };
        dbReqManager.query($ci, reqData, data, function($ci, result, data) {
            data.tmplDefStr = (result[0] ?? [])[2];
            loadEntityTitleHTML($ci, data);
        });
        // parse the defItem string array from defStr, then prefetch all
        // enitities referenced by IDs (with syntax pattern /^#[1-9][0-9]*$/),
        // but only if the current recLevel is less than maxRecLevel.
        if (data.recLevel < data.maxRecLevel) {
            data.defItemStrArr = data.defStr
                .replaceAll("\\\\", "&bsol;")
                .replaceAll("\\|", "&#124;")
                .split("|");
            data.defItemStrArr.forEach(function(val) {
                if (/^#[1-9][0-9]*$/.test(val)) {
                    let reqData = {
                        type: "ent",
                        id: val.substring(1),
                    };
                    dbReqManager.query($ci, reqData, function($ci, result) {});
                }
            });
        }
    });
});

export function loadEntityTitleHTML($ci, data) {
    data = data ?? $ci.data("data");
    if (!data.tmplID) {
        data.linkContent = data.defStr;
        entityTitleCL.loadAppended($ci, "EntityLink", data);
    } else if (data.tmplID === 2) {
        entityTitleCL.loadAppended($ci, "UserTitle", data);
    } else if (data.tmplID === 4) {
        entityTitleCL.loadAppended($ci, "TextTitle", data);
    } else if (data.tmplID === 5) {
        entityTitleCL.loadAppended($ci, "BinaryTitle", data);
    } else  {
        entityTitleCL.loadAppended($ci, "TemplateInstanceTitle", data);
    }
}

export var entityLinkCL = new ContentLoader(
    "EntityLink",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
entityLinkCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entID",
        "linkContent",
    ]);
});
entityLinkCL.addCallback(function($ci, data) {
    $ci.addClass("clickable-text text-primary");
    $ci.append(data.linkContent);
    $ci.on("click", function() {
        let childData = new ChildData (data, {
            cl: sdbInterfaceCL.getRelatedCL("EntityPage"),
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
        "tmplDefStr",
        "defItemStrArr",
        "isFullTitle",
    ]);
});
templateInstanceTitleCL.addCallback(function($ci, data) {
    if (data.isFullTitle) {
        data.linkContent = getTransformedFullTitleTemplate(data.tmplDefStr);
    } else {
        data.linkContent = getTransformedTitleTemplate(data.tmplDefStr);
    }
    templateInstanceTitleCL.loadAppended($ci, "EntityLink", data);
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
            $ci.find('.CI.EntityLink').append(
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
        templateInstanceTitleCL.loadAppended($obj, "EntityTitle",
            new ChildData(data, {
                entID: defItemStr.substring(1),
            })
        );
    } else {
        if (defItemStr.substring(0, 2) === "\\#") {
            defItemStr = "#" + defItemStr.substring(2);
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



export var fullEntityTitleCL = new ContentLoader(
    "FullEntityTitle",
    /* Initial HTML template */
    '<<EntityTitle>>', // TODO: change to look up the username.
    sdbInterfaceCL
);
fullEntityTitleCL.addCallback("data", function(data) {
    data.isFullTitle = true;
});

export var templateDisplayCL = new ContentLoader(
    "TemplateDisplay",
    /* Initial HTML template */
    '<span>' +
        'Template: <<EntityTitle>>' +
    '</span>',
    sdbInterfaceCL
);
templateDisplayCL.addCallback("data", function(data) {
    data.entID = data.getFromAncestor("tmplID") ?? 1;
    data.tmplID = null;
});


export var userTitleCL = new ContentLoader(
    "UserTitle",
    /* Initial HTML template */
    '<span></span>', // TODO: change to look up the username.
    sdbInterfaceCL
);
// TODO: Implement to fetch and display the username (perhaps like:
// "User: username (id)").
