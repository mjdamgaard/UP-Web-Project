<?php

header("Cache-Control: max-age=3");

$inserts_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/php/inserts/";

?>

<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="utf-8">

</head>
<body>

<h1>Initial inserts</h1>

<?php

require_once $inserts_path . "initial_inserts.php";

?>

</body>
</html>
