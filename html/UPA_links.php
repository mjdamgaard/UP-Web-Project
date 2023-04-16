<?php

/* At this point (and perhaps it will remain that way), this server program
 * is suppoesed to be called upaf_cacheURLRegEx() specifically, located in
 * t4.js in the moment of writing. The responsibility of this program is then
 * to first of all look up a setID and potentially a patID for the given user,
 * meaning that if the user has rated a setID and/or a patID above a certain
 * threshold for certain relations, then the highest rated ones will be chosen,
 * and otherwise some standard ones will be chosen. The chosen setID represents
 * a set of whitelisted URL RegEx patterns, and pattID represents (if it is
 * p0) a blacklist pattern, which can add some final user preferences on top
 * of the chosen set. ..Come to think of it, let us say that two patIDs are
 * looked up: a blacklist pattern and also a whitelist pattern, which.. Hm..
 **/

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVerifier.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";

?>
