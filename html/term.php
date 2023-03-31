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



<script src="src/requests/QueryDataConstructors.js"></script>



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



<script>
"use strict"; // (I wrote in a commit that a certian exception was only thrown
// because of this, but that does not make since, since that was in the php
// code.)
if(true){console.log("nospaces")};
// var x = 10;
// var x = x + 1;
// console.log(x.toString());

if (true) {
    var x = x + 1;
}
console.log(x.toString());

for (var i = 0; i < 2; i++)
for (var j = 0; j < 3; j++)
{
    console.log(j.toString());
}

var x = 2 *-  2;
x   ++;
console.log(x.toString());


// console.log("hello newline
// world"); // not allowed

var str = "\( hello )";
console.log(str);

console.log("hello ${not_a_template}");

// if (3 == 3) && true == false || true console.log("weird if");
// // Throws exception.
// if 3 == 3 && true == false || true console.log("weird if2");
// // Throws exception.
if (3 == 3 && true == false || true) console.log("weird if3");
// prints "weird if3" successfully. (Not that I think I will allow these kinds
// of statements; I will let if-else and function and loop statements all
// accept only block statements as their definition statements.)

// var x = 1000  .999;
// console.log("is this a float? " + x.toString());
// no..
var x = 1000.999;
console.log("this is a float: " + x.toString());


// var x = 0;
// for (
//     if (true) {console.log("loop start")} x<4;
//     console.log("loop iteration end")
// ) {
//     console.log("loop iteration beginning");
//     x = x + 1;
// }
// console.log("loop end");
// // Interesting!: It expects an expression at first..! Hm..

// if (var x = 1) {
//     console.log("if (var x = 1)");
// }
// if (var x = 0) {
//     console.log("if (var x = 0)");
// }
// // Also fails saying it expects expression..
// if (let x = 1) {
//     console.log("if (var x = 1)");
// }
// if (let x = 0) {
//     console.log("if (var x = 0)");
// }
// // Same..
// Hm, let me try this:
console.log(x = x + 1); // This succeeds.
// console.log(var x = x + 1); // This fails!
// Hm, developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
// -Statements/for and -Operators/Assignment lying about the syntax..

// var x = 10;
// for (
//     x=0; x.toString();
//     console.log("loop iteration end")
// ) {
//     console.log("loop iteration beginning");
//     x = x + 1;
//     if (x == 4) {
//         x = "";
//     }
// }
// console.log("loop end");
// // Works..

// var x = 10;
// for (
//     x=0; x<3;
//     console.log("loop iteration end");
// ) {
//     x++;
// }
// // Fails, so last part has to be an expression..

var x = 3;
while (x--);

var x = 0;
// for (const c = 0; c<3; c++); // Fails.
for (const c = 0; x<3; x++); // Succeeds.
// for (const c = 0; var x = x - 1; ); // Fails on "var x = x - 1"; expects
// expression.

// break; // Fails.

var x = 0;
function test() {
    return x = 0; //Succeeds.
}
test();

switch("c") {
    case "c" : function test() {console.log("test() from switch")}
        test(); // Works; prints "test() from switch".
}

// var x = 10;
// x + 3 = 10; // Fails!

// var x = 0;
// for (const c; x<3; x++); // Fails!

// var x = y = newVar1 = newVar2 = 0; // Fails!! ..Wait, now it succeeds..?..
// // .. probalby because of hoisting..
// // var x, y, newVar1, newVar2 = 0; // Suceeds!
// Yes, fist line fails without the second line.(!)

// // Perhaps an important test:
// function changeObjectRef(obj) {
//     obj = {name:"new object"};
// }
//
// var myObj = {name:"initial object", someOtherProp:10};
// changeObjectRef(myObj);
// console.log(myObj.name + myObj.someOtherProp.toString());
// // Øv.. Doesn't work..

function changeObjectRef(obj) {
    obj = {name:"new object"};
    console.log(obj.name);
}

var myObj = {name:"initial object", someOtherProp:10};
changeObjectRef(myObj);
console.log(myObj.name + myObj.someOtherProp.toString());
// Øv.. Doesn't work..


var x = 1 ? 1 - 1 ? -42 : 1 ? 42 : -42 : -42;
console.log(x.toString()); // Does as expected, it seems.


console.log(~~"I should not be printed");




// function test(arr) {
//     arr = ["came from function"];
// }
// var arr = ["came outside of function"];
// test(arr);
// console.log(arr.toString()); // prints the outside version.


// function test(arr) {
//     arr[0] = "came from function";
// } // Fails with "Uncaught TypeError: arr is undefined"..! What??
// // var arr = ["came outside of function"];
// // test(arr);
// // console.log(arr.toString());
// // ??..

// function test2(arr) {
//     arr[0] = "came from function";
// } // Hm, maybe I just get a weird behavior when redifining test().. But that
// // would be terrible..

function test2(arr) {
    arr[0] = "came from function";
}
var arr = ["came from outside of function"];
test2(arr);
console.log(arr.toString()); // Prints "came from function". Good, but what
// about that earlier bug..??..

// function test() {
//     console.log("You should not see me!");
// }
//
// function test() {
//     1 + 1 == 2;
// } // does nothing as expected..

// function test(arr) {
//     arr[0] = "came from function";
// }
// var arr = ["came from outside of function"];
// test(arr);
// console.log(arr.toString());

// Ah! No worries! It's just because of hoisting, and the fact that I'm also
// calling test() somewhere above. Okay, all is as expected then.


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

/* multi-line comment with no end delimeter.
... Oh, this is apparently not allowed. */

// single line comment with no end newline. (Succeeds) </script>










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
