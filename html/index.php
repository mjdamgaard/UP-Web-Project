<?php

// TODO: Implement an index page where the user can login and so on..



?>
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="utf-8">
<!-- <meta name="viewport" content="width=device-width, initial-scale=1"> -->
<!-- <script src="/lib/jquery-3.6.4.js"></script> -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">



<link rel="stylesheet" type="text/css" href="src/css/style.css">

<script src="/src/requests/QueryDataConstructors.js"></script>
<script src="/src/requests/InputDataConstructors.js"></script>


</head>
<body>

<!-- TODO: Add functionalities to this bar; login etc.. -->
<header>
    <h2> openSDB </h2>
</header>

<main>
    <div id="protectedRatingBuffer"></div>
    <?php
    if (!isset($_GET["tid"])) {
        $_GET["tid"] = "c3";
    }
    if (!isset($_GET["uid"])) {
        $_GET["uid"] = "u1";
    }
    if (!isset($_GET["pid"])) {
        $_GET["pid"] = "u1";
    }
    require $_SERVER['DOCUMENT_ROOT'] . "/../src/UPA.php";
    ?>
</main>

<!-- Tests -->
<script>

// console.log(~~"12367");

</script>

</body>
</html>
