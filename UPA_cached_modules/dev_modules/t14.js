
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=11";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=12";

import {
    sdbInterfaceCL, appColumnCL,
} from "/UPA_scripts.php?id=13";







// getAveragedSet() takes a userSetsObj = {userWeights, sets} and returns a
// unioned set containing the weighted averaged ratings for any subjects that
// appear in one or more of the sets.
export function getAveragedSet(userSetsObj, sortFlag) {
    // if there is only one set, simply return the set as is.
    let sets = userSetsObj.sets
    let setNum = sets.length;
    if (setNum === 1) {
        return sets[0];
    }
    // else, first sort each array in terms of the subject IDs.
    for (let i = 0; i < setNum; i++) {
        sets[i].sort(row1, row2 => row1[1] - row2[1]);
    }

    let setLengths = sets.map(val => val.length);
    let setLenSum = setLengths.reduce((acc, val) => acc + val, 0);
    let ret = new Array(setLenSum);
    let retLen = 0;
    let positions = new Array(setNum).fill(0);
    let userWeights = userSetsObj.weights;
    let continueLoop = true;
    while (continueLoop) {
        let minSubjID = positions.reduce(
            (acc, val, ind) => Math.min(acc, sets[ind][val][1]), 0
        );
        let weightedRatValOfMinSubjArray = positions.map(
            (val, ind) => (sets[ind][val][1] !== minSubjID) ? "" :
                sets[ind][val][0] * userWeights[ind]
        );
        let weightSum = weightedRatValOfMinSubjArray.reduce(
            (acc, val, ind) => acc + ((val === "") ? 0 : userWeights[ind]), 0
        );

        let averagedRatVal = weightedRatValOfMinSubjArray
            .reduce((acc, val) => acc + val, 0) /
                weightSum;
        ret[retLen] = [averagedRatVal, minSubjID];
            // .sort(row1, row2 => row2[0] - row1[0]); ..
        retLen++;
        // increase the positions.
        for (let i = 0; i < setNum; i++) {
            if (weightedRatValOfMinSubjArray[i] !== "") {
                positions[i] += 1;
            }
        }
        continueLoop = false;
        for (let i = 0; i < setNum; i++) {
            if (positions[i] === setLengths) {
                positions[i] -= 1;
            } else {
                continueLoop = true;
            }
        }
    }
    return ret;
}

export function getCombinedSet(userSetsArr) {
    // TODO..
    // let len = userSetsArr.length;
    // if (len === 1) {
    //     return userSetsArr[0].set
    //         .map(function(row) {
    //             return [
    //                 row[0],
    //                 row[1],
    //                 [],
    //             ];
    //         });
    // }
    // TODO: Implement this function for non-trivial cases as well.
}





/**
 * SetField requires data:
     * RelationSetField:
         * data.relID,
         * data.objType,
         * data.objID,
     * PredicateSetField:
         * data.predID,
     * data.elemContentKey,
     * data.subjType,
     * data.queryNum,
     * data.userWeights = [{userID, weight}, ...],
     * data.initialNum,
     * data.incrementNum.
 * And it also sets/updates data:
     * data.predTitle,
     * data.predID,
     * data.set = [[combRatVal, subjID, ratValArr], ...],
     * data.userSetsArr = [{predID, factorFun, userSetsObj}, ...],
         * userSetsObj = {userWeights, sets},
     * data.ratingLow,
     * data.ratingHigh,
     * data.queryOffset,
     * data.queryAscending.
 */
