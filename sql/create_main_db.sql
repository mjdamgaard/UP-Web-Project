
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

    dir_name VARCHAR(255) NOT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,

    is_private BOOL NOT NULL DEFAULT 0,

    is_home_dir BOOL NOT NULL DEFAULT 0,

    UNIQUE INDEX sec_idx (
        parent_dir_id,
        dir_name,
        dir_id
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE DirectoryAdmins (

    dir_id BIGINT UNSIGNED NOT NULL,

    admin_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        dir_id,
        admin_id
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE ClonedDirectories (

    clone_child_dir_id BIGINT UNSIGNED PRIMARY KEY,

    clone_parent_dir_id BIGINT UNSIGNED NOT NULL,

    UNIQUE INDEX sec_idx (
        clone_parent_dir_id,
        clone_child_dir_id
    )

) ROW_FORMAT = COMPRESSED;


CREATE TABLE Files (

    file_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    dir_id BIGINT UNSIGNED NOT NULL,

    file_name VARCHAR(255) NOT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,

    file_type VARCHAR(32) NOT NULL CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,

    is_private BOOL NOT NULL,

    content_data BLOB,

    UNIQUE INDEX sec_idx (
        dir_id,
        file_name,
        file_id
    )

) ROW_FORMAT = COMPRESSED;





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




-- TODO: Once we expend this system to a distributed system, the so-called
-- global directory references will be a reference that contains a hash of a
-- signature, which is then typically used to authenticate the original creator
-- (admin) of the given folder. This signature will then have to be checked by
-- any DB node ("UP-Web node") before inserting into this table. This does not,
-- however, need to happen at creation time, as the signature only tells that
-- the owner of the public keys within the signature has signed off on some
-- statement about the contents of the directory (including potentially any
-- non-public data). In particular, global directory references will be a good
-- way to pair "sibling directory nodes" across different UPW nodes, which are
-- directories that have the same source code, and is created for the same
-- purpose, working together across UP-Web nodes to serve that purpose.

CREATE TABLE GlobalDirectoryReferences (

    global_ref VARCHAR(255) PRIMARY KEY
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,

    dir_id BIGINT UNSIGNED NOT NULL

); -- ROW_FORMAT = COMPRESSED;




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

    elem_score VARBINARY(255) NOT NULL,

    elem_key VARBINARY(255) NOT NULL,

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


CREATE TABLE FloatKeyDataTables (

    dir_id BIGINT UNSIGNED NOT NULL,

    list_key VARBINARY(255) NOT NULL,

    elem_key FLOAT NOT NULL,

    elem_payload VARBINARY(255) NOT NULL DEFAULT "",

    PRIMARY KEY (
        dir_id,
        list_key,
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














-- /* Entities */


-- CREATE TABLE Entities (
--     -- Entity ID.
--     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

--     -- Type identifier.
--     ent_type CHAR NOT NULL,

--     -- A string (possibly a JSON object) that defines the entity. The format
--     -- depends on ent_type.
--     def_str TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

--     -- The user who submitted the entity, unless creator_id = 0, which means
--     -- that the creator is anonymous.
--     creator_id BIGINT UNSIGNED NOT NULL DEFAULT 0,

--     -- A whitelist script entity that outputs whether the user is allowed to
--     -- read the entity. Can also just be a single user ID (the creator, i.e.).
--     -- Also, whitelist_id = 0 means that everyone can read it.
--     whitelist_id BIGINT UNSIGNED NOT NULL DEFAULT 0,

--     -- Whether the creator can edit the entity or not. (is_editable = 1 will
--     -- also typically mean that the creator's profile info (username and
--     -- possibly profile icon) is shown as well when rendering the entity.)
--     -- Even when is_editable = 0, however, the creator is still able to
--     -- substitute any '@[<path>]' placeholders with real entity ID references.
--     is_editable TINYINT UNSIGNED NOT NULL DEFAULT 0, CHECK (is_editable <= 1),

--     -- If creator_id = 0, then the entity cannot be edited.
--     CHECK (creator_id != 0 OR is_editable = 0)
-- );



-- /* Entity indexes */

-- CREATE TABLE EntitySecKeys (

--     ent_type CHAR NOT NULL,

--     editor_id BIGINT UNSIGNED NOT NULL, -- (0 means 'not editable.')

--     whitelist_id BIGINT UNSIGNED NOT NULL, -- (0 means 'public.')

--     -- is_hashed TINYINT UNSIGNED NOT NULL, CHECK (is_hashed <= 1),

--     def_key VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

--     ent_id BIGINT UNSIGNED NOT NULL,

--     PRIMARY KEY (
--         ent_type,
--         editor_id,
--         whitelist_id,
--         def_key
--     )
-- );








-- /* Initial entities */

-- INSERT INTO Entities (
--     id, ent_type, def_str
-- )
-- VALUES
--     -- (2, "t", "u"),
--     -- (3, "t", "e"),
--     -- (4, "t", "s"),
--     -- (5, "t", "f"),
--     -- (7, "t", "h"),
--     -- (8, "t", "8"),
--     -- (18, "d", "original_DB_node"),
--     (19, "u", "initial_admin");

-- INSERT INTO Entities (
--     id, ent_type, def_str, creator_id, is_editable
-- )
-- VALUES (20, "e", '{}', 19, 1);




-- INSERT INTO EntitySecKeys (
--     ent_type, def_key, ent_id
-- )
-- VALUES
--     -- ("t", "u", 2),
--     -- ("t", "e", 3),
--     -- ("t", "s", 4),
--     -- ("t", "f", 5),
--     -- ("t", "h", 7),
--     -- ("t", "8", 8),
--     -- ("d", "original_DB_node", 18),
--     ("u", "initial_admin", 19);
--     -- No sec. key for ("e", '{}', 9).



















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
