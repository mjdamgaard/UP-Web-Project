
-- USE mainDB;

DROP TABLE HomeDirectories;
DROP TABLE Files;
DROP TABLE FileIDs;

DROP TABLE ServerModuleGas;

DROP TABLE TextFiles;
DROP TABLE AutoKeyTextTables;
DROP TABLE BinaryKeyTables;
DROP TABLE CharKeyTables;
DROP TABLE BinaryKeyBinaryScoreTables;

DROP TABLE FulltextIndexEntries;





/* Directories and files */

CREATE TABLE HomeDirectories (

    dir_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admin_id BIGINT UNSIGNED,

    UNIQUE INDEX sec_idx (
        admin_id,
        dir_id
    )

) ROW_FORMAT = COMPRESSED;



CREATE TABLE Files (

    dir_id BIGINT UNSIGNED NOT NULL,

    file_path VARCHAR(700) CHARACTER SET utf8mb4 NOT NULL,

    modified_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),

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





CREATE TABLE ServerModuleGas (

    file_id BIGINT UNSIGNED PRIMARY KEY,

    gas_json JSON NOT NULL

) ROW_FORMAT = COMPRESSED;







/* Simple text files */


CREATE TABLE TextFiles (

    file_id BIGINT UNSIGNED PRIMARY KEY,

    content_text TEXT CHARACTER SET utf8mb4

); -- ROW_FORMAT = COMPRESSED;





/* Table files (abstract files implemented via DB tables) */


CREATE TABLE AutoKeyTextTables (

    file_id BIGINT UNSIGNED NOT NULL,

    list_id VARBINARY(255) NOT NULL,

    text_id BIGINT UNSIGNED NOT NULL,

    text_data TEXT CHARACTER SET utf8mb4,

    PRIMARY KEY (
        file_id,
        list_id,
        text_id
    )

) ROW_FORMAT = COMPRESSED;



CREATE TABLE BinaryKeyTables (

    file_id BIGINT UNSIGNED NOT NULL,

    list_id VARBINARY(255) NOT NULL,

    elem_key VARBINARY(255) NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        file_id,
        list_id,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE CharKeyTables (

    file_id BIGINT UNSIGNED NOT NULL,

    list_id VARBINARY(255) NOT NULL,

    elem_key VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        file_id,
        list_id,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;





CREATE TABLE BinaryKeyBinaryScoreTables (

    file_id BIGINT UNSIGNED NOT NULL,

    list_id VARBINARY(255) NOT NULL,

    elem_key VARBINARY(255) NOT NULL,

    elem_score VARBINARY(255) NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        file_id,
        list_id,
        elem_key
    ),

    UNIQUE INDEX sec_idx (
        file_id,
        list_id,
        elem_score,
        elem_key
    )

) ROW_FORMAT = COMPRESSED;








/* Fulltext indexes */

-- TODO: Fulltext indexed tables should actually instead be created on demand,
-- but only if the user has some 'mkTable' gas, which is not for everyone to
-- have.

CREATE TABLE FulltextIndexEntries (

    ent_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    text_str VARCHAR(700) CHARACTER SET utf8mb4 NOT NULL,

    FULLTEXT idx (text_str)

) ENGINE = InnoDB;


