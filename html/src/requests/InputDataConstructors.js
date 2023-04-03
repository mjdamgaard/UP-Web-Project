
const InputDataConstructors = {

    RateReqData: function(
        userID, subjID, relID,
        objID,
        rat
    ) {
        this.type = "R";
        this.uid = userID;
        this.sid = subjID;
        this.rid = relID;
        this.oid = objID;
        this.r = rat;
    },

    CatReqData: function(
        userID, superCatID,
        title
    ) {
        this.type = "C";
        this.uid = userID;
        this.scid = superCatID;
        this.t = title;
    },

    ETermReqData: function(
        userID, catID,
        title
    ) {
        this.type = "E";
        this.uid = userID;
        this.scid = catID;
        this.t = title;
    },

    CatReqData: function(
        userID, subjCatID,
        objNoun
    ) {
        this.type = "R";
        this.uid = userID;
        this.scid = subjCatID;
        this.n = objNoun;
    },

    TextReqData: function(
        userID,
        textStr
    ) {
        this.type = "T";
        this.uid = userID;
        this.t = textStr;
    },

}
