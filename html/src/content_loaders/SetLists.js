
import {
    ContentLoader,
} from "/src/ContentLoader.js";
import {
    sdbInterfaceCL, dbReqManager,
} from "/src/content_loaders/SDBInterfaces.js";




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
        "setGenerator",
        "initialNum",
        "incrementNum",
    ]);
});
setListCL.addCallback(function($ci, data) {
    data.cl = setListCL.getRelatedCL(data.elemContentKey);
    $ci.one("load-initial-elements", function(event, set) {
        data.listElemDataArr = set.slice(0, data.initialNum).map(val => ({
            ratVal: val[0],
            entID: val[1],
        }));
        data.currentNum = data.initialNum;
        $ci.find('.CI.List').trigger("load");
        return false;
    });
    $ci.on("append-elements", function(event, set) {
        let currNum = data.currentNum;
        let newNum = currNum + data.incrementNum;
        data.listElemDataArr = set.slice(currNum, newNum).map(val => ({
            ratVal: val[0],
            entID: val[1],
        }));
        data.currentNum = newNum;
        setListCL.loadAppended($ci, "List", data);
        return false;
    });
    data.setGenerator.generateSet($ci, function($ci, set) {
        $ci.trigger("load-initial-elements", [set]);
    });
});


/* SetGenerator is just a completely abstract class */
export class SetGenerator {
    constructor() {
        this.set = null;
        // To be redefined by descendant classes.
    }

    // generateSet() queries and combines sets, then calls
    // callback(obj, set, callbackData).
    generateSet(obj, callbackData, callback) {
        // to be redefined by descendant classes.
    }

    // getSetCategories() returns an array of all category IDs that are
    // important to the formation of the set (which we can then show on the
    // drop-down pages of the set elements).
    getSetCategories() {
        // To be redefined by descendant classes.
    }

    // getFilterSpecs() returns an array of filter specs (or null), which
    // each consists of a category ID, threshold and a flag to denote either
    // the interval below or above the threshold for which all set elements
    // with a rating in that interval should collapse itself automatically (in
    // a future version of this web app).
    getFilterSpecs() {
        // Can be redefined by descendant classes.
    }
}



export class SetQuerier extends SetGenerator {
    constructor(
        catKey, // = catID | [catCxtID, catDefStr]
        queryUserID,
        inputUserID, // (This property is only part of a temporary solution.)
        num, ratingLo, ratingHi, // optional.
        isAscending, offset, // optional.
        set, replaceExistingSet, // optional.
    ) {
        super();
        if (typeof catKey === "object") {
            this.catCxtID = catKey[0];
            this.catDefStr = catKey[1];
        } else {
            this.catID = catKey;
        }
        this.queryUserID = queryUserID;
        this.inputUserID = inputUserID;
        this.num = num ?? 300;
        this.ratingLo = ratingLo ?? 0;
        this.ratingHi = ratingHi ?? 0;
        this.isAscending = isAscending ?? 0;
        this.offset = offset ?? 0;
    }

    generateSet(obj, callbackData, callback) {
        if (this.set) {
            callback(obj, this.set, callbackData);
            return;
        }
        if (!callback) {
            callback = callbackData;
            callbackData = undefined;
        }
        if (this.catID) {
            this.queryWithCatID(obj, callbackData, callback);
        } else {
            let reqData = {
                req: "entID",
                t: 2,
                c: this.catCxtID,
                s: this.catDefStr,
            };
            dbReqManager.query(this, reqData, function(sg, result) {
                sg.catID = (result[0] ?? [0])[0];
                sg.queryWithCatID(obj, callbackData, callback);

                // As a temporary solution for adding missing categories, all
                // categories are just automatically submitted to the database,
                // if they are missing in this query.
                if (sg.catID || !sg.inputUserID) {
                    return;
                }
                let reqData = {
                    req: "ent",
                    u: sg.inputUserID,
                    t: 2,
                    c: sg.catCxtID,
                    s: sg.catDefStr,
                };
                dbReqManager.input(sg, reqData, function() {});
            });
        }
    }

    queryWithCatID(obj, callbackData, callback) {
        if (!callback) {
            callback = callbackData;
            callbackData = undefined;
        }
        let reqData = {
            req: "set",
            u: this.queryUserID,
            c: this.catID,
            rl: this.ratingLo,
            rh: this.ratingHi,
            n: this.num,
            o: this.offset,
            a: this.isAscending,
        };
        dbReqManager.query(this, reqData, function(sg, result) {
            sg.set = result;
            callback(obj, sg.set, callbackData);
        });
    }

    getSetCategories() {
        // There is a race condition here, so take heed of it and try not to
        // call getSetCategories() before the first entID queries.
        // TODO: Consider if this race condition should be eliminated somehow.
        return [this.catID ?? null];
    }
}

