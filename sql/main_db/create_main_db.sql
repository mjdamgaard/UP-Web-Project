
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





/* Data structures  */

-- Note that the column types of the DataStructures can be converted at some
-- point when we implement a more compressed way of storing the data,
-- underneath the database's API.

CREATE TABLE DataStructures_SingleIndex (

    handler_id VARBINARY(8) NOT NULL, -- Type can be changed.

    format_ident TINYINT UNSIGNED NOT NULL,

    struct_key VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    entry_key VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    entry_payload VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    PRIMARY KEY (
        handler_id,
        format_ident,
        struct_key,
        entry_key
    )
)
ROW_FORMAT = COMPRESSED;



CREATE TABLE DataStructures_DoubleIndex (

    handler_id VARBINARY(8) NOT NULL, -- Type can be changed.

    format_ident TINYINT UNSIGNED NOT NULL,

    struct_key VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    entry_score VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    entry_key VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    entry_payload VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    PRIMARY KEY (
        handler_id,
        format_ident,
        struct_key,
        entry_key
    )

    UNIQUE INDEX (
        handler_id,
        format_ident,
        struct_key,
        entry_score,
        entry_key
    )
)
ROW_FORMAT = COMPRESSED;



CREATE TABLE DataStructures_SingleIndex_CharKey (

    handler_id VARBINARY(8) NOT NULL, -- Type can be changed.

    format_ident TINYINT UNSIGNED NOT NULL,

    struct_key VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    entry_key VARCHAR(255) NOT NULL, -- Type can be resized/changed.

    entry_payload VARCHAR(32) NOT NULL, -- Type can be resized/changed.

    PRIMARY KEY (
        handler_id,
        format_ident,
        struct_key,
        entry_key
    )
)
ROW_FORMAT = COMPRESSED;



CREATE TABLE DataStructures_SingleIndex_FloatKey (

    handler_id VARBINARY(8) NOT NULL, -- Type can be changed.

    format_ident TINYINT UNSIGNED NOT NULL,

    struct_key VARBINARY(64) NOT NULL, -- Type can be resized/changed.

    entry_key FLOAT NOT NULL, -- Type can be resized/changed.

    entry_payload VARCHAR(32) NOT NULL, -- Type can be resized/changed.

    PRIMARY KEY (
        handler_id,
        format_ident,
        struct_key,
        entry_key
    )
)
ROW_FORMAT = COMPRESSED;


-- TODO: Potentially make more DataStructures tables if needed.





CREATE TABLE DataStructureFormats (

    handler_id BIGINT UNSIGNED NOT NULL,

    format_ident TINYINT UNSIGNED NOT NULL,

    format_def VARCHAR(255) -- Type can resized/changed.
        CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    PRIMARY KEY (
        handler_id,
        format_ident
    )
);
-- ROW_FORMAT = COMPRESSED;






/* Fulltext indexes */

-- TODO: Fulltext indexed tables should actually instead be created and
-- updated on demand from user groups that has pooled enough "upload data
-- cost" to do so, as described in my notes. *But at first, I will just use one
-- and only one such fulltext index table.

CREATE TABLE FulltextIndexEntries (

    ent_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    text_str VARCHAR(700) CHARACTER SET utf8mb4 NOT NULL,

    FULLTEXT idx (text_str)

)
ENGINE = InnoDB;














/* Entities */


CREATE TABLE Entities (
    -- Entity ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Type identifier.
    ent_type CHAR NOT NULL,

    -- A string (possibly a JSON object) that defines the entity. The format
    -- depends on ent_type.
    def_str LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    -- The user who submitted the entity, unless creator_id = 0, which means
    -- that the creator is anonymous.
    creator_id BIGINT UNSIGNED NOT NULL DEFAULT 0,

    -- A whitelist script entity that outputs whether the user is allowed to
    -- read the entity. Can also just be a single user ID (the creator, i.e.).
    -- Also, whitelist_id = 0 means that everyone can read it.
    whitelist_id BIGINT UNSIGNED NOT NULL DEFAULT 0,

    -- Whether the creator can edit the entity or not. (is_editable = 1 will
    -- also typically mean that the creator's profile info (username and
    -- possibly profile icon) is shown as well when rendering the entity.)
    -- Even when is_editable = 0, however, the creator is still able to
    -- substitute any '@[<path>]' placeholders with real entity ID references.
    is_editable TINYINT UNSIGNED NOT NULL DEFAULT 0, CHECK (is_editable <= 1),

    -- If creator_id = 0, then the entity cannot be edited.
    CHECK (creator_id != 0 OR is_editable = 0)
);



/* Entity indexes */

CREATE TABLE EntitySecKeys (

    ent_type CHAR NOT NULL,

    whitelist_id BIGINT UNSIGNED NOT NULL DEFAULT 0, -- (0 means public.)

    -- is_hashed TINYINT UNSIGNED NOT NULL, CHECK (is_hashed <= 1),

    def_key VARCHAR(700) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    ent_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (
        ent_type,
        reader_whitelist_id,
        def_key
    )
);








/* Initial entities */

INSERT INTO Entities (
    id, ent_type, def_str
)
VALUES
    -- (2, "t", "u"),
    -- (3, "t", "e"),
    -- (4, "t", "s"),
    -- (5, "t", "f"),
    -- (7, "t", "h"),
    -- (8, "t", "8"),
    -- (18, "d", "original_DB_node"),
    (19, "u", "initial_admin");

INSERT INTO Entities (
    id, ent_type, def_str, creator_id, is_editable
)
VALUES (20, "e", '{}', 19, 1);




INSERT INTO EntitySecKeys (
    ent_type, def_key, ent_id
)
VALUES
    -- ("t", "u", 2),
    -- ("t", "e", 3),
    -- ("t", "s", 4),
    -- ("t", "f", 5),
    -- ("t", "h", 7),
    -- ("t", "8", 8),
    -- ("d", "original_DB_node", 18),
    ("u", "initial_admin", 19);
    -- No sec. key for ("e", '{}', 9).



















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
