
/* Scores */
DROP TABLE EntityLists;
DROP TABLE ListMetadata;

/* Requests */
DROP TABLE ScheduledRequests;

/* Entities */
DROP TABLE Entities;
DROP TABLE EntitySecKeys;

/* Indexes */
-- DROP TABLE FulltextIndexedEntities;

/* Private user data */
DROP TABLE Private_UserData;
-- DROP TABLE Private_Sessions;
-- DROP TABLE Private_EMails;

/* Debugging */
DROP TABLE DebugLogEntries;
-- DROP PROCEDURE logMsg;





/* Directories and files */

CREATE TABLE Directories (

    dir_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    parent_dir_id BIGINT UNSIGNED NOT NULL DEFAULT 0,

    dir_name VARCHAR(255) NOT NULL CHARACTER SET utf8mb4,

    is_private BOOL NOT NULL DEFAULT 0,

    is_home_dir BOOL NOT NULL DEFAULT 0,

    admin_id BIGINT UNSIGNED,

    UNIQUE INDEX sec_idx (
        parent_dir_id,
        dir_name,
        dir_id
    )

) ROW_FORMAT = COMPRESSED;

INSERT INTO Directories (dir_id, dir_name)
VALUES (1, "");



CREATE TABLE Files (

    file_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    dir_id BIGINT UNSIGNED NOT NULL,

    file_name VARCHAR(255) NOT NULL CHARACTER SET utf8mb4,

    is_private BOOL NOT NULL DEFAULT 0,

    content_data BLOB NOT NULL DEFAULT "",

    UNIQUE INDEX sec_idx (
        dir_id,
        file_name,
        file_id
    )

) ROW_FORMAT = COMPRESSED;






-- -- TODO: Once we expend this system to a distributed system, the so-called
-- -- global directory references will be a reference that contains a hash of a
-- -- signature, which is then typically used to authenticate the original creator
-- -- (admin) of the given folder. This signature will then have to be checked by
-- -- any DB node ("UP-Web node") before inserting into this table. This does not,
-- -- however, need to happen at creation time, as the signature only tells that
-- -- the owner of the public keys within the signature has signed off on some
-- -- statement about the contents of the directory (including potentially any
-- -- non-public data). In particular, global directory references will be a good
-- -- way to pair "sibling directory nodes" across different UPW nodes, which are
-- -- directories that have the same source code, and is created for the same
-- -- purpose, working together across UP-Web nodes to serve that purpose.

-- CREATE TABLE GlobalDirectoryReferences (

--     global_ref VARCHAR(255) PRIMARY KEY
--         CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,

--     dir_id BIGINT UNSIGNED NOT NULL

-- ); -- ROW_FORMAT = COMPRESSED;




/* Data tables  */

CREATE TABLE BinKeyDataTables (

    dir_id BIGINT UNSIGNED NOT NULL,

    list_key VARBINARY(255) NOT NULL,

    elem_key VARBINARY(255) NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        dir_id,
        list_key,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE BinKeyScoredDataTables (

    dir_id BIGINT UNSIGNED NOT NULL,

    list_key VARBINARY(255) NOT NULL,

    elem_key VARBINARY(255) NOT NULL,

    elem_score VARBINARY(255) NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        dir_id,
        list_key,
        elem_key
    )

    UNIQUE INDEX sec_idx (
        dir_id,
        list_key,
        elem_score,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE CharKeyDataTables (

    dir_id BIGINT UNSIGNED NOT NULL,

    list_key VARBINARY(255) NOT NULL,

    elem_key VARCHAR(255) NOT NULL CHARACTER SET utf8mb4,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        dir_id,
        list_key,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;


-- CREATE TABLE FloatKeyDataTables (

--     dir_id BIGINT UNSIGNED NOT NULL,

--     list_key VARBINARY(255) NOT NULL,

--     elem_key FLOAT NOT NULL,

--     elem_payload VARBINARY(255) NOT NULL DEFAULT "",

--     PRIMARY KEY (
--         dir_id,
--         list_key,
--         elem_key
--     )

-- ) ROW_FORMAT = COMPRESSED;









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
