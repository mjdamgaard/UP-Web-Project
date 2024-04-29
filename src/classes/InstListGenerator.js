
import {DBRequestManager} from "../classes/DBRequestManager.js";
// import {AccountManager} from "./contexts/AccountContext.js";

// const dbReqManager = new DBRequestManager;
// const accountManager = new AccountManager;



// InstListGenerator is an abstract class.
export class InstListGenerator {
  constructor() {
    this.instList = undefined;
    // To be redefined by descendant classes.
  }

  // Returns a string with the class name, e.g. "InstListQuerier".
  getType() {
    // Abstract method.
    throw "InstListGenerator";
  }

  // Turns the class instance 
  become(instListGenerator) {
    // this.constructor = instListGenerator.constructor;
    this.prototype = instListGenerator.prototype;
    for (const [key, value] of Object.entries(instListGenerator)) {
      this[key] = value;
    }
  }

  // Return a shallow clone of the class instance.
  clone() {
    let ret = {};
    ret.prototype = this.prototype;
    for (const [key, value] of Object.entries(this)) {
      ret[key] = value;
    }
    return ret;
  }

  // generateInstList() queries and combines instLists, then calls
  // callback(instList).
  generateInstList(callback)  {
    // to be redefined by descendant classes.
  }

  // requestMoreElements() adds more elements to the instList and returns true,
  // or fails to get more and returns false.
  requestMoreElements() {
    // Abstract method.
    return false;
  }

  // // getCatKeys(callback) waits until all catIDs are queried for, then calls
  // // callback(catKeyArr), where each catKey in this array has the type:
  // // {catID : (num | undef | null), catSK : ({cxtID, defStr} | undef).
  // // If catID is null, it means that it was queried for and was not found.
  // getCatKeys(callback) {
  //   this.getCatKeysCallback = callback;
  // }


  // // getFilterSpecs() returns an array of filter specs (or null), which
  // // each consists of a category ID, threshold and a flag to denote either
  // // the interval below or above the threshold for which all set elements
  // // with a rating in that interval should collapse itself automatically (in
  // // a future version of this web app).
  // getFilterSpecs() {
  //   // Can be redefined by descendant classes.
  // }

}



export class InstListQuerier extends InstListGenerator {
  constructor(
    catKey, // : {catID : (num | undef), catSK : ({cxtID, defStr} | undef).
    queryUserID,
    num, ratingLo, ratingHi, // optional.
    isAscending, offset, // optional.
    instList, replaceExistingSet, // optional.
  ) {
    super();
    this.catID = catKey.catID;
    this.catSK = catKey.catSK;
    this.queryUserID = queryUserID;
    this.num = num ?? 300;
    this.ratingLo = ratingLo ?? 0;
    this.ratingHi = ratingHi ?? 0;
    this.isAscending = isAscending ?? 0;
    this.offset = offset ?? 0;

    this.catKeyCallback = undefined;
  }
  
  getType() {
    return "InstListQuerier";
  }

  generateInstList(callback) {
    if (this.instList) {
      callback(this.instList);
      return;
    }
    if (this.catID) {
      this.queryWithCatID(callback);
    } else {
      let reqData = {
        req: "entID",
        t: 2,
        c: this.catSK.cxtID,
        s: this.catSK.defStr,
      };
      DBRequestManager.query(this, reqData, function(thisLG, result) {
        thisLG.catID = (result[0] ?? [null])[0];
        if (thisLG.catID) {
          thisLG.queryWithCatID(callback);
        } else {
          thisLG.instList = [];
          callback(thisLG.instList);
        }

        // Call and delete the catKeyCallback if any.
        if (thisLG.catKeyCallback) {
          thisLG.catKeyCallback({catID: thisLG.catID, catSK: thisLG.catSK});
          delete thisLG.catKeyCallback;
        }
      });
    }
  }

  queryWithCatID(callback) {
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
    DBRequestManager.query(this, reqData, function(lg, result) {
      lg.instList = result;
      callback(lg.instList);
    });
  }

  // getCatKey(callback) waits until the catID is queried for, then calls
  // callback(catKey), where catKey has the type:
  // {catID : (num | undef | null), catSK : ({cxtID, defStr} | undef).
  // If catID is null, it means that it was queried for and was not found.
  getCatKey(callback) {
    if (this.catID !== undefined) {
      callback({catID: this.catID, catSK: this.catSK});
      return true;
    }
    this.catKeyCallback = callback;
    return false;
  }
}

// SetCombiner is also an abstract class, as combineInstLists() needs
// implementing.
export class InstListCombiner extends InstListGenerator {
  constructor(
    listGeneratorArr,
    sort, sortAscending, instListArr, isReadyArr, // optional.
  ) {
    super();
    this.listGeneratorArr = listGeneratorArr ?? [];
    let instListNum = this.listGeneratorArr.length;
    this.instListArr = instListArr ?? new Array(instListNum);
    this.isReadyArr = isReadyArr ?? new Array(instListNum).fill(false);
    this.sort = sort ?? 1;
    this.sortAscending = sortAscending ?? 0;
  }
  
  getType() {
    // Abstract method.
    throw "InstListCombiner";
  }

  generateInstList(callback) {
    if (this.instList) {
      callback(this.instList);
      return;
    }
    let parentLG = this;
    this.listGeneratorArr.forEach((val, ind) => {
      val.generateInstList(instList => {
        parentLG.instListArr[ind] = (
          parentLG.transformInstList(instList, ind) ?? instList
        );
        parentLG.isReadyArr[ind] = true;
        parentLG.combineInstListsIfReady(callback);
      });
    });
  }

