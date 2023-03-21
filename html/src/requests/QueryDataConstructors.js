
const QueryDataConstructors = {

    SetReqData: function(
        setID,
        ratMin = "", ratMax = "",
        num = "10000", offset = "0",
        isAsc = "0"
    ) {
        this.reqType = "set";
        this.setID = setID;
        this.ratMin = ratMin;
        this.ratMax = ratMax;
        this.num = num;
        this.offset = offset;
        this.isAsc = isAsc;
    },

    SetInfoReqData: function(
        setID
    ) {
        this.reqType = "setInfo";
        this.setID = setID;

    },

    SetInfoFromSecKeyReqData: function(
        userID, subjID, relID
    ) {
        this.reqType = "setInfoSK";
        this.userID = userID;
        this.subjID = subjID;
        this.relID = relID;

    },

    DefReqData: function(termID) {
        this.reqType = "def";
        this.termID = termID;
    },


    SuperCatsReqData: function(catID) {
      this.reqType = "sup";
      this.catID = catID;
    }

}
