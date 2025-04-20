

DROP TABLE HomeDirectories;
DROP TABLE Files;
DROP TABLE FileIDs;

DROP TABLE TextFileContents;


DROP TABLE StorageGasPayments;





/* Directories and files */

CREATE TABLE HomeDirectories (

    dir_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admin_id BIGINT UNSIGNED,

    is_private BOOL NOT NULL DEFAULT 0

) ROW_FORMAT = COMPRESSED;



CREATE TABLE Files (

    dir_id BIGINT UNSIGNED NOT NULL,

    file_path VARCHAR(700) CHARACTER SET utf8mb4 NOT NULL,

    modified_at INT UNSIGNED NOT NULL DEFAULT (NOW()),

    prev_modified_at INT UNSIGNED DEFAULT (modified_at),

    file_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        dir_id,
        file_path
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE FileIDs (

    file_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY

); -- ROW_FORMAT = COMPRESSED;





/* File contents (some "files" are actually relational data tables) */


CREATE TABLE TextFileContents (

    file_id BIGINT UNSIGNED PRIMARY KEY,

    content_text TEXT CHARACTER SET utf8mb4

); -- ROW_FORMAT = COMPRESSED;




CREATE TABLE BinKeyDataTables (

    file_id BIGINT UNSIGNED NOT NULL,

    elem_key VARBINARY(255) NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        file_id,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE CharKeyDataTables (

    file_id BIGINT UNSIGNED NOT NULL,

    elem_key VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        file_id,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE FloatKeyDataTables (

    file_id BIGINT UNSIGNED NOT NULL,

    elem_key FLOAT NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        file_id,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;



CREATE TABLE BinKeyScoredDataTables (

    file_id BIGINT UNSIGNED NOT NULL,

    elem_key VARBINARY(255) NOT NULL,

    elem_score VARBINARY(255) NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        file_id,
        elem_key
    ),

    UNIQUE INDEX sec_idx (
        file_id,
        elem_score,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;








/* Fulltext indexes */

-- TODO: Fulltext indexed tables should actually instead be created and
-- updated on demand from user groups that has pooled enough "storage gas" to
-- do so, as described in my notes.

CREATE TABLE FulltextIndexEntries (

    ent_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    text_str VARCHAR(700) CHARACTER SET utf8mb4 NOT NULL,

    FULLTEXT idx (text_str)

) ENGINE = InnoDB;













CREATE TABLE StorageGasPayments (

    dir_id BIGINT UNSIGNED PRIMARY KEY,

    payments_today BIGINT UNSIGNED NOT NULL DEFAULT 0,

    payments_this_week BIGINT UNSIGNED NOT NULL DEFAULT 0,

    payments_this_month BIGINT UNSIGNED NOT NULL DEFAULT 0,

    payments_this_quarter BIGINT UNSIGNED NOT NULL DEFAULT 0,

    payments_this_year BIGINT UNSIGNED NOT NULL DEFAULT 0,

    payments_last_five_years BIGINT UNSIGNED NOT NULL DEFAULT 0,

    payments_all_time BIGINT UNSIGNED NOT NULL DEFAULT 0,

    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

) ROW_FORMAT = COMPRESSED;










-- CREATE TABLE DebugLogEntries (

--     id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

--     msg VARCHAR(1000)
-- );

-- DELIMITER //
-- CREATE PROCEDURE logMsg (
--     IN logMessage VARCHAR(1000)
-- )
-- BEGIN
--     INSERT INTO DebugLogEntries (msg)
--     VALUE (logMessage);
-- END //
-- DELIMITER ;
