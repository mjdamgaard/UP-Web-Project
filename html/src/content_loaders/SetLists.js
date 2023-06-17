
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/ColumnInterface.js";





/*
SetList requires data:
    data.elemContentKey,
    data.defaultUserWeightArr,
    data.setDataArr = [setData, ...],
        setData = {
            predCxtID, predStr, objID,
            predID?,
            userID, weight, ratTransFun, queryParams,
            set?,
            isReady?,
        },
        queryParams = {num, ratingLo, ratingHi, offset?, isAscending},
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
    sdbInterfaceCL
);
setListCL.addCallback("data", function(data) {
    data.copyFromAncestor([
        "elemContentKey",
        "defaultUserWeightArr",
        "setDataArr",
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
    data.cl = setListCL.getRelatedCL(data.elemContentKey);
    $ci.one("load-initial-elements", function(event, combSet) {
        data.listElemDataArr = combSet
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
        data.defaultQueryNum, data.defaultUserWeightArr, data.setDataArr,
        data.defaultIsAscending, data.combSet,
    );
    data.setManager.queryAndCombineSets(function(combSet) {
        $ci.trigger("load-initial-elements", [combSet]);
    });
});



export class SetManager {
    constructor(
        setDataArr,
        sortAscending, combSet // optional
    ) {
        this.setDataArr = setDataArr;
        this.sortAscending = sortAscending ?? 0; // false;
        this.combSet = combSet;
    }
    /*
    Recall:
    data.setDataArr = [setData, ...],
        setData = {
            predCxtID, predStr, objID,
            predID?,
            userID, weight, ratTransFun, queryParams,
            set?,
            isReady?,
        },
        queryParams = {num, ratingLo, ratingHi, offset?, isAscending}.
    */

    queryAndCombineSets(callbackData, callback) {
        if (!callback) {
            callback = callbackData;
            callbackData = null;
        }
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let setNum = this.setDataArr.length;
        for (let i = 0; i < setNum; i++) {
            let setData = this.setDataArr[i];
            if (!setData.set) {
                // if...
                if (setData.predID) {
                    this.querySetAndCombineIfReady(
                        setData, callbackData, callback
                    );
                    continue;
                }
                // else...
                let reqData = {
                    type: "termID",
                    c: setData.predCxtID,
                    s: encodeURI(setData.predStr),
                    t: setData.objID,
                };
                let thisSetManger = this;
                dbReqManager.query(null, reqData, function($ci, result) {
                    setData.predID = (result[0] ?? [0])[0];
                    thisSetManger.querySetAndCombineIfReady(
                        setData, callbackData, callback
                    );
                });
            } else if (!setData.isReady) {
                this.transformSet(setData.set, setData.ratTransFun);
                setData.isReady = true;
            }
        }
        this.combineSetsIfReady(callbackData, callback);
    }

    querySetAndCombineIfReady(setData, callbackData, callback) {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let queryParams = setData.queryParams;
        queryParams.offset ??= 0;
        let reqData = {
            type: "set",
            u: setData.userID,
            p: setData.predID,
            rl: queryParams.ratingLo,
            rh: queryParams.ratingHi,
            n: queryParams.num,
            o: queryParams.offset,
            a: queryParams.isAscending,
        };
        let thisSetManger = this;
        dbReqManager.query(null, reqData, function($ci, result) {
            setData.set = this.transformSet(result, setData.ratTransFun);
            setData.isReady = true;
            this.combineSetsIfReady(callbackData, callback);
        });
    }

    transformSet(set, ratTransFun) {
        set.forEach(function(row) {
            row[2] = ratTransFun(row[0]);
            row[3] = setData;
        });
    }

    combineSetsIfReady(callbackData, callback) {
        let isReady = this.setDataArr.reduce(
            (acc, val) => acc && val.isReady, true
        );
        if (isReady) {
            let combSet = this.computeCombinedSet();
            callback(combSet, callbackData);
        }
    }

    computeCombinedSet() {
        let setArr = this.setDataArr.map(val => val.set);
        let setN = setArr.pop();
        let ret = setN.concat(...setArr);
    }






    // computeAveragedSet() sorts the avgSet after subjID, only if setNum (i.e.
    // this.setDataArr[i].setArr.length) is larger than 1. Otherwise the
    // avgSet will just be result of the single set query.
    computeAveragedSet(setData) {
        let setArr = setData.setArr;
        // if there is only one set, simply return the set as is.
        let setNum = setArr.length;
        if (setNum === 1) {
            return setData.avgSet = setArr[0];
        }
        // if only one set is non-empty, simply return that set.
        let setLengths = setArr.map(val => val.length);
        let nonEmptyNum = setLengths.reduce(
            (acc, val) => acc + (val === 0 ? 0 : 1), 0
        );
        if (nonEmptyNum === 1) {
            return setData.avgSet = setArr.reduce(
                (acc, val) => acc.length > 0 ? acc : val, []
            );
        }
        // else, first sort each array in terms of the subject IDs.
        for (let i = 0; i < setNum; i++) {
            setArr[i].sort((row1, row2) => row1[1] - row2[1]);
        }
        // then... TODO: make comments for the rest of the code.
        let userWeightArr = setData.userWeightArr;
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
        return setData.avgSet = ret;
    }

    // computeAveragedSet() sorts the combSet according to this.sortAscending.
    computeCombinedSet() {
        let setDataArr = this.setDataArr;
        let setNum = setDataArr.length;
        // if setNum is 1, simply return the avgSet (potentially reversed),
        // ignoring the ratTransFun, even if this is defined to something else
        // than x => x.
        if (setNum <= 1) {
            if (
                setDataArr[0].queryParams.isAscending == this.sortAscending
            ) {
                return this.combSet = setDataArr[0].avgSet;
            } else {
                return this.combSet = setDataArr[0].avgSet.toReversed();
            }
        }
        // else if setNum is larger than 1, then initialize first the return
        // array to the first averaged set, but with an extra third column
        // meant to contain all the averaged ratings before this combination.
        let ret = setDataArr[0].avgSet.map(
            row => [row[0], row[1], new Array(setNum).fill(row[0])]
        );
        // for each subsequent avgSet, look for any subjID contained in the
        // first set, and for each one found, apply the setDataArr[i]
        // .ratTransFun to the averaged ratVal and add the result to the
        // combRatVal located in the first column of ret. Also store the same
        // averaged ratVal as is in the array in the third column of ret.
        let retLen = ret.length;
        for (let i = 1; i < setNum; i++) {
            let ratTransFun = setDataArr[i].ratTransFun ?? (x => x);
            let avgSet = setDataArr[i].avgSet;
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
 * getCombinedSet(setDataArr) returns a combined set,
 * combSet = [[combRatVal, subjID, ratValArr], ...]. This is done by first
 * using setAveragedSets() to get averaged sets for each predicate. Then these
 * sets are further combined into one by applying the individual ratTransFuns
 * and then adding up the values. The first predicate in setDataArr and the
 * corresponding averaged set is treated specially in that the combined will
 * contain all the entities of that set and no more. If the other sets contain
 * other entities, these will then not be used for the combined set. And for
 * all the entities of the first set that are not present in a given other set,
 * their averaged rating value will then be set to 0 (before applying the
 * rating transformer function).
 */





// TODO: Correct the following event method if needed and add more event methods
// to query for more elements of the sets. I imagine a method that simply adds
// the same number of setData to the setDataArr, with the same
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
