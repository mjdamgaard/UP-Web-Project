<?php namespace p_0_00;

$database_path = $_SERVER['DOCUMENT_ROOT'] . "/src/database/";
require_once $database_path . "query_lib.php";



function getRawQueryResult() {
    // NOTE: this protocol requires no user authenication.

    // get request type.
    if (!isset($_POST["reqType"])) {
       return "Error: No request type specified";
    }
    $reqType = $_POST["reqType"];

    // branch to corresponding request handler.
    switch ($reqType) {
        case "set":
            // TODO: Discontinue this protocol.
            return "";
            break;
        case "catTitle":
            // TODO..
            return "";
            break;
        default:
            return "Error: Unrecognized request type";
    }




}



?>
