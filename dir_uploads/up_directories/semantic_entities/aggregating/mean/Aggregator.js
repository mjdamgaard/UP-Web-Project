



export class Aggregator {

  constructor(userGroupID) {
    this.userGroupID = userGroupID;
  }

  getScore(qualIdent, subjIdent) {}

  getList(qualIdent, isAscending, maxNum, offset, hi, lo) {}

  updateScore(qualIdent, subjIdent) {}

  updateList = undefined;
}
