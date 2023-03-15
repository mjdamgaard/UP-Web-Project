<?php

// phpinfo();


?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<link rel="stylesheet" type="text/css" href="style.css">
</head>
<body>

<?php

$arr = array("str1"=>"hello", "num"=>30, "str2"=>"world");

echo json_encode($arr) . "<br>";


?>

<div id="test1">
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
</div>


</body>
</html>




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
