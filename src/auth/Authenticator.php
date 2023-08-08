<?php

$err_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/err/";
require_once $err_path . "errors.php";

$db_io_path = $_SERVER['DOCUMENT_ROOT'] . "/../src/db_io/";
require_once $db_io_path . "DBConnector.php";



class Authenticator {

    // createNewAccount() tries to create a new account, and if successful,
    // creates a new session as well and returns the outID (user ID), sesIDHex
    // (hexed session ID) and expTime (expiration time) in an associative array.
    // If not successful, the exitCode is returned in the associative array.
    public static function createNewAccount($conn, $username, $email, $pwHash) {
        // prepare input MySQLi statement to create the new user.
        $sql = "CALL createNewUser (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        // execute statement.
        DBConnector::executeSuccessfulOrDie(
            $stmt, array($username, $email, $pwHash)
        );
        // fetch the result as an associative array.
        $res = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        // return $res whith just the exitCode if the user could not be created.
        if ($res["exitCode"]) {
            return $res;
        }
        // get the new user ID.
        $userID = $res["outID"];
        // create a new session ID and append $sesIDHex and $expTime to $res.
        $res += self::getNewSessionIDAndExpTime($conn, $userID);
        // finally return $res.
        return $res;
    }

    private static function getNewSessionIDAndExpTime($conn, $userID) {
        // prepare input MySQLi statement to create or update the session.
        $sql = "CALL createOrUpdateSession (?, ?, ?)";
        $stmt = $conn->prepare($sql);

        // generate the session ID.
        $sesID = random_bytes(60);
        // generate the expiration date.
        $expTime = strtotime("+2 months");

        // execute statement.
        DBConnector::executeSuccessfulOrDie(
            $stmt, array($userID, $sesID, $expTime)
        );
        $stmt->close();

        // return the expiration time and a hex string of the session ID.
        return array("sesIDHex"=>bin2hex($sesID), "expTime"=>$expTime);
    }

    // login() tries to login, and return sesIDHex (hexed session ID) and
    // expTime (expiration time) in an associative array.
    public static function login($conn, $userID, $password) {
        // verify the password (exits if incorrect).
        self::verifyPassword($conn, $userID, $password);
        // return expTime (expiration time) and sesIDHex (hex string of the
        // session ID).
        return self::getNewSessionIDAndExpTime($conn, $userID);
    }

    // verifyPassword() tries to verify password and exits if unsuccessful.
    public static function verifyPassword($conn, $userID, $password) {
        // prepare input MySQLi statement to get the correct password hash.
        $sql = "SELECT password_hash FROM Private_UserData WHERE user_id <=> ?";
        $stmt = $conn->prepare($sql);
        // execute the statement with $userID as the input parameter.
        DBConnector::executeSuccessfulOrDie($stmt, array($userID));
        // fetch the result as an associative array.
        $res = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        // verify the password.
        if (!password_verify($password, $res["password_hash"])) {
            echoErrorJSONAndExit("Password was incorrect");
        }
    }

    // verifySessionID() tries to verify session id and exits if unsuccessful.
    public static function verifySessionID($conn, $userID, $sesID) {
        // prepare input MySQLi statement to get the correct password hash.
        $sql = "SELECT session_id, expiration_time FROM Private_Sessions " .
            "WHERE user_id <=> ?";
        $stmt = $conn->prepare($sql);
        // execute the statement with $userID as the input parameter.
        DBConnector::executeSuccessfulOrDie($stmt, array($userID));
        // fetch the result as an associative array.
        $res = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        // check the expiration date and verify the session ID.
        if ($res["expiration_time"] < strtotime("now")) {
            echoErrorJSONAndExit("Session has expired");
        }
        if ($sesID != $res["session_id"]) {
            echoErrorJSONAndExit("Session ID was incorrect");
        }
    }

    // logout() tries to verify the session, then detroys it on success.
    public static function logout($conn, $userID, $sesID) {
        // first verify the session.
        self::verifySessionID($conn, $userID, $sesID);
        // prepare input MySQLi statement to destroy the session.
        $sql = "DELETE FROM Private_Sessions WHERE user_id <=> ?";
        $stmt = $conn->prepare($sql);
        // execute that statement.
        DBConnector::executeSuccessfulOrDie($stmt, array($userID));
    }

}
?>
