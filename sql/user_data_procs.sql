
SELECT "User data procedures";

-- DROP PROCEDURE createOrUpdateSession;
-- DROP PROCEDURE createNewUser;


DELIMITER //
CREATE PROCEDURE createOrUpdateSession (
    IN userID BIGINT UNSIGNED,
    IN sessionID VARBINARY(255),
    IN expTime BIGINT UNSIGNED
)
BEGIN
    INSERT INTO Private_Sessions (user_id, session_id, expiration_time)
    VALUES (userID, sessionID, expTime)
    ON DUPLICATE KEY UPDATE
        session_id = sessionID,
        expiration_time = expTime;
    SELECT 0 AS exitCode;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE createNewUser (
    IN uName VARCHAR(50),
    IN eMailAddress VARCHAR(50),
    IN pwHash VARBINARY(255)
)
BEGIN proc: BEGIN
    DECLARE outID BIGINT UNSIGNED;
    DECLARE exitCode TINYINT;
    DECLARE accountNum TINYINT UNSIGNED;

    SELECT id INTO outID
    FROM Users
    WHERE username = uName
    FOR UPDATE;
    IF (outID IS NOT NULL) THEN
        SET exitCode = 1; -- username already exists.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    SELECT number_of_accounts INTO accountNum
    FROM Private_EMails
    WHERE e_mail_address = eMailAddress
    FOR UPDATE;
    IF (accountNum IS NOT NULL AND accountNum >= 1) THEN -- TODO: Increase this
    -- maximum account number.
        SET exitCode = 2; -- e-mail address cannot get more accounts currently.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    INSERT INTO Entities (type_id, cxt_id, def_str)
    VALUES (5, NULL, uName);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Users (id, username)
    VALUES (outID, uName);

    INSERT INTO Private_EMails
        (e_mail_address, number_of_accounts, account_1_user_id)
    VALUES (eMailAddress, 1, outID)
    ON DUPLICATE KEY UPDATE number_of_accounts = number_of_accounts + 1;
    INSERT INTO Private_UserData (user_id, password_hash)
    VALUES (outID, pwHash);

    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc; END //
DELIMITER ;
