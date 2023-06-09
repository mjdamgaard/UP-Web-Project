term
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";




export var predicateTitleCL = new ContentLoader(
    "PredicateTitle",
    /* Initial HTML template */
    '<<TermTitle>>',
    appColumnCL
);
predicateTitleCL.addCallback("data", function(data) {
    data.termID = data.getFromAncestor("predID");
    data.copyFromAncestor("titleCutOutLevels");
    data.titleCutOutLevels ||= [1, 1];
});

export var termTitleCL = new ContentLoader(
    "TermTitle",
    /* Initial HTML template */
    '<span></span>',
    appColumnCL
);
termTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "termID",
        "titleCutOutLevels",
    ]);
    data.titleCutOutLevels ||= [1, 1];
});
termTitleCL.addCallback(function($ci, data) {
    // if data.titleCutOutLevels == [], simply load the term's (combined)
    // term ID as the title.
    if (data.titleCutOutLevels.length === 0) {
        $ci.append('t' + data.termID.toString());
        return;
    }
    // else query the database for the title (and spec. entity), and append
    // a title with cut-out level given by data.titleCutOutLevels[0]. And if
    // data.titleCutOutLevels cotains more elements, load the TermTitles of
    // the specifying entities as well, and if these are Terms, cut out part
    // of their title as well, depending on the cut-out levels (or just append
    // their term ID, if the data.titleCutOutLevels array is at its end).
    let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
    let reqData = {
        type: "term",
        id: data.termID,
    };
    dbReqManager.query($ci, reqData, function($ci, result) {
        data.termTitle = (result[0] ?? [])[1];
        data.specType = (result[0] ?? [])[2];
        data.specID = (result[0] ?? [])[3];
        let reducedTitle = getReducedTitle(
            data.termTitle, data.titleCutOutLevels[0]
        );
        $ci.append(reducedTitle);
        $ci.find('.spec-entity').each(function() {
            termTitleCL.loadAppended($(this), "SpecEntityTitle", data);
        });
    });
    return false;
});
termTitleCL.addCallback(function($ci, data) {
    $ci.on("click", function() {
        $(this).trigger("open-column", [
            "TermColumn", data, "right"
        ]);
        return false;
    });
});

export var specEntityTitleCL = new ContentLoader(
    "SpecEntityTitle",
    /* Initial HTML template */
    '<<EntityTitle>>',
    appColumnCL
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
    appColumnCL
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
    appColumnCL
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
