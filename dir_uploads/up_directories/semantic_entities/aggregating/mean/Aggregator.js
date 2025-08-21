



export class Aggregator {

  constructor(userGroupID) {
    this.userGroupID = userGroupID;
  }

  getScore(qualIDOrPath, subjIDOrPath) {}

  getList(qualIDOrPath, isAscending, maxNum, offset, hi, lo) {}

  updateScore(qualIDOrPath, subjIDOrPath) {}

  updateList = undefined;
}
