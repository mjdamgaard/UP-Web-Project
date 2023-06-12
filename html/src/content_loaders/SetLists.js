
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";





/*
SetList requires data:
    data.defaultQueryNum,
    data.defaultUserWeightArr,
    data.predSetDataArr = [predSetData, ...],
        predSetData = {
            predCxtID, predStr, objID,
            userWeightArr?, queryParams?, ratTransFun?,
            setArr?, avgSet?, isReadyArr?
        },
        userWeightArr = [{userID, weight}, ...],
        queryParams = {num?, ratingLo?, ratingHi?, offset?, isAscending?},
    data.elemContentKey,
    data.subjType,
    data.initialNum,
    data.incrementNum,
    data.combSet?
    // data.showHeader,
    // data.applySortingOptions.
    // data.sortingOptions. (if applySortingOptions == true.)
And it also sets/updates data:
    data.combSet = [[combRatVal, subjID, ratValArr], ...].
*/
export var setListCL = new ContentLoader(
    "SetList",
    /* Initial HTML template */
    '<div>' +
        '<<List>>' +
    '</div>',
    appColumnCL
);
setFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "defaultQueryNum",
        "defaultUserWeightArr",
        "predSetDataArr",
        "sortAscending", // optional.
        "elemContentKey",
        "initialNum",
        "incrementNum",
    ]);
    data.copyFromAncestor("combSet", 1);  // optional.
});
setFieldCL.addCallback(function($ci, data) {
    data.setManager = new SetManager(
        data.defaultQueryNum, data.defaultUserWeightArr, data.predSetDataArr,
        data.sortAscending, data.combSet,
    );
    data.setManager.queryAndCombineSets(function(combSet) {
        $ci.trigger("comb-set-is-ready", [combSet]);
    });
});



export class SetManager {
    constructor(
        defaultQueryNum, defaultUserWeightArr, predSetDataArr,
        sortAscending, combSet // optional
    ) {
        this.defaultQueryNum = defaultQueryNum;
        this.defaultUserWeightArr = defaultUserWeightArr;
        this.predSetDataArr = predSetDataArr;
        this.sortAscending = sortAscending ?? 0; // false;
        this.combSet = combSet;
    }
    /*
    predSetDataArr = [predSetData, ...],
        predSetData = {
            predCxtID, predStr, objID,
            userWeightArr?, queryParams?, ratTransFun?,
            setArr?, avgSet?, isReadyArr?
        },
        userWeightArr = [{userID, weight}, ...],
        queryParams = {num?, ratingLo?, ratingHi?, offset?, isAscending?},
    */

    queryAndCombineSets(data, callback) {
        if (!callback) {
            callback = data;
            data = null;
        }
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let predNum = this.predSetDataArr.length;
        for (let i = 0; i < predNum; i++) {
            let predSetData = this.predSetDataArr[i];
            let queryParams = (predSetData.queryParams ??= {});
            queryParams.num ??= this.defaultQueryNum;;
            queryParams.ratingLo ??= "";; // hack for Atom syntax HL. to work.
            queryParams.ratingHi ??= "";;
            queryParams.offset ??= 0;;
            queryParams.isAscending ??= this.sortAscending ? 1 : 0;;

            if (!predSetData.avgSet) {
                predSetData.userWeightArr ??= this.defaultUserWeightArr;
                let userNum = predSetDataArr.userWeightArr.length;
                predSetData.isReadyArr ??= new Array(userNum).fill(false);
                for (let j = 0; j < userNum; j++) {
                    if (predSetData.isReadyArr[j]) {
                        continue;
                    }
                    let reqData = {
                        type: "set",
                        u: predSetData.userWeightArr[j].userID,
                        p: predSetData.predKey.predID,
                        rl: queryParams.ratingLo,
                        rh: queryParams.ratingHi,
                        n: queryParams.num,
                        o: queryParams.offset,
                        a: queryParams.isAscending,
                    };
                    let indices = {i: i, j: j};
                    dbReqManager.query(
                        $ci, reqData, indices, function($ci, result, indices) {
                            predSetData.setArr[indices.j] = result;
                            this.computeAvgSetIfReadyAndThenCombineIfReady(
                                indices.i, callback, data
                            );
                        }
                    );
                }
                this.computeAvgSetIfReadyAndThenCombineIfReady(i);
            }
        }
    }

