
/* Private user data */
DROP TABLE Private_UserData;
DROP TABLE Private_Sessions;
DROP TABLE Private_EMails;

/* Debugging */
DROP TABLE DebugLogEntries;
-- DROP PROCEDURE logMsg;






/* Private user data */

CREATE TABLE Private_UserData (
    user_id BIGINT UNSIGNED PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,
    -- TODO: Consider adding more restrictions.

    password_salted_hash CHAR(60),

    public_keys_for_authentication TEXT,
    -- TODO: Update column name, and this description.
    -- (In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need to exchange passwords
    -- between databases.) (This could also be other data than encryption keys,
    -- and in principle it could even just be some ID to use for authenticating
    -- the user via a third party.)


    -- download_data_this_week FLOAT NOT NULL DEFAULT 0, -- number pages touched.
    -- download_data_weekly_limit FLOAT NOT NULL DEFAULT 50000000,

    upload_data_this_week FLOAT NOT NULL DEFAULT 0, -- bytes.
    upload_data_weekly_limit FLOAT NOT NULL DEFAULT 1000000,
    computation_usage_this_week FLOAT NOT NULL DEFAULT 0, -- ms.
    computation_usage_weekly_limit FLOAT NOT NULL DEFAULT 500000,

    last_refreshed_at DATE NOT NULL DEFAULT (CURDATE()),

    private_storage_data_usage FLOAT NOT NULL DEFAULT 0, -- bytes.
    private_storage_data_limit FLOAT NOT NULL DEFAULT 10000000,

    user_profile_count FLOAT NOT NULL DEFAULT 0, -- number of user profiles.
    user_profile_limit FLOAT NOT NULL DEFAULT 8
);




CREATE TABLE Private_Sessions (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    session_id VARBINARY(255) NOT NULL,
    expiration_time BIGINT UNSIGNED NOT NULL -- unix timestamp.
);

CREATE TABLE Private_EMails (
    e_mail_address VARCHAR(255) PRIMARY KEY,
    number_of_accounts TINYINT UNSIGNED NOT NULL,
    -- This field is only temporary, until the e-mail address holder has
    -- confirmed the new account:
    account_1_user_id BIGINT UNSIGNED
);















CREATE TABLE DebugLogEntries (

    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    msg VARCHAR(1000)
);

DELIMITER //
CREATE PROCEDURE logMsg (
    IN logMessage VARCHAR(1000)
)
BEGIN
    INSERT INTO DebugLogEntries (msg)
    VALUE (logMessage);
END //
DELIMITER ;
