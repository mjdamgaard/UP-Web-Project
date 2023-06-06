
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";




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
     * data.combSet = [[combRatVal, subjID, ratValArr], ...],
     * data.userSetsArr =
     *     [{predID, ratTransFun, userWeights, sets, avgSet}, ...],
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
    // data.titleCutOutLevels = [1, 1];
});
relationSetFieldCL.addCallback(function($ci, data) {
    $ci.one("query-pred-title-then-pred-id-then-load", function() {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let reqData = {
            type: "term",
            id: data.relID,
        };
        dbReqManager.query($ci, reqData, function($ci, result) {
            data.predTitle = (result[0] ?? [])[1];
            $ci.trigger("query-pred-id-then-load");
        });
        return false;
    });
    $ci.one("query-pred-id-then-load", function() {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
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
                relationSetFieldCL.loadBefore(
                    $ci, "MissingPredicateText", data
                );
                relationSetFieldCL.loadReplaced(
                    $ci, "SubmitPredicateField", data
                );
            } else {
                $ci.trigger("load");
            }
        });
        return false;
    });
    $ci.trigger("query-pred-title-then-pred-id-then-load");
});
export var missingPredicateTextCL = new ContentLoader(
    "MissingPredicateText",
    /* Initial HTML template */
    '<span class="text-warning">' +
        'Predicate not found. Do you want to create the Predicate?' +
    '</span>',
    appColumnCL
);


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
    $ci.one("query-initial-sets-then-load", function() {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        data.userSetsArr = [{
            predID: data.predID,
            ratTransFun: 1,
            userWeights: data.get("userWeights"),
            sets: [],
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
                data.userSetsArr[0].sets[i] = result;
                $ci.trigger("load-initial-set-list-if-ready");
            });
        }
        return false;
    });
    $ci.on("load-initial-set-list-if-ready", function() {
        let len = data.userWeights.length;
        for (let i = 0; i < len; i++) {
            if (typeof data.userSetsArr[0].sets[i] === "undefined") {
                return false;
            }
        }
        let userSets = data.userSetsArr[0];
        data.combSet = getAveragedSet(userSets.sets, userSets.userWeights);
        $ci.children('.CI.SetList').trigger("load");
        // off this event.
        $ci.off("load-initial-set-list-if-ready");
        // trigger event to make header responsive to click event.
        $ci.children('.CI.SetHeader').trigger("userSetsArr-is-ready");
        return false;
    });
    $ci.trigger("query-initial-sets-then-load");
});




/**
 * SetList requires data:
     * data.elemContentKey,
     * data.subjType,
     * data.combSet = [[combRatVal, subjID, ratValArr], ...],
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
        "combSet",
        "initialNum",
        "incrementNum",
    ]);
});
setListCL.addCallback("data", function(data) {
    data.cl = setListCL.getRelatedCL(data.getFromAncestor("elemContentKey"));
    data.copyFromAncestor("initialNum");
    let subjType = data.subjType;
    data.listElemDataArr = data.combSet
        .slice(0, data.initialNum)
        .map(function(row) {
            return {
                combRatVal: row[0],
                entityID: row[1],
                entityType: subjType,
                avgRatValArr: row[3] ?? [],
            };
        });
    data.currentLen = data.initialNum;
});
setListCL.addCallback(function($ci, data) {
    $ci.on("append-list", function() {
        let $this = $(this);
        let data = $(this).data("data");
        let subjType = data.subjType;
        data.listElemDataArr = data.set
            .slice(data.currentLen, data.currentLen + data.incrementNum)
            .map(function(row) {
                return {
                    combRatVal: row[0],
                    entityID: row[1],
                    entityType: subjType,
                    avgRatValArr: row[3] ?? [row[0]],
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
        '<<PredicateTitle>>' +
        '<<AddButton>>' +
        '<<DropdownButton>>' +
        '<<SetPredicatesDropdownMenu data:wait>>' +
    '</div>',
    appColumnCL
);
setHeaderCL.addCallback(function($ci, data) {
    $ci.one("userSetsArr-is-ready", function() {
        $(this).on("click", function() {
            $(this).find('.CI.SetPredicatesDropdownMenu')
                .trigger("load")
                .show();
        });
    });
});
export var setPredicatesDropdownMenuCL = new ContentLoader(
    "SetPredicatesDropdownMenu",
    /* Initial HTML template */
    '<div>' +
        '<<SetPredicateMenuPoint data.userSetsArr[...]>>' +
    '</div>',
    appColumnCL
);
export var setPredicateMenuPointCL = new ContentLoader(
    "SetPredicateMenuPoint",
    /* Initial HTML template */
    '<div>' +
        '<<PredicateTitle>>' +
        '<<RatingTransformerFunctionMenu>>' +
        '<<UserWeightsMenu>>' +
    '</div>',
    appColumnCL
);

