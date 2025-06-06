
USE userDB;

DROP PROCEDURE createUserAccount;
DROP PROCEDURE selectPWHashAndUserID;
DROP PROCEDURE generateAuthToken;
DROP PROCEDURE getAuthenticatedUserID;

DROP PROCEDURE selectGas;
DROP PROCEDURE updateGas;

DROP PROCEDURE selectUserIDAndGas;




DELIMITER //
CREATE PROCEDURE createUserAccount (
    IN userName VARCHAR(50),
    IN pwHashSalted CHAR(60),
    IN emailAddr VARCHAR(255)
)
proc: BEGIN
    DECLARE userID BIGINT UNSIGNED;
    DECLARE profileNum INT UNSIGNED;
    IF (userName IS NULL OR pwHashSalted IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    IF (emailAddr IS NOT NULL AND emailAddr != "") THEN
        SELECT COUNT(user_id) INTO profileNum
        FROM EmailAddresses FORCE INDEX (email_addr)
        WHERE email_addr = emailAddr;
        IF (profileNum > 10) THEN
            SELECT NULL;
            LEAVE proc;
        END IF;
    END IF;

    INSERT INTO UserCredentials (user_name, password_hash_salted)
    VALUES (userName, pwHashSalted);
    SET userID = LAST_INSERT_ID();

    IF (emailAddr IS NOT NULL AND emailAddr != "") THEN
        INSERT INTO EmailAddresses (user_id, email_addr)
        VALUES (userID, emailAddr);
    END IF;

    SELECT userID;
END proc //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE selectPWHashAndUserID (
    IN userName VARCHAR(50)
)
BEGIN
    SELECT password_hash_salted AS pwHashSalted, user_id AS userID
    FROM UserCredentials FORCE INDEX (sec_idx)
    WHERE user_name = userName;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE generateAuthToken (
    IN userID BIGINT UNSIGNED
)
BEGIN
    DECLARE authToken VARCHAR(255) DEFAULT TO_BASE64(RANDOM_BYTES(40));
    DECLARE expTime BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP() + 604800000;

    INSERT INTO AuthenticationTokens (user_id, auth_token, expiration_time)
    VALUES (userID, authToken, expTime)
    ON DUPLICATE KEY UPDATE
        auth_token = authToken,
        expiration_time = expTime;
    
    SELECT authToken;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE getAuthenticatedUserID (
    IN authToken VARCHAR(255),
    OUT userID BIGINT UNSIGNED
)
BEGIN
    DECLARE newExpTime BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP() + 604800000;

    SELECT user_id INTO userID
    FROM AuthenticationTokens FORCE INDEX (sec_idx)
    WHERE auth_token = authToken;

    IF (userID IS NOT NULL) THEN
        UPDATE AuthenticationTokens
        SET expiration_time = newExpTime
        WHERE user_id = userID;
    END IF;
END //
DELIMITER ;



-- TODO: Implement procedures to get user IDs from an e-mail address, and vice
-- versa.




DELIMITER //
CREATE PROCEDURE selectGas (
    IN userID BIGINT UNSIGNED
)
BEGIN
    SELECT gas_json AS gasJSON, last_auto_refill_at AS lastAutoRefill
    FROM UserGas FORCE INDEX (PRIMARY)
    WHERE user_id = userID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE updateGas (
    IN userID BIGINT UNSIGNED,
    IN gasJSON VARCHAR(700),
    IN isAutoRefill BOOL
)
BEGIN
    IF (isAutoRefill) THEN
        UPDATE UserGas
        SET gas_json = gasJSON, last_auto_refill_at = UNIX_TIMESTAMP()
        WHERE user_id = userID;
    ELSE
        UPDATE UserGas
        SET gas_json = gasJSON
        WHERE user_id = userID;
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectUserIDAndGas (
    IN authToken BIGINT UNSIGNED
)
BEGIN
    DECLARE userID BIGINT UNSIGNED;

    CALL getAuthenticatedUserID (authToken, userID);

    SELECT userID, gas_json AS gasJSON, last_auto_refill_at AS lastAutoRefill
    FROM UserGas FORCE INDEX (PRIMARY)
    WHERE user_id = userID;
END //
DELIMITER ;