  combineInstListsIfReady(callback) {
    let isReady = this.isReadyArr.reduce(
      (acc, val) => acc && val, true
    );
    if (isReady) {
      let combList = this.combineInstLists();
      // sort combInstList if this.sort is truthful.
      if (this.sort) {
        if (this.sortAscending) {
          combList = combList.sort((row1, row2) => row1[0] - row2[0]);
        } else {
          combList = combList.sort((row1, row2) => row2[0] - row1[0]);
        }
      }
      // finally call the callback with the resulting combSet.
      callback(combList);
    }
  }

  transformInstList(instList, lgIndex) {
    // Can be redefined by descendant classes.
    // (transformSet() might also store additional data for combineSets().)
  }

  combineInstLists() {
    // To be redefined by descendant classes.
  }

  getCatKeys() {
    let catKeyArrArr = this.listGeneratorArr.map(
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
export class MaxRatingInstListCombiner extends InstListCombiner {
  constructor(
    listGeneratorArr,
    sort, sortAscending, instListArr, isReadyArr, // optional.
  ) {
    super(
      listGeneratorArr,
      sort, sortAscending, instListArr, isReadyArr,
    );
  }
  
  getType() {
    return "MaxRatingInstListCombiner";
  }

  combineInstLists() {
    // instListArr is imploded into concatArr, which is then sorted by instID.
    let concatInstList = [].concat(...this.instListArr).sort(
      (a, b) => a[1] - b[1]
    );
    // construct a return array by recording only the maximal rating for
    // each group of elements with the same instID in the concatArr.
    let ret = new Array(concatInstList.length);
    let retLen = 0;
    let currInstID = 0;
    let row, maxRatVal, currRatVal;
    concatInstList.forEach(function(val, ind) {
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
// instList by letting each instance get the rating of the first instList in which they
// appeared in the generated instLists of the listGeneratorArr.
export class PriorityInstListCombiner extends InstListCombiner {
  constructor(
    listGeneratorArr,
    sort, sortAscending, instListArr, isReadyArr, // optional.
  ) {
    super(
      listGeneratorArr,
      sort, sortAscending, instListArr, isReadyArr,
    );
  }
  
  getType() {
    return "PriorityInstListCombiner";
  }

  // clone() {
  //   let ret = new PriorityInstListCombiner();
  //   for (const [key, value] of Object.entries(this)) {
  //     ret[key] = value;
  //   }
  //   return ret;
  // }

  transformInstList(instList, lgIndex) {
    return instList.map(function(val) {
      val[2] = lgIndex;
      return val;
    });
  }

  combineInstLists() {
    // instListArr is imploded into concatArr, which is then sorted by instID.
    let concatInstList = [].concat(...this.instListArr).sort(
      (a, b) => a[1] - b[1]
    );
    // construct a return array by recording only the one rating for each
    // group of elements with the same instID in the concatArr, namely the
    // one with the smallest instList generator index (val[2]).
    let ret = new Array(concatInstList.length);
    let retLen = 0;
    let currInstID = 0;
    let row, minLGIndex, currLGIndex;
    concatInstList.forEach(function(val, ind) {
      // if val is the first in a group with the same instID, record its
      // lgIndex and add a copy of val to the return array.
      if (val[1] !== currInstID) {
        currInstID = val[1];
        minLGIndex = val[2];
        ret[retLen] = (row = [val[0], currInstID, minLGIndex]);
        retLen++;
      // else compare the val[2] to the previous minLGIndex and change the
      // last row of the return array if it is smaller.
      } else {
        currLGIndex = val[2];
        if (currLGIndex > minLGIndex) {
          row[2] = (minLGIndex = currLGIndex);
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
// their ratings in each instList (of those in which they appear).
export class WeightedAverageInstListCombiner extends InstListCombiner {
  constructor(
    listGeneratorArr,
    weightArr,
    sort, sortAscending, instListArr, isReadyArr, // optional.
  ) {
    super(
      listGeneratorArr,
      sort, sortAscending, instListArr, isReadyArr,
    );
    this.weightArr = weightArr;
  }
  
  getType() {
    return "WeightedAverageInstListCombiner";
  }

  transformInstList(instList, lgIndex) {
    let weight = this.weightArr[lgIndex];
    return instList.map(function(val) {
      val[2] = parseFloat(weight);
      val[0] = parseInt(val[0]);
      return val;
    });
  }

  combineInstLists() {
    // instListArr is imploded into concatArr, which is then sorted by instID.
    let concatInstList = [].concat(...this.instListArr).sort(
      (a, b) => a[1] - b[1]
    );
    // construct a return array by ...
    let ret = new Array(concatInstList.length);
    let retLen = 0;
    let currInstID = 0;
    let row, accWeight, currWeight, newWeight;
    concatInstList.forEach(val => {
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



export class SimpleInstListGenerator extends PriorityInstListCombiner {
  constructor(
    catKey,
    accountManager,
    num, ratingLo, ratingHi, // optional.
    isAscending, offset, // optional.
    sort, sortAscending, instListArr, isReadyArr, // optional.
  ) {
    let listGeneratorArr = accountManager.queryUserPriorityArr
      .filter(x => x)
      .map(id => new InstListQuerier(
        catKey,
        id,
        num, ratingLo, ratingHi,
        isAscending, offset,
      ));
    super(
      listGeneratorArr,
      sort, sortAscending, instListArr, isReadyArr, // optional.
    );
  }
  
  getType() {
    return "SimpleInstListGenerator";
  }

  // getCatKey(callback) waits until the catID is queried for, then calls
  // callback(catKey), where catKey has the type:
  // {catID : (num | undef | null), catSK : ({cxtID, defStr} | undef).
  // If catID is null, it means that it was queried for and was not found.
  getCatKey(callback) {
    return this.listGeneratorArr[0].getCatKey(callback);
  }
}
