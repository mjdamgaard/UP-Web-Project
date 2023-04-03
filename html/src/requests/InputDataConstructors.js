
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

}