/* SetCombiner is also an abstract class, as combineSets() needs implementing */
export class SetCombiner extends SetGenerator {
    constructor(
        setGeneratorArr,
        sortAscending, setArr, isReadyArr, // optional.
    ) {
        super();
        this.setGeneratorArr = setGeneratorArr ?? [];
        let setNum = this.setGeneratorArr.length;
        this.setArr = setArr ?? new Array(setNum);
        this.isReadyArr = isReadyArr ?? new Array(setNum).fill(false);
        this.sortAscending = sortAscending ?? 0;
    }

    generateSet(obj, callbackData, callback) {
        if (this.set) {
            callback(obj, this.set, callbackData);
            return;
        }
        if (!callback) {
            callback = callbackData;
            callbackData = undefined;
        }
        let thisSG = this;
        this.setGeneratorArr.forEach(function(val, ind) {
            val.generateSet(thisSG, ind, function(sg, set, ind) {
                sg.setArr[ind] = (sg.transformSet(set) ?? set);
                sg.isReadyArr[ind] = true;
                sg.combineSetsIfReady(obj, callbackData, callback);
            });
        });
    }

    combineSetsIfReady(obj, callbackData, callback) {
        let isReady = this.isReadyArr.reduce(
            (acc, val) => acc && val, true
        );
        if (isReady) {
            let combSet = this.combineSets();
            callback(obj, combSet, callbackData);
        }
    }

    transformSet(set) {
        // can be redefined by descendant classes.
        // (transformSet() might also store additional data for combineSets().)
    }

    combineSets() {
        // to be redefined by descendant classes.
    }

    getSetCategories() {
        let catIDArrArr = this.setGeneratorArr.map(
            val => val.getSetCategories()
        );
        return [].concat(...catIDArrArr);
    }
}


/* An example of a class that implements SetCombiner */
export class MaxRatingSetCombiner extends SetCombiner {
    constructor(
        setGeneratorArr,
        sortAscending, setArr, isReadyArr, // optional.
    ) {
        super(
            setGeneratorArr,
            sortAscending, setArr, isReadyArr,
        );
    }

    combineSets() {
        // setArr is imploded into concatArr, which is then sorted by instID.
        let concatSet = [].concat(...this.setArr).sort(
            (a, b) => a[1] - b[1]
        );
        // construct a return array by recording only the maximal rating for
        // each group of elements with the same instID in the concatArr.
        let ret = new Array(concatSet.length);
        let retLen = 0;
        let currInstID = 0;
        let row, maxRat, currRat;
        concatSet.forEach(function(val, ind) {
            if (val[1] !== currInstID) {
                currInstID = val[1];
                maxRat = val[0];
                ret[retLen] = (row = [maxRat, currInstID]);
                retLen++;
            } else {
                currRat = val[0];
                if (currRat > maxRat) {
                    row[0] = (maxRat = currRat);
                }
            }
        });
        // delete the empty slots of ret.
        ret.length = retLen;
        // set and return this.combSet as ret sorted after the combRatVal.
        if (this.sortAscending) {
            return ret.sort((row1, row2) => row1[0] - row2[0]);
        } else {
            return ret.sort((row1, row2) => row2[0] - row1[0]);
        }
    }
}



// /*
// data.setDataArr = [setData, ...],
//     setData = {
//         catCxtID, catDefStr, objID,
//         catID?,
//         queryUserID,
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
//             callbackData = undefined;
//         }
//         let setNum = this.setDataArr.length;
//         for (let i = 0; i < setNum; i++) {
//             let setData = this.setDataArr[i];
//             if (!setData.set) {
//                 // if setData.catID is already known, query for the set
//                 // immediately.
//                 if (setData.catID) {
//                     this.querySetAndCombineIfReady(
//                         setData, i, callbackData, callback
//                     );
//                     continue;
//                 }
//                 // else, first query for the catID, and then the set.
//                 let reqData = {
//                     req: "entID",
//                     c: setData.catCxtID,
//                     s: setData.catDefStr,
//                     t: setData.objID,
//                 };
//                 dbReqManager.query(this, reqData, i, function(obj, result, i) {
//                     setData.catID = (result[0] ?? [0])[0];
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
//         let queryParams = setData.queryParams;
//         queryParams.offset ??= 0;;
//         queryParams.isAscending ??= 0;;
//         let reqData = {
//             req: "set",
//             u: setData.queryUserID,
//             c: setData.catID,
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
//         let currInstID = 0;
//         let row, accWeight, currWeight, newWeight;
//         this.concatSet.forEach(function(val, ind) {
//             if (val[1] !== currInstID) {
//                 currInstID = val[1];
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
//
// }
