
-- USE userDB;

DROP FUNCTION toBase64;

DROP PROCEDURE createUserAccount;
DROP PROCEDURE selectPWHashAndUserID;
DROP PROCEDURE generateAuthToken;
DROP PROCEDURE deleteAuthToken;
DROP PROCEDURE deleteAllAuthTokensIfAuthenticated;
DROP PROCEDURE replaceAuthToken;
DROP PROCEDURE selectAuthenticatedUserID;

DROP PROCEDURE selectAuthenticatedUserIDAndGas;

DROP PROCEDURE selectGas;
DROP PROCEDURE updateGas;




CREATE FUNCTION toBase64 (rawStr VARBINARY(255))
RETURNS VARCHAR(340) DETERMINISTIC
RETURN REPLACE(REPLACE(TO_BASE64(rawStr), "+", "-"), "/", "_");



DELIMITER //
CREATE PROCEDURE createUserAccount (
    IN userName VARCHAR(50),
    IN pwHashSalted CHAR(60),
    IN emailAddr VARCHAR(255),
    IN initGasJSON JSON
)
proc: BEGIN
    DECLARE userID BIGINT UNSIGNED;
    DECLARE profileNum INT UNSIGNED;

    -- IF (emailAddr IS NOT NULL AND emailAddr != "") THEN
    --     SELECT COUNT(user_name) INTO profileNum
    --     FROM EmailAddresses FORCE INDEX (sec_idx)
    --     WHERE email_addr = emailAddr AND is_confirmed;
    --     IF (profileNum > maxAccountNum) THEN
    --         SELECT NULL;
    --         LEAVE proc;
    --     END IF;
    -- END IF;

    INSERT IGNORE INTO UserCredentials (user_name, password_hash_salted)
    VALUES (userName, pwHashSalted);
    SET userID = LAST_INSERT_ID();

    IF (NOT userID OR userID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    IF (emailAddr IS NOT NULL AND emailAddr != "") THEN
        INSERT INTO EmailAddresses (user_name, email_addr)
        VALUES (userName, emailAddr);
    END IF;

    INSERT INTO UserGas (user_id, gas_json)
    VALUES (userID, initGasJSON);

    SELECT CONV(userID, 10, 16) AS userID;
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
    IN userIDHex VARCHAR(16),
    IN expPeriod BIGINT UNSIGNED,
    IN timeGrain TINYINT UNSIGNED
)
BEGIN
    DECLARE userID BIGINT UNSIGNED DEFAULT CONV((userIDHex), 16, 10);
    DECLARE authToken VARCHAR(255) DEFAULT toBase64(RANDOM_BYTES(40));
    DECLARE expTime BIGINT UNSIGNED DEFAULT (
        (UNIX_TIMESTAMP() >> timeGrain << timeGrain) + expPeriod
    );

    INSERT INTO AuthenticationTokens (user_id, auth_token, expiration_time)
    VALUES (userID, authToken, expTime)
    ON DUPLICATE KEY UPDATE
        auth_token = authToken,
        expiration_time = expTime;
    
    SELECT authToken, expTime;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteAuthToken (
    IN authToken VARCHAR(255)
)
BEGIN
    DELETE FROM AuthenticationTokens
    WHERE auth_token = authToken;
    
    SELECT ROW_COUNT() AS wasDeleted;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE deleteAllAuthTokensIfAuthenticated (
    IN userIDHex VARCHAR(16),
    IN authToken VARCHAR(255)
)
BEGIN
    DECLARE userID BIGINT UNSIGNED DEFAULT CONV((userIDHex), 16, 10);
    DECLARE tokenOwnerID BIGINT UNSIGNED;

    SELECT user_id INTO tokenOwnerID
    FROM AuthenticationTokens FORCE INDEX (sec_idx)
    WHERE auth_token = authToken;

    IF (tokenOwnerID IS NOT NULL AND tokenOwnerID = userID) THEN
        DELETE FROM AuthenticationTokens
        WHERE user_id = userID;
        SELECT ROW_COUNT() AS deletionNum;
    ELSE
        SELECT 0 AS deletionNum;
    END IF;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE replaceAuthToken (
    IN authToken VARCHAR(255),
    IN expPeriod BIGINT UNSIGNED,
    IN timeGrain TINYINT UNSIGNED
)
BEGIN
    DECLARE newAuthToken VARCHAR(255) DEFAULT toBase64(RANDOM_BYTES(40));
    DECLARE expTime BIGINT UNSIGNED DEFAULT (
        (UNIX_TIMESTAMP() >> timeGrain << timeGrain) + expPeriod
    );

    UPDATE AuthenticationTokens
    SET auth_token = newAuthToken, expiration_time = expTime
    WHERE auth_token = authToken;

    IF (ROW_COUNT()) THEN
        SELECT newAuthToken, expTime;
    ELSE
        SELECT NULL;
    END IF;
