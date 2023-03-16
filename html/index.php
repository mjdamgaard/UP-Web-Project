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





<!-- <div id="test1">
    <h2>Let AJAX change this text</h2>
    <button type="button" onclick="getDefTest()">Change Content</button>
</div>


<div id="test2">
    <h2>test2</h2>
    <button type="button" onclick="getSetTest()">Change Content</button>
</div>

<div id="test3">
    <h2>test2</h2>
    <button type="button" onclick="getSupTest()">Change Content</button>
</div> -->


</body>
</html>





<script>


$(function(){
  $('.term[context="home"]').html("Hello world of jQuery!");
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
