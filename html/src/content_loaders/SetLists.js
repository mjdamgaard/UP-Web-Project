
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, appColumnCL,
} from "/src/content_loaders/ColumnInterface.js";





/*
SetList requires data:
    data.elemContentKey,
    data.defaultUserWeightArr,
    data.predSetDataArr = [predSetData, ...],
        predSetData = {
            predCxtID, predStr, objID,
            userWeightArr?, queryParams?, ratTransFun?,
            setArr?, avgSet?, isReadyArr?
        },
        userWeightArr = [{userID, weight}, ...],
        queryParams = {num?, ratingLo?, ratingHi?, offset?, isAscending?},
    data.defaultQueryNum,
    data.defaultRatingLo?,
    data.defaultRatingHi?,
    data.defaultOffset?,
    data.defaultIsAscending?,
    data.combSet?
    data.initialNum,
    data.incrementNum,
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
        '<<List data:wait>>' +
    '</div>',
    appColumnCL
);
setListCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "elemContentKey",
        "defaultUserWeightArr",
        "predSetDataArr",
        "defaultQueryNum",
        "defaultRatingLo",  // optional.
        "defaultRatingHi",  // optional.
        "defaultOffset",  // optional.
        "defaultIsAscending",  // optional.
        "initialNum",
        "incrementNum",
    ]);
    data.copyFromAncestor("combSet", 1);  // optional.
});
setListCL.addCallback(function($ci, data) {
    data.cl = setListCL.getRelatedCL(data.elemContentKey));
    $ci.one("load-initial-elements", function(event, combSet) {
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
        $ci.find('.CI.List').trigger("load");
        return false;
    });
    data.setManager = new SetManager(
        data.defaultQueryNum, data.defaultUserWeightArr, data.predSetDataArr,
        data.defaultIsAscending, data.combSet,
    );
    data.setManager.queryAndCombineSets(function(combSet) {
        $ci.trigger("load-initial-elements", [combSet]);
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
            predID?,
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
            // (Using ;; here is just for making Atom syntax highlighting work.)
            queryParams.num ??= this.defaultQueryNum;;
            queryParams.ratingLo ??= this.defaultRatingLo ?? "";;
            queryParams.ratingHi ??= this.defaultRatingHi ?? "";;
            queryParams.offset ??= this.defaultOffset ?? 0;;
            queryParams.isAscending ??= this.sortAscending ? 1 : 0;;

            if (!predSetData.avgSet) {
                predSetData.userWeightArr ??= this.defaultUserWeightArr;
                let userNum = predSetDataArr.userWeightArr.length;
                predSetData.isReadyArr ??= new Array(userNum).fill(false);
                // if...
                if (predSetData.predID) {
                    this.querySetsAndCombineIfReady(
                        predSetData, i, data, callback
                    );
                    continue;
                }
                // else...
                let reqData = {
                    type: "termID",
                    c: predSetData.predCxtID,
                    s: predSetData.predStr,
                    t: predSetData.objID,
                };
                dbReqManager.query($ci, reqData, i, function($ci, result, i) {
                    predSetData.predID = (result[0] ?? [0])[0];
                    this.querySetsAndCombineIfReady(
                        predSetData, i, data, callback
                    );
                });
            }
        }
    }

    querySetsAndCombineIfReady(predSetData, i, data, callback) {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let queryParams = predSetData.queryParams;
        for (let j = 0; j < userNum; j++) {
            if (predSetData.isReadyArr[j]) {
                continue;
            }
            let reqData = {
                type: "set",
                u: predSetData.userWeightArr[j].userID,
                p: predSetData.predID,
                rl: queryParams.ratingLo,
                rh: queryParams.ratingHi,
                n: queryParams.num,
                o: queryParams.offset,
                a: queryParams.isAscending,
            };
            dbReqManager.query(
                $ci, reqData, j, function($ci, result, j) {
                    predSetData.setArr[j] = result;
                    this.computeAvgSetIfReadyAndCombineSetsIfReady(
                        predSetData, data, callback
                    );
                }
            );
        }
        this.computeAvgSetIfReadyAndCombineSetsIfReady(
            predSetData, data, callback
        );
    }

    computeAvgSetIfReadyAndCombineSetsIfReady(predSetData, data, callback) {
        let isReady = predSetData.isReadyArr.reduce(
            (acc, val) => acc && val, true
        );
        if (isReady) {
            this.computeAveragedSet(predSetData);
            this.combineSetsIfReady(data, callback);
        }
    }

    combineSetsIfReady(data, callback) {
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
    computeAveragedSet(predSetData) {
        let setArr = predSetData.setArr;
        // if there is only one set, simply return the set as is.
        let setNum = setArr.length;
        if (setNum === 1) {
            return predSetData.avgSet = setArr[0];
        }
        // if only one set is non-empty, simply return that set.
        let setLengths = setArr.map(val => val.length);
        let nonEmptyNum = setLengths.reduce(
            (acc, val) => acc + (val === 0 ? 0 : 1), 0
        );
        if (nonEmptyNum === 1) {
            return predSetData.avgSet = setArr.reduce(
                (acc, val) => acc.length > 0 ? acc : val, []
            );
        }
        // else, first sort each array in terms of the subject IDs.
        for (let i = 0; i < setNum; i++) {
            setArr[i].sort((row1, row2) => row1[1] - row2[1]);
        }
        // then... TODO: make comments for the rest of the code.
        let userWeightArr = predSetData.userWeightArr;
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
            let ratTransFun = predSetDataArr[i].ratTransFun ?? (x => x);
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





// TODO: Correct the following event method if needed and add more event methods
// to query for more elements of the sets. I imagine a method that simply adds
// the same number of predSetData to the predSetDataArr, with the same
// predicates (use the predIDs) but with a different offset for all the query-
// Params. Then one should be able to run queryAndCombineSets() pretty much
// straight away. But one might also want to add an event method that simply
// creates a new SetManager with those new offsets and appends a new List.. hm,
// then again no, cause that will result in potential repititions of elements..
// But if needed, one *could* perhaps do this, and then simply filter the
// elements of the previous lists away, if we really want an update method that
// does not change the order of the already loaded elements..

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
