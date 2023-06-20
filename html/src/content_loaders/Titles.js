
import {
    ContentLoader, ChildData
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/ColumnInterface.js";





export var termTitleCL = new ContentLoader(
    "TermTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
termTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "termID",
    ]);debugger;
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
        data.defTermID = (result[0] ?? [])[2];
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
            data.cxtDefTermID = (result[0] ?? [])[2];
            loadTermTitleHTML($ci, data);
        });
    });
    return false;
});

export function loadTermTitleHTML($ci, data) {
    data = data ?? $ci.data("data");
    if (!data.cxtID) {
        if (!data.defTermID) {
            termTitleCL.loadAppended($ci, "SimpleTitle", data);
        } else {
            termTitleCL.loadAppended($ci, "IllFormedTitle", data);
        }
        return;
    }
    if (data.cxtDefTermID) {
        termTitleCL.loadAppended($ci, "IllFormedTitle", data);
        return;
    }
    let cxtLeadChar = data.cxtDefStr.substring(0, 1);
    if (data.defTermID && cxtLeadChar !== ":") {
        termTitleCL.loadAppended($ci, "IllFormedTitle", data);
        return;
    }
    if (cxtLeadChar === ":") {
        termTitleCL.loadAppended($ci, "TemplateInstanceTitle", data);
        return;
    }
    let termLeadChar = data.defStr.substring(0, 1);
    if (!data.cxtDefStr && (termLeadChar === "/" || termLeadChar === "+")) {
        termTitleCL.loadAppended($ci, "IllFormedTitle", data);
        return;
    }
    if (termLeadChar === "/") {
        termTitleCL.loadAppended($ci, "SubcontextTitle", data);
        return;
    }
    if (termLeadChar === "+") {
        termTitleCL.loadAppended($ci, "ConcatenatedStringTitle", data);
        return;
    }
    if (termLeadChar === "!") {
        termTitleCL.loadAppended($ci, "StringTitle", data);
        return;
    }
    termTitleCL.loadAppended($ci, "StandardTitle", data);
}

export var illFormedTitleCL = new ContentLoader(
    "IllFormedTitle",
    /* Initial HTML template */
    '<span>Ill-formed title</span>',
    sdbInterfaceCL
);
export var standardTitleCL = new ContentLoader(
    "StandardTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
standardTitleCL.addCallback(function($ci, data) {
    termTitleCL.loadAppended($ci, "SimpleTitle", data);
    let cxtID = data.getFromAncestor("cxtID");
    if (cxtID) {
        $ci.append(' (<span class="cxt-title">');
        termTitleCL.loadAppended(
            $ci, "SimpleTitle", new ChildData(data, {
                defStr: data.getFromAncestor("cxtDefStr"),
                termID: data.getFromAncestor("cxtID"),
                cxtID: false,
                cxtDefStr: false,
            })
        );
        $ci.append('</span>)');
    }
});
export var simpleTitleCL = new ContentLoader(
    "SimpleTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
simpleTitleCL.addCallback(function($ci, data) {
    // $ci.append(getReducedTitle(data.getFromAncestor("defStr")));
            $ci.append(data.getFromAncestor("defStr"));
    $ci.on("click", function() {
        // TODO: implement..
    })
});
export var subcontextTitleCL = new ContentLoader(
    "SubcontextTitle",
    /* Initial HTML template */
    '<<StandardTitle>>',
    sdbInterfaceCL
);
// subcontextTitleCL.addCallback(function($ci, data) {
//     $ci.find('.cxt-title').after('/');
// }); // Do this with CSS instead.



export var templateInstanceTitleCL = new ContentLoader(
    "TemplateInstanceTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
templateInstanceTitleCL.addCallback(function($ci, data) {

});


export var stringTitleCL = new ContentLoader(
    "StringTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
stringTitleCL.addCallback(function($ci, data) {
    $ci.append(data.getFromAncestor("defStr").substring(1));
});


// return (
//     '<span class="def-str">' +
//         getReducedString(data.defStr) +
//     '</span>' +
//     '(' +
//         '<span class="cxt-def-str">' +
//             getReducedString(data.cxtDefStr) +
//         '</span>' +
//     ')'
// );

// !/[^\\]\$t/.test(data.cxtDefStr.replaceAll("\\\\", ""))







termTitleCL.addCallback(function($ci, data) {
    $ci.on("click", function() {
        $(this).trigger("open-column", [
            "TermPage", data, "right"
        ]);
        return false;
    });
});

export var specEntityTitleCL = new ContentLoader(
    "SpecEntityTitle",
    /* Initial HTML template */
    '<<EntityTitle>>',
    sdbInterfaceCL
);
specEntityTitleCL.addCallback("data", function(data) {
    data.entityType = data.getFromAncestor("specType");
    data.entityID = data.getFromAncestor("specID");
    data.titleCutOutLevels = data.getFromAncestor("titleCutOutLevels").slice(1);
});

export var entityTitleCL = new ContentLoader(
    "EntityTitle",
    /* Initial HTML template */
    '<span></span>',
    sdbInterfaceCL
);
entityTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entityType",
        "entityID",
        // "titleCutOutLevels",
    ]);
});
// entityTitleCL.addCallback(function($ci, data) {
//     if (data.entityType === "t") {
//         entityTitleCL.loadAppended($ci, "TermTitle", data);
//     } else if (data.entityType === "c") {
//         entityTitleCL.loadAppended($ci, "ContextTitle", data);
//     } else {
//         $ci.append(
//             '<span class="clickable-text text-primary">' +
//                 data.entityType + data.entityID.toString() +
//             '</span>'
//         );
//         $ci.on("click", function() {
//             $(this).trigger("open-column", [
//                 "EntityColumn", data, "right"
//             ]);
//             return false;
//         });
//     }
// });



