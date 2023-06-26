
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL,
} from "/src/content_loaders/SDBInterfaces.js";





/*
SetList requires data:
    data.elemContentKey,
    data.setDataArr = [setData, ...],
        setData = {
            (predCxtID, predStr, objID, | predID,)
            userID,
            num, ratingLo, ratingHi, offset?, isAscending?,
        },
        queryParams = {num, ratingLo, ratingHi, offset?, isAscending?},
    data.combSet?
    data.sortAscending?,
    data.initialNum,
    data.incrementNum,
And it also sets/updates data:
    data.combSet = [[ratVal, subjID], ...],
    data.listElemDataArr = [{ratVal, termID}, ...].
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
        "setDataArr",
        "sortAscending",  // optional.
        "initialNum",
        "incrementNum",
    ]);
    data.copyFromAncestor("combSet", 1);  // optional.
});
setListCL.addCallback(function($ci, data) {
    data.cl = setListCL.getRelatedCL(data.elemContentKey);
    $ci.one("load-initial-elements", function(event, combSet) {
        data.listElemDataArr = combSet.slice(0, data.initialNum).map(val => ({
            combRatVal: val[0],
            termID: val[1],
            concatSetIndex: val[2],
        }));
        data.currentLen = data.initialNum;
        $ci.find('.CI.List').trigger("load");
        return false;
    });
    data.setManager = new SetManager(
        data.setDataArr,
        data.sortAscending, data.combSet,
    );
    data.setManager.queryAndCombineSets(function(combSet) {
        $ci.trigger("load-initial-elements", [combSet]);
    });
});



/*
setData = {
    (predCxtID, predStr, objID, | predID,)
    userID,
    num, ratingLo, ratingHi, offset?, isAscending?,
}
*/

export class SetQuerier {
    constructor(
        setData,
        set, replaceExistingSet, // optional.
    ) {
        this.setData = setData;
        setData.offset ??= 0;;
        setData.isAscending ??= 0;;
        this.set = set;
        this.replaceExistingSet = replaceExistingSet ?? false;
    }

    queryAndTrigger(obj, signal) {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let setData = this.setData;
        if (setData.predID) {
            this.queryWithPredIDAndTrigger(obj, signal);
        } else {
            let reqData = {
                type: "termID",
                c: setData.predCxtID,
                s: encodeURI(setData.predStr),
                t: setData.objID,
            };
            dbReqManager.query(this, reqData, signal,
                function(obj, result, signal) {
                    setData.predID = (result[0] ?? [0])[0];
                    obj.queryWithPredIDAndTrigger(obj, signal);
                }
            );
        }
    }

    queryWithPredIDAndTrigger(obj, signal) {
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        let setData = this.setData;
        let reqData = {
            type: "set",
            u: setData.userID,
            p: setData.predID,
            rl: setData.ratingLo,
            rh: setData.ratingHi,
            n: setData.num,
            o: setData.offset,
            a: setData.isAscending,
        };
        dbReqManager.query(this, reqData, function(sq, result) {
            if (sq.replaceExistingSet) {
                sq.set = result;
            } else {
                sq.set = sq.set.concat(result);
            }
            let setData = sq.setData;
            setData.offset += setData.num; // default for a subsequent query.
            obj.trigger(signal, [sq.set]);
        });
    }
}

export class SetCombiner {
    constructor(
        setDataArr,
    ) {
        // this.setDataArr = setDataArr ?? [];
        this.setQuerierArr = setDataArr.map(val => new SetQuerier(val));
        this.isReadyArr = new Array(setDataArr.length).fill(false);
    }

    queryAndCombineSets(callbackData, callback) {
        if (!callback) {
            callback = callbackData;
            callbackData = null;
        }
        let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
        setQuerierArr.forEach(function(val, ind) {
            val.queryAndTrigger(this, ind); // calls this.trigger(ind).
        });
    }

    trigger(ind, setArr) {
        let isReadyArr = this.isReadyArr;
        isReadyArr[ind] = true;
        let isReady = isReadyArr.reduce(
            (acc, val) => acc && val, true
        );
        if (isReady) {
            // ..
        }
    }