export var relationSetFieldCL = new ContentLoader(
    "RelationSetField",
    /* Initial HTML template */
    '<<PredicateSetField data:wait>>',
    appColumnCL
);
// NOTE: Since RelationSetField does not try set up any lasting events, this
// works. But do not decorate a CL that then waits for data, like here, and then
// try to have the decorator add events to the CI, since these will just be
// removed when the waiting decoratee finally loads.
relationSetFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "objType",
        "objID",
        "relID",
    ]);
    data.titleCutOutLevels = [2, 1];
});
relationSetFieldCL.addCallback(function($ci, data) {
    $ci
        .one("query-pred-title-then-pred-id-then-load", function() {
            let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
            let reqData = {
                type: "term",
                id: data.relID,
            };
            dbReqManager.query($ci, reqData, function($ci, result) {
                data.predTitle = (result[0] ?? [])[1];
                $ci.trigger("query-pred-id-then-load");
            });
            return false;
        })
        .one("query-pred-id-then-load", function() {
            let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
            let reqData = {
                type: "termID",
                cid: "2", // the ID of the Predicate Context
                spt: data.objType,
                spid: data.objID,
                t: encodeURI(data.predTitle),
            };
            dbReqManager.query($ci, reqData, function($ci, result) {
                data.predID = (result[0] ?? [0])[0]; // predID = 0 if missing.
                if (data.predID === 0) {
                    relationSetFieldCL.loadReplaced(
                        $ci, "InsertPredicateField", data
                    );
                } else {
                    $ci.trigger("load");
                }
            });
            return false;
        })
        .trigger("query-pred-title-then-pred-id-then-load");
});
export var predicateSetFieldCL = new ContentLoader(
    "PredicateSetField",
    /* Initial HTML template */
    '<div>' +
        '<<SetHeader>>' +
        '<<SetList data:wait>>' +
    '</div>',
    appColumnCL
);
predicateSetFieldCL.addCallback("data", function(data) {
    // data.copyFromAncestor("predTitle", 1); // copy only from own parent.
    data.copyFromAncestor([
        "elemContentKey",
        "predID",
        "subjType",
        "queryNum",
        "userWeights",
        "initialNum",
        "incrementNum",
    ]);
});
predicateSetFieldCL.addCallback(function($ci, data) {
    $ci
        .one("query-initial-sets-then-load", function() {
            let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
            data.userSetsArr = [{
                predID: data.predID,
                factorFun: x => 1,
                userSetsObj: {
                    userWeights: data.get("userWeights"),
                    sets: [],
                },
            }];
            let len = data.userWeights.length;
            for (let i = 0; i < len; i++) {
                let reqData = {
                    type: "set",
                    uid: data.userWeights[i].userID,
                    pid: data.predID,
                    st: data.subjType,
                    rl: -32767, rh: 32767,
                    n: data.queryNum, o: 0,
                    a: 0,
                };
                dbReqManager.query($ci, reqData, i, function($ci, result, i) {
                    data.userSetsArr[0].userSetsObj.sets[i] = result;
                    $ci.trigger("load-initial-set-list-if-ready");
                });
            }
            return false;
        })
        .on("load-initial-set-list-if-ready", function() {
            let len = data.userWeights.length;
            for (let i = 0; i < len; i++) {
                if (
                    typeof data.userSetsArr[0].userSetsObj.sets[i] ===
                        "undefined"
                ) {
                    return false;
                }
            }
            data.set = getAveragedSet(data.userSetsArr[0].userSetsObj);
            $ci.children('.CI.SetList').trigger("load");
            // off this event.
            $ci.off("load-initial-set-list-if-ready");
            return false;
        })
        .trigger("query-initial-sets-then-load");
});




/**
 * SetList requires data:
     * data.elemContentKey,
     * data.subjType,
     * data.set = [[ratVal, subjID], ...],
     * data.initialNum,
     * data.incrementNum (can be changed before appending a new list).
     * TODO: Add filter set IDs (meaning userID + predID) to potentially
         * collapse elements before loading.
 * And it sets/updates data:
     * newData.listElemDataArr = [{ratVal, subjID}, ...],
     * newData.currentLen.
 */
