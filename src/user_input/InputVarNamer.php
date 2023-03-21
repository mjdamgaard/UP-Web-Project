<?php



class InputVarNamer {
    /* Request type variable name */
    private static $reqTypeVarName = "type";

    public static function getReqTypeVarName() {
        return self::$reqTypeVarName;
    }

    /* Query data variable names */
    private static $queryVarNames = array(
        "set" => array(
            "id",
            "rl", "rh",
            "n", "o",
            "a"
        ),
        "setInfo" => array("id"),
        "setInfoSK" => array("uid", "sid", "rid"),
        "rating" => array("oid", "sid"),
        "catDef" => array("id"),
        "eTermDef" => array("id"),
        "relDef" => array("id"),
        "superCatDefs" => array("id")
    );

    public static function getQueryVarNames($sqlKey) {
        return self::$queryVarNames[$sqlKey];
    }
}

?>
