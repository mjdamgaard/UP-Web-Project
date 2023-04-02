
const QueryDataConstructors = {

    SetReqData: function(
        setID,
        ratMin = "", ratMax = "",
        num = "10000", offset = "0",
        isAsc = "0"
    ) {
        this.type = "S";
        this.id = setID;
        this.rl = ratMin;
        this.rh = ratMax;
        this.n = num;
        this.o = offset;
        this.a = isAsc;
    },

    SetInfoReqData: function(setID) {
        this.type = "SInfo";
        this.id = setID;

    },

    SetInfoSecKeyReqData: function(userID, subjID, relID) {
        this.type = "SInfoSK";
        this.uid = userID;
        this.sid = subjID;
        this.rid = relID;

    },

    RatReqData: function(objID, setID) {
        this.type = "R";
        this.oid = objID
        this.sid = setID
    },


    CatDefReqData: function(catID) {
        this.type = "CDef";
        this.id = catID;
    },
    ETermDefReqData: function(eTermID) {
        this.type = "ETDef";
        this.id = eTermID;
    },
    RelDefReqData: function(relID) {
        this.type = "RDef";
        this.id = relID;
    },


    SuperCatsReqData: function(catID) {
      this.type = "SCDefs";
      this.id = catID;
  },

    TextReqData: function(textID) {
      this.type = "T";
      this.id = textID;
    }

}
