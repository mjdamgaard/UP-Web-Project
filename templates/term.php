<?php

$general_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/general/";
require_once $general_path . "input_verification.php";



// phpinfo();

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
$paramArr = verifyAndGetParams($paramNameArr, $typeArr, $errPrefix);



?>


<p> Do I still have the $paramArr? </p>

<?php

echo print_r($paramArr);

?>

<p> Yes! </p>
