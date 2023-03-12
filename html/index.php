<?php

// phpinfo();

require_once "../src/db_io/db_io.php";


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

echo json_encode($arr);


?>



<div id="userid"></div>


</body>
</html>




<script src="src/login/free_login.js"></script>