    computeAvgSetIfReadyAndThenCombineIfReady(i, callback, data) {
        let isReady = this.predSetDataArr[i].isReadyArr.reduce(
            (acc, val) => acc && val, true
        );
        if (isReady) {
            this.computeAveragedSet(i);
            this.combineSetsIfReady(callback, data);
        }
    }

    combineSetsIfReady(callback, data) {
        let isReady = this.predSetDataArr.reduce(
            (acc, val) => acc && val.avgSet, true
        );
        if (isReady) {
            let combSet = this.computeCombinedSet();
            callback(combSet, data);
        }
    }

    // computeAveragedSet() sorts the avgSet after subjID, only if setNum (i.e.
    // this.predSetDataArr[i].setArr.length) is larger than 1. Otherwise the
    // avgSet will just be result of the single set query.
    computeAveragedSet(i) {
        let predSetData = this.predSetDataArr[i];
        let setArr = predSetData.setArr;
        // if there is only one set, simply return the set as is.
        let setNum = setArr.length;
        if (setNum === 1) {
            return predSetData.avgSet = setArr[0];
        }
        // else, first sort each array in terms of the subject IDs.
        for (let i = 0; i < setNum; i++) {
            setArr[i].sort((row1, row2) => row1[1] - row2[1]);
        }
        // then... TODO: make comments for the rest of the code.
        let userWeightArr = predSetData.userWeightArr;
        let setLengths = setArr.map(val => val.length);
        let setLenSum = setLengths.reduce((acc, val) => acc + val, 0);
        let ret = new Array(setLenSum);
        let retLen = 0;
        let positions = new Array(setNum).fill(0);
        let continueLoop = true;
        while (continueLoop) {
            let minSubjID = positions.reduce(
                (acc, val, ind) => Math.min(acc, setArr[ind][val][1]), 0
            );
            let weightedRatValOfMinSubjArray = positions.map(
                (val, ind) => (setArr[ind][val][1] !== minSubjID) ? "" :
                    setArr[ind][val][0] * userWeightArr[ind]
            );
            let weightSum = weightedRatValOfMinSubjArray.reduce(
                (acc, val, ind) => acc +((val === "") ? 0 : userWeightArr[ind]),
                0
            );

            let averagedRatVal = weightedRatValOfMinSubjArray
                .reduce((acc, val) => acc + val, 0) /
                    weightSum;
            ret[retLen] = [averagedRatVal, minSubjID];
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
        return predSetData.avgSet = ret;
    }

    // computeAveragedSet() sorts the combSet according to this.sortAscending.
    computeCombinedSet() {
        let predSetDataArr = this.predSetDataArr;
        let predNum = predSetDataArr.length;
        // if predNum is 1, simply return the avgSet as is (ignoring the
        // ratTransFun, even if this is defined to something else than x => x).
        if (predNum <= 1) {
            if (
                predSetDataArr[0].queryParams.isAscending == this.sortAscending
            ) {
                return this.combSet = predSetDataArr[0].avgSet;
            } else {
                return this.combSet = predSetDataArr[0].avgSet.toReversed();
            }
        }
        // else if predNum is larger than 1, then initialize first the return
        // array to the first averaged set, but with an extra third column
        // meant to contain all the averaged ratings before this combination.
        let ret = predSetDataArr[0].avgSet.map(
            row => [row[0], row[1], new Array(predNum).fill(row[0])]
        );
        // for each subsequent avgSet, look for any subjID contained in the
        // first set, and for each one found, apply the setDataArr[i]
        // .ratTransFun to the averaged ratVal and add the result to the
        // combRatVal located in the first column of ret. Also store the same
        // averaged ratVal as is in the array in the third column of ret.
        let retLen = ret.length;
        for (let i = 1; i < predNum; i++) {
            let ratTransFun = predSetDataArr[i].ratTransFun;
            let avgSet = predSetDataArr[i].avgSet;
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
                } else {
                    ret[j][0] += ratTransFun(0);
                    ret[j][1][i] = null;
                }
            }
        }
        if (this.sortAscending) {
            return this.combSet = ret.sort((row1, row2) => row1[0] - row2[0]);
        } else {
            return this.combSet = ret.sort((row1, row2) => row2[0] - row1[0]);
        }
    }
}