export var userWeightsMenuCL = new ContentLoader(
    "UserWeightsMenu",
    /* Initial HTML template */
    '<div>' +
        '<<UserWeightMenuPoint data.userWeights[...]>>' +
    '</div>',
    appColumnCL
);





// getAveragedSet() takes a two arrays, sets and userWeights, and returns a
// unioned set containing the weighted averaged ratings for any subjects that
// appear in one or more of the sets.
export function getAveragedSet(sets, userWeights, sortFlag) {
    // if there is only one set, simply return the set as is.
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

export function setAveragedSets(userSetsArr, boolArr, sortFlag) {
    let predNum = userSetsArr.length;
    if (!boolArr) {
        boolArr = new Array(predNum).fill(true);
    }
    for (let i = 0; i < predNum; i++) {
        if (boolArr[0]) {
            userSetsArr[i].avgSet = getAveragedSet(
                userSetsArr.sets, userSetsArr.userWeights, sortFlag
            );
        }
    }
}


// (userSetsArr = [{predID, ratTransFun, userWeights, sets, avgSet}, ...].)

/**
 * getCombinedSet(userSetsArr) returns a combined set,
 * combSet = [[combRatVal, subjID, ratValArr], ...]. This is done by first
 * using setAveragedSets() to get averaged sets for each predicate. Then these
 * sets are further combined into one by applying the individual ratTransFuns
 * and then adding up the values. The first predicate in userSetsArr and the
 * corresponding averaged set is treated specially in that the combined will
 * contain all the entities of that set and no more. If the other sets contain
 * other entities, these will then not be used for the combined set. And for
 * all the entities of the first set that are not present in a given other set,
 * their averaged rating value will then be set to 0 (before applying the
 * rating transformer function).
 */
// TODO: Figure out about the sortFlag, and what should happen when predNum ==
// 1..
export function getCombinedSet(userSetsArr, boolArr, sortFlag) {
    // first compute the averaged sets for each predicate (where the ratings
    // from each user for that predicate is combined as a weighted average).
    setAveragedSets(userSetsArr, boolArr); // (An undefined sortFlag means that
    // the averaged sets will be sorted in terms of subjID.)
    // then initialize the return array to the first averaged set, but with an
    // extra third column meant to contain all the averaged ratings before this
    // combination
    let predNum = userSetsArr.length;
    let ret = userSetsArr[0].avgSet.map(
        row => [row[0], row[1], new Array(predNum).fill(row[0])]
    );
    // for each subsequent avgSet, look for any subjID contained in the first
    // set, and for each one found, apply the userSetsArr[i].ratTransFun to the
    // averaged ratVal and add the result to the combRatVal located in the first
    // column of ret. Also store the same averaged ratVal as is in the array in
    // the third column of ret.
    let retLen = ret.length;
    for (let i = 1; i < predNum; i++) {
        let ratTransFun = userSetsArr[i].ratTransFun;
        let avgSet = userSetsArr[i].avgSet;
        let avgSetLen = avgSet.length;
        let pos = 0;
        for (let j = 0; j < retLen; j++) {
            let subjID = ret[j][1];
            while (avgSet[pos][1] < subjID && pos < avgSetLen - 1) {
                pos++;
            }
            let row = avgSet[pos];
            if (row[1] == subjID) {
                ret[j][0] += ratTransFun(row[0]);
                ret[j][1][i] = row[0];
            }
        }
    }
    return ret;
}