export var userTitleCL = new ContentLoader(
    "UserTitle",
    /* Initial HTML template */
    '<<EntityTitle>>', // TODO: change to look up the username.
    sdbInterfaceCL
);






//TODO: Reimplement this function should that '{', '}' and '$' can all be
// escaped (using backslash).
export function getReducedTitle(title, cutOutLevel) {
    let retArray = [];
    let retArrayLen = 0;
    let titleLen = title.length;
    let pos = 0;
    let currentLevel = 0;
    while (pos < titleLen) {
        let nextLeftParPos = title.indexOf('{', pos);
        if (nextLeftParPos === -1) {
            nextLeftParPos = titleLen;
        }
        let nextRightParPos = title.indexOf('}', pos);
        if (nextRightParPos === -1) {
            nextRightParPos = titleLen;
        }
        if (nextLeftParPos < nextRightParPos) {
            if (currentLevel >= cutOutLevel) {
                retArray[retArrayLen] = title.slice(pos, nextLeftParPos);
                retArrayLen++;
            }
            pos = nextLeftParPos + 1;
            currentLevel += 1;
        } else if (nextLeftParPos > nextRightParPos) {
            if (currentLevel >= cutOutLevel) {
                retArray[retArrayLen] = title.slice(pos, nextRightParPos);
                retArrayLen++;
            }
            pos = nextRightParPos + 1;
            currentLevel -= 1;
        } else {
            if (currentLevel !== 0) {
                return title;
            }
            if (cutOutLevel === 0) {
                retArray[retArrayLen] = title.slice(pos);
            }
            break;
        }
        // simply return the title as is if the curly brackets are ill-formed.
        if (currentLevel < 0) {
            return title;
        }
    }
    if (cutOutLevel > 0 && retArray.length === 0) {
        return getReducedTitle(title, cutOutLevel - 1)
    } else {
        return (
            '<span class="clickable-text text-primary">' +
                retArray.join('')
                .replaceAll(
                    '$',
                    '</span>' +
                        '<span class="spec-entity"></span>' +
                    '<span class="clickable-text text-primary">'
                ) +
            '</span>'
        );
    }
}
