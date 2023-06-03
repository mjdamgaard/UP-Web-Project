
import {
    DBRequestManager,
} from "/UPA_scripts.php?id=11";
import {
    ContentLoader,
} from "/UPA_scripts.php?id=12";

import {
    sdbInterfaceCL, appColumnCL,
} from "/UPA_scripts.php?id=13";








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
 * It either receives or obtains by itself:
     * data.predTitle.
 * And it also sets/updates data:
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
relationSetFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "objType",
        "objID",
        "relID",
    ]);
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
                data.predID = (result[0] ?? [])[0];
                $ci.trigger("load");
            });
            return false;
        })
        .trigger("query-pred-title-then-pred-id-then-load");
});
export var predicateSetFieldCL = new ContentLoader(
    "PredicateSetField",
    /* Initial HTML template */
    '<div>' +
        '<<SetHeader data:wait>>' +
        '<<SetList data:wait>>' +
    '</div>',
    appColumnCL
);
predicateSetFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor("predTitle", 1); // copy only from own parent.
    data.copyFromAncestor([
        "elemContentKey",
        "objType",
        "objID",
        "relID",
        "subjType",
        "queryNum",
        "userWeights",
        "initialNum",
        "incrementNum",
    ]);
});
predicateSetFieldCL.addCallback(function($ci, data) {
    if (typeof data.predTitle === "undefined") {
        let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
        let reqData = {
            type: "term",
            id: data.predID,
        };
        dbReqManager.query($ci, reqData, function($ci, result) {
            data.predTitle = (result[0] ?? [])[1];
            $ci.children('.CI.SetHeader').trigger("load");
        });
        return false;
    } else {
        $ci.children('.CI.SetHeader').trigger("load");
    }
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
                    rl: "", rh: "",
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
        .trigger("query-initial-pred-title-then-load");
});


// getAveragedSet() takes a userSetsObj = {userWeights, sets} and returns a
// unioned set containing the weighted averaged ratings for any subjects that
// appear in one or more of the sets.
export function getAveragedSet(userSetsObj) {
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
    // ..TODO..

    let ret = new Array(sets.reduce((acc, currVal) => acc + currVal.length, 0));
    let retLen = 0;
    let indices = new Array(setNum);
    for (let i = 0; i < setNum; i++) {
        indices[i] = [i, 0];
    }
    let continueLoop = true;
    let weights = userSetsObj.weights;
    while (continueLoop) {
        let minSubjID = indices.reduce(
            (acc, currVal) => Math.min(acc, sets[currVal[0]][currVal[1]][1]),
            0
        );
        let weightSum = 0;
        for (let i = 0; i < setNum; i++) {
            if (sets[i][indices[i][1]][1] === minSubjID) {
                weightSum += weights[i];
            }
        }
        // ret[retLen] = indices.reduce(
        //     (acc, currVal) => acc +
        //         sets[currVal[0]][currVal[1]][0] * weights[currVal[0]] /
        //             weightSum,
        //     0
        // );
        // retLen++;
        continueLoop = false;
    }
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
        // TODO: add a bar with user weight buttons and a refresh button. *(This
        // bar should also turn into a drop-down menu for some decorating CLs.
        '<<PredicateRepresentation>>' +
    '</div>',
    appColumnCL
);
setHeaderCL.addCallback("data", function(data) {
    let setInfo = data.getFromAncestor("setInfo");
    data.subjType = setInfo[2];
    data.subjID = setInfo[3];
    data.relID = setInfo[4];
    data.relText = setInfo[5];
    data.objType = setInfo[6];
});
export var predicateRepresentationCL = new ContentLoader(
    "PredicateRepresentation",
    /* Initial HTML template */
    '<div>' +
        '<<RelationTitle>>' +
        '<<SubjectTitle>>' +
    '</div>',
    appColumnCL
);
export var relationTitleCL = new ContentLoader(
    "RelationTitle",
    /* Initial HTML template */
    '<<EntityTitle>>',
    appColumnCL
);
relationTitleCL.addCallback("data", function(data) {
    data.entityType = "r";
    data.entityID = data.getFromAncestor("relID");
    data.title = data.getFromAncestor("relText");
});
export var subjectTitleCL = new ContentLoader(
    "SubjectTitle",
    /* Initial HTML template */
    '<span>' +
        '<<EntityTitle>>' +
    '</span>',
    appColumnCL
);
subjectTitleCL.addCallback("data", function(data) {
    data.entityType = data.getFromAncestor("subjType");
    data.entityID = data.getFromAncestor("subjID");
});




export var entityTitleCL = new ContentLoader(
    "EntityTitle",
    /* Initial HTML template */
    '<span>' +
    '</span>',
    appColumnCL
);
entityTitleCL.addCallback(function($ci, data) {
    if (typeof data.title === "string") {
        $ci.append(data.title);
        return;
    }
    let dbReqManager = sdbInterfaceCL.dynamicData.dbReqManager;
    let reqData = {
        id: data.entityID,
    };
    switch (data.entityType) {
        case "c":
            reqData.type = "cat"
            break;
        case "t":
            reqData.type = "term"
            break;
        case "r":
            reqData.type = "rel"
            break;
        default:
            throw "entityType " + data.entityType + " not implemented";
    }
    dbReqManager.query($ci, reqData, function($ci, result) {
        $ci.append(result[0][0]);
    });
});
entityTitleCL.addCallback(function($ci, data) {
    $ci
        .on("click", function() {
            let columnData = {
                queryUserID: data.queryUserID,
                inputUserID: data.inputUserID,
                entityType: data.entityType,
                entityID: data.entityID,
                subjType: data.subjType,
                subjID: data.subjID,
            };
            $(this)
                .trigger("open-column", [
                    "EntityColumn", columnData, "right", true
                ])
                .trigger("column-click");
            return false;
        });
});



export var entityRepresentationCL = new ContentLoader(
    "EntityRepresentation",
    /* Initial HTML template */
    '<div>' +
        '<<EntityTitle>>' +
    '</div>',
    appColumnCL
);


//
