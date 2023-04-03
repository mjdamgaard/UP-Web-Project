<?php


// $db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
// require_once $db_io_path . "DBInterface.php";
// require_once $db_io_path . "InputVerifier.php";
//
// $general_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/general/";
// require_once $general_path . "input_verification.php";
//
$template_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/templates/";
require $template_path . "termHTML.php";


if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}


// // verify and get posted term attributes.
// $paramNameArr = array(
//     "id"
// );
// $typeArr = array(
//     "termID"
// );
// $errPrefix = "Term attribute GET/POST error: ";
// $safeParamValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);





?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<link rel="stylesheet" type="text/css" href="src/css/style.css">
<script src="/lib/jquery-3.6.4.js"></script>

</head>
<body>


<h2> Term </h2>



<?php

echoTermHomeHTML(array("id"), array("c03"));

?>

<div>
    <button>Get JSON data</button>
</div>





</body>
</html>




<!-- <script>

// sends a request and gets JSON. Any HTTP error is logged in console.
function requestAndGetJSON(reqData, success) {
    let jqxhr = $.getJSON("request_handler.php", reqData, success)
        .fail(function() {
            console.log(this.status);
        });
    return jqxhr.responseText;
}

function getDefiningUpwardPath(termType, termID) {
    var data = new P0_0_Query.DefReqData(termType, termID);
    let res = $.getJSON("request_handler.php", data)
        .fail(function() {
            console.log(this.status);
        })
        .responseText;
    switch (termType) {
        case "c":
            //TODO.. maybe..
            break;
        default:
            console.log("getDefiningUpwardPath(): unrecognized termType");
    }
    // ..Okay, jeg kan lige mærke, at jeg lige skal lægge en ordenlig plan for,
    // hvad jeg gerne vil bygge nu her.. (17:29, 17.03.23)
}


</script> -->



<script src="src/requests/QueryDataConstructors.js"></script>
<script>
"use strict";



// var data =
//     new QueryDataConstructors.SetInfoSecKeyReqData("u01", "c14", "r1");
// var data = new QueryDataConstructors.SetInfoReqData("s5");
// var data = new QueryDataConstructors.SetReqData("s5");
// var data = new QueryDataConstructors.RatReqData("c14", "s5");
// var data = new QueryDataConstructors.CatDefReqData("c14");
// var data = new QueryDataConstructors.SuperCatsReqData("c14");
// var data = new QueryDataConstructors.ETermDefReqData("...");
var data = new QueryDataConstructors.RelDefReqData("r2");

console.log(JSON.stringify(data));
$(function(){
    $("button").click(function(){
        $.getJSON("query_handler.php", data, function(result){
            $.each(result, function(key, field){
                $('.term[context="home"]').append(key + ": " + field + ". ");
            });
            console.log(document.currentScript.innerHTML);
        });
    });
});

</script>
