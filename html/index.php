<?php

// TODO: Implement an index page where the user can login and so on.


$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputGetter.php";
require_once $user_input_path . "InputVerifier.php";



if ($_SERVER["REQUEST_METHOD"] != "POST") {
    $_POST = $_GET;
}


if (!isset($_POST["t"])) {
    $_POST["t"] = "1";
}
if (!isset($_POST["qu"])) {
    $_POST["qu"] = "3";
}
if (!isset($_POST["iu"])) {
    $_POST["iu"] = "3";
}

// get and verify the required inputs.
$paramNameArr = array("t", "qu", "iu");
$typeArr = array("id", "id", "id");
$paramValArr = InputGetter::getParams($paramNameArr);
InputVerifier::verifyTypes($paramValArr, $typeArr, $paramNameArr);
$termID = $paramValArr[0];
$queryUserID = $paramValArr[1];
$inputUserID = $paramValArr[2];


?>
<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
<!-- <script src="/lib/jquery-3.6.4.js"></script> -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">
<!-- <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous"> -->



<link rel="stylesheet" type="text/css" href="src/style/style.css">

</head>
<body>

<!-- TODO: Add functionalities to this bar; login etc.. -->
<header>
    <h1> openSDB </h1>
</header>

<main id="upa">
</main>
<script type="module">
    import "/src/DBRequestManager.js";
    import "/src/ContentLoader.js";
    import {sdbInterfaceCL} from "/src/content_loaders/SDBInterfaces.js";
    import "/src/content_loaders/PagesWithTabs.js";
    import "/src/content_loaders/SetLists.js";
    import "/src/content_loaders/SetDisplays.js";
    import "/src/content_loaders/TermElements.js";
    import "/src/content_loaders/TermPages.js";
    import "/src/content_loaders/Titles.js";
    import "/src/content_loaders/Ratings.js";
    import "/src/content_loaders/SubmitTermFields.js";

    import "/src/style_modules/style01.js";

    let data = {
        termID: <?php echo $termID; ?>,
        queryUserID: <?php echo $queryUserID; ?>,
        inputUserID: <?php echo $inputUserID; ?>,
        cl: sdbInterfaceCL.getRelatedCL("TermPage"),
    };
    sdbInterfaceCL.loadAppended($('#upa'), "self", data);
</script>

</body>
</html>
