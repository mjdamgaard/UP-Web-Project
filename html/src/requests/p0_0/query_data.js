
var P0_0_Query = {

    SetReqData: function(
        userType, userID, subjType, subjID, relID,
        ratingRangeMin = "", ratingRangeMax = "",
        num = "10000", numOffset = "0",
        isAscOrder = "0"
    ) {
      this.p = "0.0";
      this.reqType = "q";
      this.qType = "set";
      this.userType = userType;
      this.userID = userID;
      this.subjType = subjType;
      this.subjID = subjID;
      this.relID = relID;
      this.ratingRangeMin = ratingRangeMin;
      this.ratingRangeMax = ratingRangeMax;
      this.num = num;
      this.numOffset = numOffset;
      this.isAscOrder = isAscOrder;

    }






}
