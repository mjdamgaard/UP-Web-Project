
const InputDataConstructors = {

    RateReqData: function(
        userID, subjID, relID,
        objID,
        rating
    ) {
        this.type = "R";
        this.uid = userID;
        this.sid = subjID;
        this.rid = relID;
        this.oid = objID;
        this.r = rating;
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

    RelReqData: function(
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
        str
    ) {
        this.type = "T";
        this.uid = userID;
        this.t = textStr;
    },

    BinReqData: function(
        userID,
        bin
    ) {
        this.type = "B";
        this.uid = userID;
        this.b = bin;
    },

    // /* Multiple insertions */
    // MultiETermsReqData: function(
    //     userID, catID,
    //     titleArr, number
    // ) {
    //     this.type = "E";
    //     this.uid = userID;
    //     this.scid = catID;
    //     this.ts = titleArr;
    //     this.n = number;
    // },

}
