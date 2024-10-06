<?php

header("Cache-Control: max-age=3");

$inserts_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/inserts/";
require $inserts_path . "initial_inserts.php";

?>

<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="utf-8">

</head>
<body>

<h1>Initial inserts</h1>

</body>
</html>
