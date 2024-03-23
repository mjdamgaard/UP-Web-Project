
import {DBRequestManager} from "./DBRequests.js";
// import {AccountManager} from "./contexts/AccountContext.js";

// const dbReqManager = new DBRequestManager;
// const accountManager = new AccountManager;



export class EntListGenerator {
  constructor() {
    this.entList = undefined;
    // To be redefined by descendant classes.
  }

  // Turns the class instance 
  become(entListGenerator) {
    this.constructor = entListGenerator.constructor;
    this.prototype = entListGenerator.prototype;
    for (const [key, value] of Object.entries(entListGenerator)) {
      this[key] = value;
    }
  }

  // Return a shallow clone of the class instance.
  clone() {
    // Abstract method.
  }

  // generateEntList() queries and combines entLists, then calls
  // callback(entList).
  generateEntList(obj, callbackData, callback)  {
    if (!callback) {
        callback = callbackData;
        callbackData = undefined;
    }
    // to be redefined by descendant classes.
  }

  // getLeaves() {
  //   if (this.catID || this.catSK) {
  //     return [this];
  //   }
  //   let childLeafArrays = this.children.map(val => getLeaves(val));
  //   return [].concat(...childLeafArrays);
  // }

  getCatKeys() {
    // Todo: Consider implementing.
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



export class EntListQuerier extends EntListGenerator {
  constructor(
    catKey, // : {catID : (num | undef), catSK : ({cxtID, defStr} | undef).
    queryUserID,
    num, ratingLo, ratingHi, // optional.
    isAscending, offset, // optional.
    entList, replaceExistingSet, // optional.
  ) {
    super();
    // if (typeof catKey === "object") {
    //   this.catCxtID = catKey.cxtID;
    //   this.catDefStr = catKey.defStr;
    // } else {
    //   this.catID = catKey;
    // }
    this.catID = catKey.catID;
    this.catSK = catKey.catSK;
    this.queryUserID = queryUserID;
    this.num = num ?? 300;
    this.ratingLo = ratingLo ?? 0;
    this.ratingHi = ratingHi ?? 0;
    this.isAscending = isAscending ?? 0;
    this.offset = offset ?? 0;
  }

  clone() {
    let ret = new EntListQuerier(
      // {catID: this.catID, catSK: this.catSK},
      // this.queryUserID,
    );
    for (const [key, value] of Object.entries(this)) {
      ret[key] = value;
    }
    return ret;
  }

  generateEntList(obj, callbackData, callback) {
    if (!callback) {
        callback = callbackData;
        callbackData = undefined;
    }
    if (this.entList) {
      callback(obj, this.entList, callbackData);
      return;
    }
    if (this.catID) {
      this.queryWithCatID(obj, callbackData, callback);
    } else {
      let reqData = {
        req: "entID",
        t: 2,
        c: this.catSK.cxtID,
        s: this.catSK.defStr,
      };
      DBRequestManager.query(this, reqData, function(g, result) {
        g.catID = (result[0] ?? [null])[0];
        if (g.catID) {
          g.queryWithCatID(obj, callbackData, callback);
        } else {
          g.entList = [];
          callback(obj, g.entList, callbackData);
        }
      });
    }
  }

  queryWithCatID(obj, callbackData, callback) {
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
    DBRequestManager.query(this, reqData, function(g, result) {
      g.entList = result;
      callback(obj, g.entList, callbackData);
    });
  }

  getCatKeys() {
    // if (!this.entList) {
    //   return [null];
    // } else {
    //   return [{catID: this.catID, catSK: this.catSK}];
    // }
    return [{catID: this.catID, catSK: this.catSK}];
  }
}

// SetCombiner is also an abstract class, as combineEntLists() needs
// implementing.
export class EntListCombiner extends EntListGenerator {
  constructor(
    entListGeneratorArr,
    sort, sortAscending, entListArr, isReadyArr, // optional.
  ) {
    super();
    this.entListGeneratorArr = entListGeneratorArr ?? [];
    let entListNum = this.entListGeneratorArr.length;
    this.entListArr = entListArr ?? new Array(entListNum);
    this.isReadyArr = isReadyArr ?? new Array(entListNum).fill(false);
    this.sort = sort ?? 1;
    this.sortAscending = sortAscending ?? 0;
  }

  clone() {
    // Abstract method.
  }

  generateEntList(obj, callbackData, callback) {
    if (!callback) {
        callback = callbackData;
        callbackData = undefined;
    }
    if (this.entList) {
      callback(obj, this.entList, callbackData);
      return;
    }
    let thisG = this;
    this.entListGeneratorArr.forEach(function(val, ind) {
      val.generateEntList(thisG, ind, function(g, entList, ind) {
        g.entListArr[ind] = (
          g.transformEntList(entList, ind) ?? entList
        );
        g.isReadyArr[ind] = true;
        g.combineEntListsIfReady(obj, callbackData, callback);
      });
    });
  }

  combineEntListsIfReady(obj, callbackData, callback) {
    let isReady = this.isReadyArr.reduce(
      (acc, val) => acc && val, true
    );
    if (isReady) {
      let combList = this.combineEntLists();
      // sort combEntList if this.sort is truthful.
      if (this.sort) {
        if (this.sortAscending) {
          combList = combList.sort((row1, row2) => row1[0] - row2[0]);
        } else {
          combList = combList.sort((row1, row2) => row2[0] - row1[0]);
        }
      }
      // finally call the callback with the resulting combSet.
      callback(obj, combList, callbackData);
    }
  }

  transformEntList(entList, gIndex) {
    // Can be redefined by descendant classes.
    // (transformSet() might also store additional data for combineSets().)
  }

  combineEntLists() {
    // To be redefined by descendant classes.
  }

  getCatKeys() {
    let catKeyArrArr = this.entListGeneratorArr.map(
      val => val.getCatKeys()
    );
    let catKeyArr = [].concat(...catKeyArrArr);
    // filter out repeated categories.
    catKeyArr = catKeyArr
      .map(val => JSON.stringify(val))
      .filter((val, ind, arr) => arr.indexOf(val) === ind)
      .map(val => JSON.parse(val));
    return catKeyArr;
  }
}


// MaxRatingSetCombiner is an example of a class that implements SetCombiner.
// It takes an array of SetGenerators and constructs a combined set by letting
// each instance in the union of the sets get its maximum rating value from
// across the sets.
export class MaxRatingEntListCombiner extends EntListCombiner {
  constructor(
    entListGeneratorArr,
    sort, sortAscending, entListArr, isReadyArr, // optional.
  ) {
    super(
      entListGeneratorArr,
      sort, sortAscending, entListArr, isReadyArr,
    );
  }

  clone() {
    let ret = new MaxRatingEntListCombiner();
    for (const [key, value] of Object.entries(this)) {
      ret[key] = value;
    }
    return ret;
  }

  combineEntLists() {
    // entListArr is imploded into concatArr, which is then sorted by instID.
    let concatEntList = [].concat(...this.entListArr).sort(
      (a, b) => a[1] - b[1]
    );
    // construct a return array by recording only the maximal rating for
    // each group of elements with the same instID in the concatArr.
    let ret = new Array(concatEntList.length);
    let retLen = 0;
    let currInstID = 0;
    let row, maxRatVal, currRatVal;
    concatEntList.forEach(function(val, ind) {
      // if val is the first in a group with the same instID, record its
      // ratVal as the maxRatVal and add a copy of val to the return
      // array.
      if (val[1] !== currInstID) {
        currInstID = val[1];
        maxRatVal = val[0];
        ret[retLen] = (row = [maxRatVal, currInstID]);
        retLen++;
      // else compare the ratVal to the previous maxRatVal and change the
      // last row of the return array if it is larger.
      } else {
        currRatVal = val[0];
        if (currRatVal > maxRatVal) {
          row[0] = (maxRatVal = currRatVal);
        }
      }
    });
    // delete the empty slots of ret and return it.
    ret.length = retLen;
    return ret;
  }
}

// PrioritySetCombiner takes an array of SetGenerators and constructs a combined
// entList by letting each instance get the rating of the first entList in which they
// appeared in the generated entLists of the entListGeneratorArr.
export class PriorityEntListCombiner extends EntListCombiner {
  constructor(
    entListGeneratorArr,
    sort, sortAscending, entListArr, isReadyArr, // optional.
  ) {
    super(
      entListGeneratorArr,
      sort, sortAscending, entListArr, isReadyArr,
    );
  }

  clone() {
    let ret = new PriorityEntListCombiner();
    for (const [key, value] of Object.entries(this)) {
      ret[key] = value;
    }
    return ret;
  }

  transformEntList(entList, gIndex) {
    return entList.map(function(val) {
      val[2] = gIndex;
      return val;
    });
  }

  combineEntLists() {
    // entListArr is imploded into concatArr, which is then sorted by instID.
    let concatEntList = [].concat(...this.entListArr).sort(
      (a, b) => a[1] - b[1]
    );
    // construct a return array by recording only the one rating for each
    // group of elements with the same instID in the concatArr, namely the
    // one with the smallest entList generator index (val[2]).
    let ret = new Array(concatEntList.length);
    let retLen = 0;
    let currInstID = 0;
    let row, minGIndex, currGIndex;
    concatEntList.forEach(function(val, ind) {
      // if val is the first in a group with the same instID, record its
      // gIndex and add a copy of val to the return array.
      if (val[1] !== currInstID) {
        currInstID = val[1];
        minGIndex = val[2];
        ret[retLen] = (row = [val[0], currInstID, minGIndex]);
        retLen++;
      // else compare the val[2] to the previous minGIndex and change the
      // last row of the return array if it is smaller.
      } else {
        currGIndex = val[2];
        if (currGIndex > minGIndex) {
          row[2] = (minGIndex = currGIndex);
        }
      }
    });
    // delete the empty slots of ret and return it.
    ret.length = retLen;
    return ret;
  }
}

// WeightedAverageSetCombiner takes an array of SetGenerators and constructs a
// combined where each instance gets a rating that is a weighted average of all
// their ratings in each entList (of those in which they appear).
export class WeightedAverageEntListCombiner extends EntListCombiner {
  constructor(
    entListGeneratorArr,
    weightArr,
    sort, sortAscending, entListArr, isReadyArr, // optional.
  ) {
    super(
      entListGeneratorArr,
      sort, sortAscending, entListArr, isReadyArr,
    );
    this.weightArr = weightArr;
  }

  clone() {
    let ret = new WeightedAverageEntListCombiner();
    for (const [key, value] of Object.entries(this)) {
      ret[key] = value;
    }
    return ret;
  }

  transformEntList(entList, gIndex) {
    let weight = this.weightArr[gIndex];
    return entList.map(function(val) {
      val[2] = parseFloat(weight);
      val[0] = parseInt(val[0]);
      return val;
    });
  }

  combineEntLists() {
    // entListArr is imploded into concatArr, which is then sorted by instID.
    let concatEntList = [].concat(...this.entListArr).sort(
      (a, b) => a[1] - b[1]
    );
    // construct a return array by ...
    let ret = new Array(concatEntList.length);
    let retLen = 0;
    let currInstID = 0;
    let row, accWeight, currWeight, newWeight;
    concatEntList.forEach(val => {
      // if val is the first in a group with the same instID, write its
      // weight (val[2]) to the accumulated weight (accWeight) and add a
      // copy of val to the return array.
      if (val[1] !== currInstID) {debugger;
        currInstID = val[1];
        ret[retLen++] = (row = [val[0], val[1]]);
        accWeight = val[2];
      // else combine the last row with val by computing a combined,
      // ratVal, namely a weighted average, and also add the weight to
      // accWeight.
      } else {debugger;
        currWeight = val[2];
        newWeight = accWeight + currWeight;
        row[0] = (row[0] * accWeight + val[0] * currWeight) / newWeight;
        accWeight = newWeight;
      }
    });
    // delete the empty slots of ret and return it.
    ret.length = retLen;
    return ret;
  }
}



export class SimpleEntListGenerator extends PriorityEntListCombiner {
  constructor(
    catKey,
    accountManager,
    num, ratingLo, ratingHi, // optional.
    isAscending, offset, // optional.
    sort, sortAscending, entListArr, isReadyArr, // optional.
  ) {
    let entListGeneratorArr = accountManager.queryUserPriorityArr
      .filter(x => x)
      .map(id => new EntListQuerier(
        catKey,
        id,
        num, ratingLo, ratingHi,
        isAscending, offset,
      ));
    super(
      entListGeneratorArr,
      sort, sortAscending, entListArr, isReadyArr, // optional.
    );
  }

  clone() {
    let ret = new SimpleEntListGenerator();
    for (const [key, value] of Object.entries(this)) {
      ret[key] = value;
    }
    return ret;
  }
}
