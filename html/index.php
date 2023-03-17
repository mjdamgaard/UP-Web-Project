<?php

$general_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/general/";
require_once $general_path . "input_verification.php";

$template_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/templates/";
require $template_path . "term.php";


if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}

// TODO: remove this if statement.
if (empty($_POST)) {
    $_POST["type"]="c";
    $_POST["tid"]="03";
}

// verify and get posted term attributes.
$paramNameArr = array(
    "type", "tid"
);
$typeArr = array(
    "t", "id"
);
$errPrefix = "Term attribute GET/POST error: ";
$safeParamValArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);





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

echoTermHomeHTML($paramNameArr, $safeParamValArr);

?>

<div>
    <button>Get JSON data</button>
</div>





</body>
</html>



<script src="src/requests/p0_0/P0_0_Query.js"></script>



<script>

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


</script>



<script>

// var data = new P0_0_Query.SetReqData("u", "01", "c", "14", "01");
// var data = new P0_0_Query.DefReqData("c", "3");
// var data = new P0_0_Query.SupReqData("3");
var data = new P0_0_Query.SupReqData("015");

$(function(){
    $("button").click(function(){
        $.getJSON("request_handler.php", data, function(result){
            $.each(result, function(key, field){
                $('.term[context="home"]').append(key + ": " + field + ". ");
            });
        });
    });
});
</script>










<script>

function getDefTest() {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        document.getElementById("test1").innerHTML = this.responseText;
    }
    xhttp.open("POST", "request_handler.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(
        [
            "p=0.0",
            "reqType=def",
            "termType=c",
            "id=0A"
        ].join("&")
    );
}

function getSetTest() {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        document.getElementById("test2").innerHTML = this.responseText;
    }
    xhttp.open("POST", "request_handler.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(
        [
            "p=0.0",
            "reqType=set",
            "userType=u", "userID=01", "subjType=c", "subjID=08", "relID=01",
            "ratingRangeMin=80", "ratingRangeMax=",
            "num=100", "numOffset=0",
            "isAscOrder=0"
        ].join("&")
    );
}

function getSupTest() {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        document.getElementById("test3").innerHTML = this.responseText;
    }
    xhttp.open("POST", "request_handler.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(
        [
            "p=0.0",
            "reqType=sup",
            "catID=0F"
        ].join("&")
    );
}

</script>
