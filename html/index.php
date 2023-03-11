<?php

// phpinfo();

require_once 'src/db_io_lib.php';


?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<link rel="stylesheet" type="text/css" href="style.css">
</head>
<body>

<?php

$filepath = "src/insertion_forms/temp/description_of_hasLexItem.txt";
echo nl2br(htmlspecialchars(file_get_contents($filepath)));


?>



<div id="userid"></div>


</body>
</html>




<script src="src/login/free_login.js"></script>
