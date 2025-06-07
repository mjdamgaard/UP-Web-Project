
USE userDB;

/* Private user data */
DROP TABLE UserCredentials;
DROP TABLE EmailAddresses;
DROP TABLE AuthenticationTokens;
DROP TABLE UserGas;


-- TODO: At some point split this userDB in two, one with the password hashes
-- and emails and such, and one with the auth. tokens, and use this to make
-- sure that the main server (which is also currently called "ajax_server")
-- doesn't even have access to the config file, and thus the password, to the
-- DB with the password hashes and such.




/* User credentials */

CREATE TABLE UserCredentials (

    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_name VARCHAR(50) NOT NULL,

    password_hash_salted CHAR(60) NOT NULL,

    UNIQUE INDEX sec_idx (
        user_name
    )
);



CREATE TABLE EmailAddresses (

    user_id BIGINT UNSIGNED NOT NULL,

    email_addr VARCHAR(255) NOT NULL,
    
    PRIMARY KEY (
        user_id,
        email_addr
    ),
    
    UNIQUE INDEX sec_idx (
        email_addr,
        user_id
    )
);




/* Authentication tokens */

CREATE TABLE AuthenticationTokens (

    user_id BIGINT UNSIGNED PRIMARY KEY,

    auth_token VARCHAR(255) NOT NULL,

    expiration_time BIGINT UNSIGNED NOT NULL, -- unix timestamp.

    UNIQUE INDEX sec_idx (
        auth_token
    )
);





/* User gas deposits */

CREATE TABLE UserGas (

    user_id BIGINT UNSIGNED PRIMARY KEY,

    gas_json VARCHAR(700) NOT NULL,

    last_auto_refill_at BIGINT UNSIGNED NOT NULL -- unix timestamp.

    -- comp_gas     FLOAT NOT NULL DEFAULT 0,
    -- db_read_gas  FLOAT NOT NULL DEFAULT 10000000,-- bytes (roughly).
    -- db_write_gas FLOAT NOT NULL DEFAULT 10000000,-- bytes (roughly).
    -- time_gas     FLOAT NOT NULL DEFAULT 500000,-- ms.
    -- conn_gas     FLOAT NOT NULL DEFAULT 500000,-- ms (for open db connections).
    -- mkdir_gas    FLOAT NOT NULL DEFAULT 20 -- number of new home directories.
);






-- TODO: Remove this and implement account creation and login/logout.
INSERT INTO UserCredentials (user_name, password_hash_salted)
VALUES ("test_user", REPEAT("0", 60));

INSERT INTO AuthenticationTokens (user_id, auth_token, expiration_time)
VALUES (1, "test_token", 100000000000);
