
import {
    ContentLoader,
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
        data.defTermID = (result[0] ?? [])[2];
        let reqData = {
            type: "term",
            id: data.cxtID,
        };
        dbReqManager.query($ci, reqData, data, function($ci, result, data) {
            data.cxtDefStr = (result[0] ?? [])[1];
            $ci.html(getTermTitleHTML(data));
        });
    });
    return false;
});

export function getTermTitleHTML(data) {
    data = data ?? $ci.data("data");
    if (data.defStr.substring(0, 1) === "/") {
        if (!data.defTermID) {
            return (
                '<span class="def-str">' +
                    getReducedString(data.defStr) +
                '</span>' +
                '(' +
                    '<span class="cxt-def-str">' +
                        getReducedString(data.cxtDefStr) +
                    '</span>' +
                ')'
            );
        } else {
            // ...
        }
    }
}










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
