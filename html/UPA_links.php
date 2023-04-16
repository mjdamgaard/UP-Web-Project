<?php

/* At this point (and perhaps it will remain that way), this server program
 * is suppoesed to be called upaf_cacheURLRegEx() specifically, located in
 * t4.js in the moment of writing. The responsibility of this program is then
 * to first of all look up a setID, representing a set of whitelisted URL
 * patterns (or rather part of the set does when the rating is above a
 * certain threshold). If the user has rated a setID above a certain
 * threshold a certain relations, then the highest rated set will be chosen,
 * and otherwise some standard set will be chosen. The UPA are then not allowed
 * (and it should not be possible if the API is correctly made) to use links
 * with URLs that have not first been confirmed to be in this set (and with a
 * high enough rating).
 * The relation with which to rate whitelist sets should of course be a
 * protected relation, meaning that the UPA cannot upload a new rating by
 * itself, but must instead send the rating data to a certain rating buffer
 * where the user can then manually confirm the new rating (and should be
 * given a warning about doing so).
 * Any further blacklisting and whitelisting preferences that are specific to
 * the end user must be implemented in the UPA layer. The set that this program
 * looks up is therefore mainly intended an initial filter to prevent links to
 * malicious and/or scamming sites.
 **/

// TODO: At first I will just make a dummy implementation of this program such
// that all requested patterns are queried and returned to the client without
// any actual verification (so no lookup of that whitelist set). TODO: Change
// this to an actual implementation. 

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$user_input_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/user_input/";
require_once $user_input_path . "InputVerifier.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";

?>
