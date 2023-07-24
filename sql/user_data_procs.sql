
SELECT "User data procedures";

-- DROP PROCEDURE createOrUpdateSession;
-- DROP PROCEDURE createNewUser;


DELIMITER //
CREATE PROCEDURE createOrUpdateSession (
    IN userID BIGINT UNSIGNED,
    IN sessionID VARBINARY(2000),
    IN expirationDate DATE
)
BEGIN
    INSERT INTO Private_Sessions (user_id, session_id, expiration_date)
    VALUES (userID, sessionID, expirationDate)
    ON DUPLICATE KEY UPDATE
        session_id = sessionID,
        expiration_date = expirationDate;
    SELECT 0 AS exitCode;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE createNewUser (
    IN uName VARCHAR(50),
    IN eMailAddress VARCHAR(50),
    IN pwHash VARBINARY(2000)
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
    IF (accountNum IS NULL OR accountNum >= 3) THEN
        SET exitCode = 2; -- e-mail address cannot get more accounts currently.
        SELECT outID, exitCode;
        LEAVE proc;
    END IF;

    INSERT INTO Private_EMails (e_mail_address, number_of_accounts)
    VALUES (eMailAddress, 1)
    ON DUPLICATE KEY UPDATE number_of_accounts = number_of_accounts + 1;

    INSERT INTO Entities (type_id, cxt_id, def_str)
    VALUES (5, NULL, uName);
    SELECT LAST_INSERT_ID() INTO outID;
    INSERT INTO Users (id, username)
    VALUES (outID, uName);
    INSERT INTO Private_PasswordHashes (user_id, pw_hash)
    VALUES (outID, pwHash);

    SET exitCode = 0; -- insert.
    SELECT outID, exitCode;
END proc; END //
DELIMITER ;