/**
 * getCombinedSet(predSetDataArr) returns a combined set,
 * combSet = [[combRatVal, subjID, ratValArr], ...]. This is done by first
 * using setAveragedSets() to get averaged sets for each predicate. Then these
 * sets are further combined into one by applying the individual ratTransFuns
 * and then adding up the values. The first predicate in predSetDataArr and the
 * corresponding averaged set is treated specially in that the combined will
 * contain all the entities of that set and no more. If the other sets contain
 * other entities, these will then not be used for the combined set. And for
 * all the entities of the first set that are not present in a given other set,
 * their averaged rating value will then be set to 0 (before applying the
 * rating transformer function).
 */










// setFieldCL.addCallback(function($ci, data) {
//     if (data.combSet) {
//         $ci.trigger("append-initial-elements");
//         return;
//     }
//
//
//     let predNum = data.predSetDataArr.length;
//     for (let i = 0; i < predNum; i++) {
//         let setData = data.predSetDataArr[i];
//         setData.userWeightArr ??= data.defaultUserWeightArr;
//
//         let ithAvgSetSignal = "compute-avg-set-" + i.toString() + "-if-ready";
//         $ci.on(ithAvgSetSignal) {
//             setData.avgSet = getAveragedSet(setData);
//         }
//
//         let userNum = userWeightArr.length;
//         setData.isReadyArr ??= new Array(userNum).fill(false);
//         for (let j = 0; j < userNum; j++) {
//             if (setData.isReadyArr[j]) {
//                 queryAndStoreSetThenSignalCI(setData, j, $ci, ithAvgSetSignal);
//             }
//         }
//         $ci.trigger(ithAvgSetSignal);
//     }
// });




export function queryAndSetAvgSetThenSignalCI(data, i, $ci, signal) {
    let setData = data.predSetDataArr[i];
    let userWeightArr = setData.userWeightArr ?? data.defaultUserWeightArr;
    let userNum = userWeightArr.length;
    setData.isReadyArr ??= new Array(userNum).fill(false);
    for (let j = 0; j < userNum; j++) {

    }


    // if setData.avgSet is already set and setData.refresh is not true, simply
    // send the ready signal immediately
    if (setData.avgSet && !setData.refresh) {
        $ci.trigger(signal, [setData.title]);
        return;
    }
    // else if setArr is not empty and setData.refresh is not true, simply
    // compute the avgSet from setArr and send the ready signal.
    setData.setArr ??= [];
    if (setData.setArr.length !== 0 && !setData.refresh) {
        setData.avgSet = getAveragedSet(setData.setArr, setData.userWeightArr);
        $ci.trigger(signal, [setData.title]);
        return;
    }
    // else set up an event to query the sets to load into setData.setArr.
    // (This event will be triggered as soon as we have gotten the predID.)
    $ci.one("query-sets-" + i.toString(), function() {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let len = setData.userWeightArr.length;
        for (let j = 0; j < len; j++) {
            let reqData = {
                type: "set",
                uid: setData.userWeightArr[j].userID,
                pid: setData.predKey.predID,
                st: data.subjType,
                rl: setData.queryParams.ratingLo ?? "",
                rh: setData.queryParams.ratingHi ?? "",
                n: setData.queryParams.num,
                o: setData.queryParams.offset ?? 0,
                a: setData.queryParams.isAscending ?? 0,
            };
            dbReqManager.query($ci, reqData, j, function($ci, result, j) {
                setData.setArr[j] = result;
                $ci.trigger("signal-ci-if-ready");
            });
        }
        return false;
    });
}

