export var setListCL = new ContentLoader(
    "SetList",
    /* Initial HTML template */
    '<div>' +
        '<<List>>' +
    '</div>',
    appColumnCL
);
setListCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "elemContentKey",
        "subjType",
        "set",
        "initialNum",
        "incrementNum",
    ]);
});
setListCL.addCallback("data", function(data) {
    data.cl = setListCL.getRelatedCL(data.getFromAncestor("elemContentKey"));
    data.copyFromAncestor("initialNum");
    data.listElemDataArr = data.getFromAncestor("set")
        .slice(0, data.initialNum)
        .map(function(row) {
            return {
                ratVal: row[0],
                subjID: row[1],
            };
        });
    data.currentLen = data.initialNum;
});
setListCL.addCallback(function($ci, data) {
    $ci.on("append-list", function() {
        let $this = $(this);
        let data = $(this).data("data");
        data.listElemDataArr = data.set
            .slice(data.currentLen, data.currentLen + data.incrementNum)
            .map(function(row) {
                return {
                    ratVal: row[0],
                    subjID: row[1],
                };
            });
        data.currentLen += data.incrementNum;
        setListCL.loadAppended($this, 'List', data);
    });
});







export var setHeaderCL = new ContentLoader(
    "SetHeader",
    /* Initial HTML template */
    '<div>' +
        '<<PredicateBox>>' +
        '<<AddPredicateButton>>' +
    '</div>',
    appColumnCL
);
export var predicateBoxCL = new ContentLoader(
    "PredicateBox",
    /* Initial HTML template */
    '<div>' +
        '<<PredicateTitle>>' +
    '</div>',
    appColumnCL
);

export var predicateTitleCL = new ContentLoader(
    "PredicateTitle",
    /* Initial HTML template */
    '<<TermTitle>>',
    appColumnCL
);
predicateTitleCL.addCallback("data", function(data) {
    data.entityID = data.getFromAncestor("predID");
    data.titleCutOutLevels = data.getFromAncestor("titleCutOutLevels") ??
        [1, 1];
});

export var termTitleCL = new ContentLoader(
    "TermTitle",
    /* Initial HTML template */
    '<span></span>',
    appColumnCL
);
termTitleCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "entityID",
        "titleCutOutLevels",
    ]);
    data.entityType = "t";
});
termTitleCL.addCallback(function($ci, data) {
    // if data.titleCutOutLevels == [], simply load the term's (combined)
    // entity ID as the title.
    if (data.titleCutOutLevels.length === 0) {
        $ci.append('t' + data.entityID.toString());
        return;
    }
    // else query the database for the title (and spec. entity), and append
    // a title with cut-out level given by data.titleCutOutLevels[0]. And if
    // data.titleCutOutLevels cotains more elements, load the EntityTitles of
    // the specifying entities as well, and if these are Terms, cut out part
    // of their title as well, depending on the cut-out levels (or just append
    // their entity ID, if the data.titleCutOutLevels array is at its end).
    let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
    let reqData = {
        type: "term",
        id: data.entityID,
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
        "titleCutOutLevels",
    ]);
    data.titleCutOutLevels ??= [];
});
entityTitleCL.addCallback(function($ci, data) {
    if (data.entityType === "t") {
        entityTitleCL.loadAppended($ci, "TermTitle", data);
    } else if (data.entityType === "c") {
        entityTitleCL.loadAppended($ci, "ContextTitle", data);
    } else {
        $ci.append(data.entityType + data.entityID.toString());
    }
});
entityTitleCL.addCallback(function($ci, data) {
    $ci
        .on("click", function() {
            $(this)
                .trigger("open-column", [
                    "EntityColumn", data, "right", true
                ])
                .trigger("column-click");
            return false;
        });
});







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
        } else {
            if (currentLevel >= cutOutLevel) {
                retArray[retArrayLen] = title.slice(pos, nextRightParPos);
                retArrayLen++;
            }
            pos = nextRightParPos + 1;
            currentLevel -= 1;

        }
        // simply return the title as is if the curly brackets are ill-formed.
        if (currentLevel < 0) {
            return title;
        }
    }
    // simply return the title as is if the curly brackets are ill-formed.
    if (currentLevel !== 0) {
        return title;
    }
    if (cutOutLevel > 0 && retArray.length === 0) {
        return getReducedTitle(title, cutOutLevel - 1)
    } else {
        return retArray.join('')
            .replaceAll('$', '<span class="spec-entity"><span>');
    }
}