END //
DELIMITER ;




DELIMITER //
CREATE PROCEDURE selectAuthenticatedUserID (
    IN authToken VARCHAR(255)
)
BEGIN
    DECLARE userID BIGINT UNSIGNED;
    DECLARE curTime BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();

    SELECT user_id INTO userID
    FROM AuthenticationTokens FORCE INDEX (sec_idx)
    WHERE auth_token = authToken AND expiration_time > curTime;

    SELECT CONV(userID, 10, 16) AS userID;
END //
DELIMITER ;





DELIMITER //
CREATE PROCEDURE selectAuthenticatedUserIDAndGas (
    IN authToken VARCHAR(255),
    IN doLock BOOL
)
proc: BEGIN
    DECLARE userID BIGINT UNSIGNED;
    DECLARE curTime BIGINT UNSIGNED DEFAULT UNIX_TIMESTAMP();

    SELECT user_id INTO userID
    FROM AuthenticationTokens FORCE INDEX (sec_idx)
    WHERE auth_token = authToken AND expiration_time > curTime;

    IF (userID IS NULL) THEN
        SELECT NULL;
        LEAVE proc;
    END IF;

    IF (doLock) THEN
        DO GET_LOCK(CONCAT("UserGas.", userID), 10);
    END IF;

    SELECT
        CONV(userID, 10, 16) AS userID,
        gas_json AS gasJSON,
        auto_refilled_at AS autoRefilledAt
    FROM UserGas FORCE INDEX (PRIMARY)
    WHERE user_id = userID;
END proc //
DELIMITER ;






DELIMITER //
CREATE PROCEDURE selectGas (
    IN userIDHex VARCHAR(16),
    IN doLock BOOL
)
BEGIN
    DECLARE userID BIGINT UNSIGNED DEFAULT CONV((userIDHex), 16, 10);

    IF (doLock) THEN
        DO GET_LOCK(CONCAT("UserGas.", userID), 10);
    END IF;

    SELECT gas_json AS gasJSON, auto_refilled_at AS autoRefilledAt
    FROM UserGas FORCE INDEX (PRIMARY)
    WHERE user_id = userID;
END //
DELIMITER ;



DELIMITER //
CREATE PROCEDURE updateGas (
    IN userIDHex VARCHAR(16),
    IN gasJSON JSON,
    IN isAutoRefill BOOL,
    IN doUnlock BOOL
)
BEGIN
    DECLARE userID BIGINT UNSIGNED DEFAULT CONV((userIDHex), 16, 10);
    IF (isAutoRefill) THEN
        UPDATE UserGas
        SET gas_json = gasJSON, auto_refilled_at = UNIX_TIMESTAMP()
        WHERE user_id = userID;
        SELECT ROW_COUNT() AS wasUpdated;
    ELSE
        UPDATE UserGas
        SET gas_json = gasJSON
        WHERE user_id = userID;
        SELECT ROW_COUNT() AS wasUpdated;
    END IF;

    IF (doUnlock) THEN
        DO RELEASE_LOCK(CONCAT("Gas.", userID));
    END IF;
END //
DELIMITER ;

