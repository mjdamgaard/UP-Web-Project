
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
        sortAscending, concatSet, combSet // optional
    ) {
        this.setDataArr = setDataArr;
        this.sortAscending = sortAscending ?? 0; // false;
        this.concatSet = concatSet;
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
            this.computeConcatenatedSet();
            this.computeCombinedSet();
            callback(this.combSet, callbackData);
        }
    }

    computeConcatenatedSet() {
        let setArr = this.setDataArr.map(val => val.set);
        return this.concatSet = [].concat(...setArr).sort(
            (a, b) => a[1] - b[1]
        );
    }

    computeCombinedSet() {
        let ret = new Array(this.concatSet.length);
        let retLen = 0;
        this.concatSet.forEach(function(val, ind, arr) {
            if (val[1] !== (arr[ind - 1] ?? [])[1]) {
                ret[retLen] = [val[2], val[1], val[3].weight, ind];
                retLen++;
            } else {
                let row = ret[retLen];
                let currWeight = val[3].weight;
                let newWeight = row[2] + currWeight;
                row[0] = (row[0] * row[2] + val[2] * currWeight) / newWeight;
                row[2] = newWeight;
            }
        });
        ret.length = retLen;
        if (this.sortAscending) {
            return this.combSet = ret.sort((row1, row2) => row1[0] - row2[0]);
        } else {
            return this.combSet = ret.sort((row1, row2) => row2[0] - row1[0]);
        }
    }


    // This method utilizes the fact that concatSet is formed by shallow copies,
    // making it possible to change all row[2]'s by changing them in each
    // setData.set.
    retransformUnreadySetsAndRecombine() {
        // TODO: Implement.
    }

}







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