// NOTE: Since RelationSetField does not try set up any lasting events, this
// works. But do not decorate a CL that then waits for data, like here, and then
// try to have the decorator add events to the CI, since these will just be
// removed when the waiting decoratee finally loads.
setFieldCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "objType",
        "objID",
        "relID",
    ]);
    data.titleCutOutLevels = [2, 1];
    // data.titleCutOutLevels = [1, 1];
});
setFieldCL.addCallback(function($ci, data) {
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
        "userWeightArr",
        "initialNum",
        "incrementNum",
    ]);
});
predicateSetFieldCL.addCallback(function($ci, data) {
    $ci.one("query-initial-sets-then-load", function() {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        data.predSetDataArr = [{
            predID: data.predID,
            ratTransFun: 1,
            userWeightArr: data.get("userWeightArr"),
            setArr: [],
        }];
        let len = data.userWeightArr.length;
        for (let i = 0; i < len; i++) {
            let reqData = {
                type: "set",
                uid: data.userWeightArr[i].userID,
                pid: data.predID,
                st: data.subjType,
                rl: data.ratingLo ?? "",
                rh: data.ratingHi ?? "",
                n: data.queryNum,
                o: data.queryOffset ?? 0,
                a: data.queryAscending ?? 0,
            };
            dbReqManager.query($ci, reqData, i, function($ci, result, i) {
                data.predSetDataArr[0].setArr[i] = result;
                $ci.trigger("load-initial-set-list-if-ready");
            });
        }
        return false;
    });
    $ci.on("load-initial-set-list-if-ready", function() {
        let len = data.userWeightArr.length;
        for (let i = 0; i < len; i++) {
            if (typeof data.predSetDataArr[0].setArr[i] === "undefined") {
                return false;
            }
        }
        let userSets = data.predSetDataArr[0];
        data.combSet = getAveragedSet(userSets.setArr, userSets.userWeightArr);
        $ci.children('.CI.SetList').trigger("load");
        // off this event.
        $ci.off("load-initial-set-list-if-ready");
        // trigger event to make header responsive to click event.
        $ci.children('.CI.SetHeader').trigger("predSetDataArr-is-ready");
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
// export var setListCL = new ContentLoader(
//     "SetList",
//     /* Initial HTML template */
//     '<div>' +
//         '<<List>>' +
//     '</div>',
//     appColumnCL
// );
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
                termID: row[1],
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
                    termID: row[1],
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
        '<<RefreshButton>>' +
        '<<AddButton>>' + // Button to add predicate (menu point) in dd. menu.
        '<<DropdownButton>>' +
        '<<SetPredicatesDropdownMenu data:wait>>' +
    '</div>',
    appColumnCL
);
setHeaderCL.addCallback(function($ci, data) {
    $ci.one("predSetDataArr-is-ready", function() {
        $(this).one("click", function() {
            let $this = $(this);
            $this.find('.CI.SetPredicatesDropdownMenu').trigger("load");
            $this.on("click", function() {
                $(this).find('.CI.SetPredicatesDropdownMenu').toggle();
            })
        });
    });
});
export var setPredicatesDropdownMenuCL = new ContentLoader(
    "SetPredicatesDropdownMenu",
    /* Initial HTML template */
    '<div>' +
        '<<SetPredicateMenuPoint data.predSetDataArr[...]>>' +
    '</div>',
    appColumnCL
);
export var setPredicateMenuPointCL = new ContentLoader(
    "SetPredicateMenuPoint",
    /* Initial HTML template */
    '<div>' +
        '<<PredicateTitle>>' +
        '<<RatingTransformFunctionMenu>>' +
        // '<<UserWeightsMenu>>' +
    '</div>',
    appColumnCL
);
export var ratingTransformFunctionMenuCL = new ContentLoader(
    "RatingTransformFunctionMenu",
    /* Initial HTML template */
    '<div>' +
        // TODO: CHange this to add more options for the function, and also so
        // that the user can set rl and rh for the set query, as well as decide
        // if the predicate set should be a superset the combined set
        // (filtering away all other elements).
        '<div class="form-group">' +
            '<label>factor:</label>' +
            '<input type="number" class="form-control">' +
        '</div>' +
    '</div>',
    appColumnCL
);
ratingTransformFunctionMenuCL.addCallback("data", function(data) {
    let predSetDataArr = getFromAncestor("predSetDataArr");
    data.copyFromAncestor("predID");
    let len = predSetDataArr.length;
    // find the userSets object corresponing to the relevant predicate.
    for (let i = 0; i < len; i++) {
        if (predSetDataArr[i].predID = data.predID) {
            data.userSets = predSetDataArr[i];
            break;
        }
    }
});
ratingTransformFunctionMenuCL.addCallback(function($ci, data) {
    $ci
});





// TODO: Make the user weight menu a global one, changed for the whole
// sdbInterface at once.
// export var userWeightArrMenuCL = new ContentLoader(
//     "UserWeightsMenu",
//     /* Initial HTML template */
//     '<div>' +
//         '<<UserWeightMenuPoint data.userWeightArr[...]>>' +
//     '</div>',
//     appColumnCL
// );
// export var userWeightMenuPointCL = new ContentLoader(
//     "UserWeightMenuPoint",
//     /* Initial HTML template */
//     '<div>' +
//         '<div class="form-group">' +
//             '<label><<UserTitle>> weight:</label>' +
//             '<input type="text" class="form-control">' +
//         '</div>' +
//     '</div>',
//     appColumnCL
// );
// userWeightMenuPointCL.addCallback("data", function(data) {
//     data.entityType = "u";
//     data.entityID = data.getFromAncestor("userID");
// });
