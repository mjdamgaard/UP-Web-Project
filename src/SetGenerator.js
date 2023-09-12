
import {
  dbReqManager, accountManager,
} from "/src/content_loaders/SDBInterface.js";




/* SetGenerator is just a completely abstract class */
export class SetGenerator {
  constructor() {
    this.set = null;
    // To be redefined by descendant classes.
  }

  // getNewElements() queries and generates .
  getNewElements(num) {
    // to be redefined by descendant classes.
  }
}



export class SetQuerier extends SetGenerator {
  constructor(
    catKey, // = catID | [catCxtID, catDefStr].
    queryUserID,
    num, ratingLo, ratingHi, // optional.
    isAscending, offset, // optional.
    set, replaceExistingSet, // optional.
  ) {
    super();
    if (typeof catKey === "object") {
      this.catCxtID = catKey.cxtID;
      this.catDefStr = catKey.defStr;
    } else {
      this.catID = catKey;
    }
    this.queryUserID = queryUserID;
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
        sg.catID = (result[0] ?? [null])[0];
        if (sg.catID) {
          sg.queryWithCatID(obj, callbackData, callback);
        } else {
          sg.set = [];
          callback(obj, sg.set, callbackData);
        }
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

  getSetCategoryKeys() {
    // There is a race condition here, so beware of it and try not to
    // call getSetCategoryKeys() before the first entID queries.
    // TODO: Consider if this race condition should be eliminated somehow.
    return [
      this.catID ?? JSON.stringify({
        cxtID: this.catCxtID,
        defStr: this.catDefStr,
      })
    ];
  }
}

/* SetCombiner is also an abstract class, as combineSets() needs implementing */
export class SetCombiner extends SetGenerator {
  constructor(
    setGeneratorArr,
    sort, sortAscending, setArr, isReadyArr, // optional.
  ) {
    super();
    this.setGeneratorArr = setGeneratorArr ?? [];
    let setNum = this.setGeneratorArr.length;
    this.setArr = setArr ?? new Array(setNum);
    this.isReadyArr = isReadyArr ?? new Array(setNum).fill(false);
    this.sort = sort ?? 1;
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
        sg.setArr[ind] = (sg.transformSet(set, ind) ?? set);
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
      // sort combSet if this.sort is truthful.
      if (this.sort) {
        if (this.sortAscending) {
          combSet = combSet.sort((row1, row2) => row1[0] - row2[0]);
        } else {
          combSet = combSet.sort((row1, row2) => row2[0] - row1[0]);
        }
      }
      // finally call the callback with the resulting combSet.
      callback(obj, combSet, callbackData);
    }
  }

  transformSet(set, sgIndex) {
    // Can be redefined by descendant classes.
    // (transformSet() might also store additional data for combineSets().)
  }

  combineSets() {
    // To be redefined by descendant classes.
  }

  getSetCategoryKeys() {
    let catIDArrArr = this.setGeneratorArr.map(
      val => val.getSetCategoryKeys()
    );
    let catIDArr = [].concat(...catIDArrArr);
    // filter out repeated categories.
    catIDArr = catIDArr.filter(
      (val, ind, arr) => !arr.slice(0, ind).includes(val)
    );
    return catIDArr;
  }
}


// MaxRatingSetCombiner is an example of a class that implements SetCombiner.
// It takes an array of SetGenerators and constructs a combined set by letting
// each instance in the union of the sets get its maximum rating value from
// across the sets.
export class MaxRatingSetCombiner extends SetCombiner {
  constructor(
    setGeneratorArr,
    sort, sortAscending, setArr, isReadyArr, // optional.
  ) {
    super(
      setGeneratorArr,
      sort, sortAscending, setArr, isReadyArr,
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
    let row, maxRatVal, currRatVal;
    concatSet.forEach(function(val, ind) {
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
// set by letting each instance get the rating of the first set in which they
// appeared in the generated sets of the setGeneratorArr.
export class PrioritySetCombiner extends SetCombiner {
  constructor(
    setGeneratorArr,
    sort, sortAscending, setArr, isReadyArr, // optional.
  ) {
    super(
      setGeneratorArr,
      sort, sortAscending, setArr, isReadyArr,
    );
  }

  transformSet(set, sgIndex) {
    return set.map(function(val) {
      val[2] = sgIndex;
      return val;
    });
  }

  combineSets() {
    // setArr is imploded into concatArr, which is then sorted by instID.
    let concatSet = [].concat(...this.setArr).sort(
      (a, b) => a[1] - b[1]
    );
    // construct a return array by recording only the one rating for each
    // group of elements with the same instID in the concatArr, namely the
    // one with the smallest set generator index (val[2]).
    let ret = new Array(concatSet.length);
    let retLen = 0;
    let currInstID = 0;
    let row, minSGIndex, currSGIndex;
    concatSet.forEach(function(val, ind) {
      // if val is the first in a group with the same instID, record its
      // sgIndex and add a copy of val to the return array.
      if (val[1] !== currInstID) {
        currInstID = val[1];
        minSGIndex = val[2];
        ret[retLen] = (row = [val[0], currInstID, minSGIndex]);
        retLen++;
      // else compare the val[2] to the previous minSGIndex and change the
      // last row of the return array if it is smaller.
      } else {
        currSGIndex = val[2];
        if (currSGIndex > minSGIndex) {
          row[2] = (minSGIndex = currSGIndex);
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
// their ratings in each set (of those in which they appear).
export class WeightedAverageSetCombiner extends SetCombiner {
  constructor(
    setGeneratorArr,
    weightArr,
    sort, sortAscending, setArr, isReadyArr, // optional.
  ) {
    super(
      setGeneratorArr,
      sort, sortAscending, setArr, isReadyArr,
    );
    this.weightArr = weightArr;
  }

  transformSet(set, sgIndex) {
    let weight = this.weightArr[sgIndex];
    return set.map(function(val) {
      val[2] = weight;
      return val;
    });
  }

  combineSets() {
    // setArr is imploded into concatArr, which is then sorted by instID.
    let concatSet = [].concat(...this.setArr).sort(
      (a, b) => a[1] - b[1]
    );
    // construct a return array by ...
    let ret = new Array(concatSet.length);
    let retLen = 0;
    let weightArr = this.weightArr;
    let currInstID = 0;
    let row, accWeight, currWeight, newWeight;
    concatSet.forEach(function(val, ind) {
      // if val is the first in a group with the same instID, write its
      // weight (val[2]) to the accumulated weight (accWeight) and add a
      // copy of val to the return array.
      if (val[1] !== currInstID) {
        currInstID = val[1];
        ret[retLen] = (row = [val[0], val[1]]);
        retLen++;
        accWeight = val[2];
      // else combine the last row with val by computing a combined,
      // ratVal, namely a weighted average, and also add the weight to
      // accWeight.
      } else {
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



export class SimpleSetGenerator extends PrioritySetCombiner {
  constructor(
    catKey,
    num, ratingLo, ratingHi, // optional.
    isAscending, offset, // optional.
    sort, sortAscending, setArr, isReadyArr, // optional.
  ) {
    let setGeneratorArr = accountManager.queryUserPriorityArr
      .filter(x => x)
      .map(id => new SetQuerier(
        catKey,
        id,
        num, ratingLo, ratingHi,
        isAscending, offset,
      ));
    super(
      setGeneratorArr,
      sort, sortAscending, setArr, isReadyArr, // optional.
    );
  }
}