    transformSet(set, setData, i) {
        let ratTransFun = setData.ratTransFun;
        set.forEach(function(row) {
            row[2] = ratTransFun(row[0]);
            row[3] = i;
        });
        return set;
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
        let weightArr = this.setDataArr.map(val => val.weight);
        let currSubjID = 0;
        let row, accWeight, currWeight, newWeight;
        this.concatSet.forEach(function(val, ind) {
            if (val[1] !== currSubjID) {
                currSubjID = val[1];
                ret[retLen] = (row = [val[2], val[1], ind]);
                retLen++;
                accWeight = weightArr[val[3]];
            } else {
                currWeight = weightArr[val[3]];
                newWeight = accWeight + currWeight;
                row[0] = (row[0] * accWeight + val[2] * currWeight) / newWeight;
                accWeight = newWeight;
            }
        });
        // delete the weight column of the last row and delete the empty slots.
        if (retLen > 0) {
            ret[retLen - 1].length = 3;
        }
        ret.length = retLen;
        // set and return this.combSet as ret sorted after the combRatVal.
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




// /*
// data.setDataArr = [setData, ...],
//     setData = {
//         predCxtID, predStr, objID,
//         predID?,
//         userID,
//         // weight, queryParams, ratTransFun?,
//         set?,
//         concatWithExistingSet?,
//         isReady?,
//     },
//     queryParams = {num, ratingLo, ratingHi, offset?, isAscending}.
// */
//
// export class SetManager {
//     constructor(
//         setDataArr,
//         parentManager, childManagerArr,
//         sortAscending, combSet
//     ) {
//         this.setDataArr = setDataArr ?? [];
//         this.parentManager = parentManager;
//         this.childManagerArr = childManagerArr ?? [];
//         this.sortAscending = sortAscending ?? 0; // false;
//         // this.concatSet = concatSet;
//         this.combSet = combSet;
//     }
//
//     queryAndCombineSets(callbackData, callback) {
//         if (!callback) {
//             callback = callbackData;
//             callbackData = null;
//         }
//         let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
//         let setNum = this.setDataArr.length;
//         for (let i = 0; i < setNum; i++) {
//             let setData = this.setDataArr[i];
//             if (!setData.set) {
//                 // if setData.predID is already known, query for the set
//                 // immediately.
//                 if (setData.predID) {
//                     this.querySetAndCombineIfReady(
//                         setData, i, callbackData, callback
//                     );
//                     continue;
//                 }
//                 // else, first query for the predID, and then the set.
//                 let reqData = {
//                     type: "termID",
//                     c: setData.predCxtID,
//                     s: encodeURI(setData.predStr),
//                     t: setData.objID,
//                 };
//                 dbReqManager.query(this, reqData, i, function(obj, result, i) {
//                     setData.predID = (result[0] ?? [0])[0];
//                     obj.querySetAndCombineIfReady(
//                         setData, i, callbackData, callback
//                     );
//                 });
//             } else if (!setData.isReady) {
//                 setData.set = this.transformSet(setData.set, setData, i);
//                 setData.isReady = true;
//             }
//         }
//         this.combineSetsIfReady(callbackData, callback);
//     }
//
//     querySetAndCombineIfReady(setData, i, callbackData, callback) {
//         let dbReqManager = sdbInterfaceCL.globalData.dbReqManager;
//         let queryParams = setData.queryParams;
//         queryParams.offset ??= 0;;
//         queryParams.isAscending ??= 0;;
//         let reqData = {
//             type: "set",
//             u: setData.userID,
//             p: setData.predID,
//             rl: queryParams.ratingLo,
//             rh: queryParams.ratingHi,
//             n: queryParams.num,
//             o: queryParams.offset,
//             a: queryParams.isAscending,
//         };
//         dbReqManager.query(this, reqData, i, function(obj, result, i) {
//             setData.set = obj.transformSet(result, setData, i);
//             setData.isReady = true;
//             obj.combineSetsIfReady(callbackData, callback);
//         });
//     }
//
//     transformSet(set, setData, i) {
//         let ratTransFun = setData.ratTransFun;
//         set.forEach(function(row) {
//             row[2] = ratTransFun(row[0]);
//             row[3] = i;
//         });
//         return set;
//     }
//
//     combineSetsIfReady(callbackData, callback) {
//         let isReady = this.setDataArr.reduce(
//             (acc, val) => acc && val.isReady, true
//         );
//         if (isReady) {
//             this.computeConcatenatedSet();
//             this.computeCombinedSet();
//             callback(this.combSet, callbackData);
//         }
//     }
//
//     computeConcatenatedSet() {
//         let setArr = this.setDataArr.map(val => val.set);
//         return this.concatSet = [].concat(...setArr).sort(
//             (a, b) => a[1] - b[1]
//         );
//     }
//
//     computeCombinedSet() {
//         let ret = new Array(this.concatSet.length);
//         let retLen = 0;
//         let weightArr = this.setDataArr.map(val => val.weight);
//         let currSubjID = 0;
//         let row, accWeight, currWeight, newWeight;
//         this.concatSet.forEach(function(val, ind) {
//             if (val[1] !== currSubjID) {
//                 currSubjID = val[1];
//                 ret[retLen] = (row = [val[2], val[1], ind]);
//                 retLen++;
//                 accWeight = weightArr[val[3]];
//             } else {
//                 currWeight = weightArr[val[3]];
//                 newWeight = accWeight + currWeight;
//                 row[0] = (row[0] * accWeight + val[2] * currWeight) / newWeight;
//                 accWeight = newWeight;
//             }
//         });
//         // delete the weight column of the last row and delete the empty slots.
//         if (retLen > 0) {
//             ret[retLen - 1].length = 3;
//         }
//         ret.length = retLen;
//         // set and return this.combSet as ret sorted after the combRatVal.
//         if (this.sortAscending) {
//             return this.combSet = ret.sort((row1, row2) => row1[0] - row2[0]);
//         } else {
//             return this.combSet = ret.sort((row1, row2) => row2[0] - row1[0]);
//         }
//     }
//
//
//     // This method utilizes the fact that concatSet is formed by shallow copies,
//     // making it possible to change all row[2]'s by changing them in each
//     // setData.set.
//     retransformUnreadySetsAndRecombine() {
//         // TODO: Implement.
//     }
//
// }
