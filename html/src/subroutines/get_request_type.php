<?php


// get request type.
if (!isset($_POST["reqType"])) {
   echo "Error: No request type specified";
   exit;
}
$reqType = $_POST["reqType"];


?>
