

CREATE TABLE UserCredentials (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    pw_hash VARBINARY(2000)
);

CREATE TABLE Sessions (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    session_id VARBINARY(2000) NOT NULL,
    expiration_date DATETIME NOT NULL
);

CREATE TABLE EMails (
    e_mail_address VARCHAR(255) PRIMARY KEY,
    number_of_accounts NOT NULL
);


DELIMITER //
CREATE PROCEDURE createOrUpdateSession (
    IN userID BIGINT UNSIGNED,
    IN sessionID VARBINARY(2000),
    IN expirationDate DATETIME
)
BEGIN
    INSERT INTO Sessions (user_id, session_id, expiration_date)
    VALUES (userID, sessionID, expirationDate)
    ON DUPLICATE KEY UPDATE
        session_id = sessionID,
        expiration_date = expirationDate;
    SELECT 0 AS exitCode;
END //
DELIMITER ;
