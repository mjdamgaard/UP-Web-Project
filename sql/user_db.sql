
-- USE userDB;

/* Private user data */
DROP TABLE UserCredentials;
DROP TABLE EmailAddresses;
DROP TABLE AuthenticationTokens;
DROP TABLE UserGas;






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

    user_name VARCHAR(50) NOT NULL,

    email_addr VARCHAR(255) NOT NULL,

    is_confirmed BOOL NOT NULL DEFAULT 0,
    
    PRIMARY KEY (
        user_name,
        email_addr
    ),
    
    UNIQUE INDEX sec_idx (
        email_addr,
        user_name
    )
);




/* Authentication tokens */

CREATE TABLE AuthenticationTokens (

    user_id BIGINT UNSIGNED NOT NULL,

    auth_token VARCHAR(255) NOT NULL,

    expiration_time BIGINT UNSIGNED NOT NULL, -- unix time

    PRIMARY KEY (
        user_id,
        auth_token
    ),

    UNIQUE INDEX sec_idx (
        auth_token
    )
);





/* User gas deposits */

CREATE TABLE UserGas (

    user_id BIGINT UNSIGNED PRIMARY KEY,

    gas_json JSON NOT NULL,

    auto_refilled_at BIGINT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP())
);








-- If a developer runs out of gas, an insert statement like the following is
-- a quick way to replenish that gas:

-- INSERT INTO UserGas (user_id, gas_json)
-- VALUES (1, CONCAT('{',
--     '"comp":100000000,',
--     '"import":500000,',
--     '"fetch":500000,',
--     '"time":10000000,',
--     '"dbRead":10000000,',
--     '"dbWrite":100000000,',
--     '"conn":3000000,',
--     '"mkdir":1000,',
--     '"mkTable":10',
-- '}'));
