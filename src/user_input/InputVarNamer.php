<?php



class InputVarNamer {
    /* Request type variable name */
    private static $reqTypeVarName = "reqType";

    public static function getReqTypeVarName() {
        return $reqTypeVarName;
    }

    /* Query data variable names */
    private static $queryVarNames = array(
        set => array(
            "id",
            "ratMin", "ratMax",
            "num", "offset",
            "isAsc"
        ),
        setInfo => array("id"),
        setInfoSK => array("userID", "subjID", "relID"),
        rating => array("objID", "setID"),
        catDef => array("id"),
        eTermDef => array("id"),
        relDef => array("id"),
        superCatDefs => array("id")
    );

    public static function getQueryVarNames($sqlKey) {
        return $queryVarNames[$sqlKey];
    }
}

?>
