
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
        "maxRecLevel",
    ]);
    data.copyFromAncestor(["recLevel", "isLinkArr"], 1);
    data.recLevel ??= -1;;
    data.recLevel++;
    data.maxRecLevel ??= 3;;
    data.isLinkArr ??= [true];;
    data.isFullTitle = data.getFromAncestor("isFullTitle", 1) ?? false;
});
entityTitleCL.addCallback(function($ci, data) {
    if (!data.entID) {
        return;
        // TODO: Solve a current bug where the last entity is displayed when
        // entID is a non-existing positive ID. *Hm, now '()' seems to be
        // displayed as the title for some reason, which is fine for now, but
        // do look into this at some point.
    }
    if (data.recLevel > data.maxRecLevel) {
        data.linkContent = "#" + data.entID;
        let contentKey = data.isLinkArr[data.recLevel] ?
            "EntityLink" : "EntityText";
        entityTitleCL.loadAppended($ci, contentKey, data);
        return;
    }
    let reqData = {
        req: "ent",
        id: data.entID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        data.typeID = (result[0] ?? [])[0];
        data.cxtID = (result[0] ?? [])[1];
        data.defStr = (result[0] ?? [])[2];
        if (!data.cxtID) {
            loadEntityTitleHTML($ci, data);
            return;
        }
        let reqData = {
            req: "ent",
            id: data.cxtID,
        };
        dbReqManager.query($ci, reqData, data, function($ci, result, data) {
            data.cxtDefStr = (result[0] ?? [])[2];
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
                        req: "ent",
                        id: val.substring(1),
                    };
                    dbReqManager.query($ci, reqData, function($ci, result) {});
                }
            });
        }
    });
});

export function loadEntityTitleHTML($ci, data) {
    if (!data.cxtID || data.typeID == 3) {
        if (!data.isFullTitle) {
            data.linkContent = data.defStr;
            let contentKey = data.isLinkArr[data.recLevel] ?
                "EntityLink" : "EntityText";
            entityTitleCL.loadAppended($ci, contentKey, data);
        } else {
            let reqData = {
                req: "ent",
                id: data.typeID,
            };
            dbReqManager.query($ci, reqData, data, true,
                function($ci, result, data) {
                    let typeDefStr = (result[0] ?? [])[2];
                    entityTitleCL.loadAppended($ci, "EntityLink", new ChildData(
                        data, {entID: data.typeID, linkContent: typeDefStr}
                    ));
                    $ci.append(' &blacktriangleright; ');
                    data.linkContent = data.defStr;
                    let contentKey = data.isLinkArr[data.recLevel] ?
                        "EntityLink" : "EntityText";
                    entityTitleCL.loadAppended($ci, contentKey, data);
                }
            );
        }
    } else {
        let contentKey = data.isFullTitle ?
            "FullTemplateInstanceTitle" : "TemplateInstanceTitle";
        entityTitleCL.loadAppended($ci, contentKey, data);
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
    });
});
export var entityTextCL = new ContentLoader(
    "EntityText",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
entityTextCL.addCallback("data", function(data) {
    data.copyFromAncestor("linkContent");
});
entityTextCL.addCallback(function($ci, data) {
    $ci.append(data.linkContent);
});

export var templateInstanceTitleCL = new ContentLoader(
    "TemplateInstanceTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
templateInstanceTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "cxtDefStr",
        "defItemStrArr",
        "recLevel", // used in order to hand this on to def item EntityTitles.
        "isLinkArr", // same.
    ]);
});
templateInstanceTitleCL.addCallback(function($ci, data) {
    data.linkContent = getTransformedTitleTemplate(data.cxtDefStr);
    let contentKey = data.isLinkArr[data.recLevel] ?
        "EntityLink" : "EntityText";
    templateInstanceTitleCL.loadAppended($ci, contentKey, data);
    let defItemStrArr = data.defItemStrArr;
    let nextDefItemStr = 0;
    $ci.find('.def-item').each(function() {
        let defItemStr = defItemStrArr[nextDefItemStr];
        nextDefItemStr++;
        loadDefItemAppended($(this), defItemStr, data);
    });
});

export var fullTemplateInstanceTitleCL = new ContentLoader(
    "FullTemplateInstanceTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
fullTemplateInstanceTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "typeID",
        "defStr",
        "cxtDefStr",
        "defItemStrArr",
        "recLevel", // used in order to hand this on to def item EntityTitles.
        "isLinkArr", // same.
    ]);
});
fullTemplateInstanceTitleCL.addCallback(function($ci, data) {
    let reqData = {
        req: "ent",
        id: data.typeID,
    };
    dbReqManager.query($ci, reqData, data, true,
        function($ci, result, data) {
            let typeDefStr = (result[0] ?? [])[2];
            entityTitleCL.loadAppended($ci, "EntityLink", new ChildData(
                data, {entID: data.typeID, linkContent: typeDefStr}
            ));
            $ci.append(' &blacktriangleright; ');
            data.linkContent = getTransformedFullTitleTemplate(
                data.cxtDefStr
            );
            let contentKey = data.isLinkArr[data.recLevel] ?
                "EntityLink" : "EntityText";
            fullTemplateInstanceTitleCL.loadAppended($ci, contentKey, data);
            let defItemStrArr = data.defItemStrArr;
            let nextDefItemStr = 0;
            $ci.find('.def-item').each(function() {
                let defItemStr = defItemStrArr[nextDefItemStr];
                nextDefItemStr++;
                loadDefItemAppended($(this), defItemStr, data);
            });
            // append any extra def items that are not expected by the template.
            let len = defItemStrArr.length;
            if (nextDefItemStr < len) {
                $ci.append(
                    '&blacktriangleright; <span class="extra-def-items"></span>'
                );
                let $obj = $ci.find('.extra-def-items');
                for (let i = nextDefItemStr; i < len - 1; i++) {
                    loadExtraDefItemAppended($obj, defItemStrArr[i], data);
                    $obj.append(', ');
                }
                loadExtraDefItemAppended($obj, defItemStrArr[len - 1], data);
            }
        }
    );
});
export function loadDefItemAppended($obj, defItemStr, data) {
    if (/^#[1-9][0-9]*$/.test(defItemStr)) {
        templateInstanceTitleCL.loadAppended($obj, "EntityTitle",
            new ChildData(data, {
                entID: defItemStr.substring(1),
                recLevel: data.recLevel,
                isLinkArr: data.isLinkArr,
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
    data.isLinkArr = [false, true];
});

export var contextDisplayCL = new ContentLoader(
    "ContextDisplay",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
contextDisplayCL.addCallback("data", function(data) {
    data.copyFromAncestor("entID");
});
contextDisplayCL.addCallback(function($ci, data) {
    let reqData = {
        req: "ent",
        id: data.entID,
    };
    dbReqManager.query($ci, reqData, data, function($ci, result, data) {
        let typeID = (result[0] ?? [])[0];
        let cxtID = (result[0] ?? [])[1];
        if (typeID == 1 || 4 <= typeID && typeID <= 8) {
            return;
        } else if (typeID == 3) {
            $ci.append('Type of derived entities: ');
        } else {
            $ci.append('Template: ');
        }
        if (cxtID) {
            contextDisplayCL.loadAppended($ci, "EntityTitle", new ChildData(
                data, {entID: cxtID}
            ));
        } else {
            $ci.append('<i>none</i>');
        }
    });
});
