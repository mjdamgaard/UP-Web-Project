
var P0_0_Query = {

    SetReqData: function(
        userID, subjID, relID,
        ratMin = "", ratMax = "",
        num = "10000", offset = "0",
        isAsc = "0"
    ) {
      this.p = "0.0";
      this.reqType = "set";
      this.userID = userID;
      this.subjID = subjID;
      this.relID = relID;
      this.ratMin = ratMin;
      this.ratMax = ratMax;
      this.num = num;
      this.offset = offset;
      this.isAsc = isAsc;

  },

    DefReqData: function(termID) {
      this.p = "0.0";
      this.reqType = "def";
      this.termID = termID;

  },


    SupReqData: function(catID) {
      this.p = "0.0";
      this.reqType = "sup";
      this.catID = catID;

    }

}
