
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="utf-8">

</head>
<body>

<h1>Initial inserts</h1>

<?php


// This exit statement can by commented out temporarily in order to run
// initial_inserts.php:
// exit;


$inserts_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/inserts/";

require_once $inserts_path . "initial_inserts.php";

?>

</body>
</html>
