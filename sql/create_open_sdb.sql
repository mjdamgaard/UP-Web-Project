
-- /* Semantic inputs */
-- DROP TABLE SemanticInputs;
-- DROP TABLE PrivateRecentInputs;
-- DROP TABLE RecentInputs;
-- DROP TABLE EntityIndexKeys;
--
-- /* Entities */
-- DROP TABLE Entities;
--
-- /* Data */
-- DROP TABLE Users;
-- DROP TABLE Texts;
-- DROP TABLE Binaries;
--
-- /* Meta data */
-- DROP TABLE PrivateCreators;





/* Semantic inputs are the statements that the users (or aggregation bots) give
 * as input to the semantic network. A central feature of this semantic system
 * is that all such statements come with a numerical value which represents the
 * degree to which the user deems that the statement is correct (like when
 * answering a survey).
 * The statements in this system are aways formed from a category entity and a
 * instance entity. The user thus states that the latter is an instance of the
 * given category. The rating then tells how important/useful the user deems
 * the instance to be in that category.
 * Note that all predicates can be reformulated as categories. For instance,
 * the predicate "is a scary movie" can be reformulated as the category "Scary
 * movies."
 **/
CREATE TABLE SemanticInputs (
    -- User (or bot) who states the statement.
    user_id BIGINT UNSIGNED NOT NULL,
    -- Category of the statement.
    cat_id BIGINT UNSIGNED NOT NULL,

    /* The input set */
    -- Given some constants for the above two columns, the "input sets" contain
    -- pairs of rating values and the IDs of the category instances.
    rat_val SMALLINT UNSIGNED NOT NULL,
    inst_id BIGINT UNSIGNED NOT NULL,

    -- Resulting semantic input: "User #<user_id> states that entity #<inst_id>
    -- is an instance of category #<cat_id> with importantance/usefulness given
    -- on a scale from 0 to 10 (with 5 being neutral) by <rat_val> / 6553.5."

    PRIMARY KEY (
        user_id,
        cat_id,
        rat_val,
        inst_id
    ),

    UNIQUE INDEX (user_id, cat_id, inst_id)
);
-- TODO: Compress this table and its sec. index, as well as some other tables
-- and sec. indexes below. (But compression is a must for this table.)


CREATE TABLE PrivateRecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    cat_id BIGINT UNSIGNED NOT NULL,
    rat_val SMALLINT UNSIGNED, -- new rating value:
    inst_id BIGINT UNSIGNED NOT NULL,

    live_after TIME
    -- TODO: Make a recurring scheduled event that decrements the days of this
    -- time, and one that continously moves the private RIs to the public table
    -- when the time is up (and when the day part of the time is at 0).
);
CREATE TABLE RecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    cat_id BIGINT UNSIGNED NOT NULL,
    rat_val SMALLINT UNSIGNED, -- new rating value.
    inst_id BIGINT UNSIGNED NOT NULL,

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- CREATE TABLE RecordedInputs (
--     user_id BIGINT UNSIGNED NOT NULL,
--     cat_id BIGINT UNSIGNED NOT NULL,
--     -- recorded rating value.
--     inst_id BIGINT UNSIGNED NOT NULL,
--
--     changed_at DATETIME,
--
--     rat_val SMALLINT UNSIGNED,
--
--     PRIMARY KEY (
--         user_id,
--         cat_id,
--         inst_id,
--         changed_at
--     )
-- );

CREATE TABLE EntityIndexKeys (
    -- User (or bot) who governs the index.
    user_id BIGINT UNSIGNED NOT NULL,
    -- Index entity which defines the restrictions on the entity keys.
    idx_id BIGINT UNSIGNED NOT NULL,

    /* The entity index */
    -- Given some constants for the above two columns, the "entity indexes"
    -- contain the "entity keys," which are each just the secondary index of an
    -- entity.
    ent_type CHAR(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    ent_tmpl_id BIGINT UNSIGNED,
    ent_def_str VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    PRIMARY KEY (
        user_id,
        idx_id,
        ent_type,
        ent_tmpl_id,
        ent_def_str
    )
);
-- (Also needs compressing.)




CREATE TABLE Entities (
    -- Entity ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Type of the entity. This can for instance be: Type, Category, Template,
    -- Index, User, Text data, Binary data, Aggregation bot, as well as any
    -- user-submitted type.
    type_id BIGINT UNSIGNED NOT NULL,

    -- ID of the template which defines how the defining string is to be
    -- interpreted. If the template ID is null, the defining string is just
    -- interpreted as is. In the special case when type_id is that of "Template"
    -- (i.e. type_id = 3), the tmpl_id is replaced for the ID of the template's
    -- intended type. (See initial_inserts.sql for examples.)
    tmpl_id BIGINT UNSIGNED,

    -- Defining string of the entity. This can be a lexical item, understood in
    -- the context of the type alone if tmpl_id is null. If the tmpl_id is not
    -- null, the def_str can be a series of inputs separated by '|' of either
    -- IDs of the form "#<number>" (e.g. "#100") or any other string (e.g.
    -- "Physics"). These inputs is then plugged into the placeholders of the
    -- template in order of appearence and the resulting string is then
    -- interpreted in the context of the type to yield the definition of the
    -- entity.
    def_str VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    UNIQUE INDEX (type_id, tmpl_id, def_str)
);

INSERT INTO Entities (type_id, tmpl_id, def_str, id)
VALUES
    (1, NULL, "Type", 1), -- The type of this "Type" entity is itself.
    (1, NULL, "Category", 2), -- This is then "Category" type entity and so on.
    (1, NULL, "Template", 3),
    (1, NULL, "Index", 4),
    (1, NULL, "User", 5),
    (1, NULL, "Aggregation bot", 6),
    (1, NULL, "Text data", 7),
    (1, NULL, "Binary data", 8),
    (5, NULL, "admin_1", 9);



CREATE TABLE Users (
    -- User ID.
    id BIGINT UNSIGNED PRIMARY KEY,

    username VARCHAR(50) UNIQUE, -- TODO: Consider adding more restrictions.

    public_keys_for_authentication TEXT,
    -- (In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need to exchange passwords
    -- between databases.) (This could also be other data than encryption keys,
    -- and in principle it could even just be some ID to use for authenticating
    -- the user via a third party.)

    -- TODO: Implement managing of and restrictions on these fields when/if it
    -- becomes relevant:
    private_upload_vol_today BIGINT DEFAULT 0,
    private_download_vol_today BIGINT DEFAULT 0,
    private_upload_vol_this_month BIGINT DEFAULT 0,
    private_download_vol_this_month BIGINT DEFAULT 0
);

INSERT INTO Users (username, id)
VALUES ("admin_1", 9);



CREATE TABLE Texts (
    /* Text ID */
    id BIGINT UNSIGNED PRIMARY KEY,

    /* Data */
    str TEXT NOT NULL
);

CREATE TABLE Binaries (
    /* Binary string ID */
    id BIGINT UNSIGNED PRIMARY KEY,

    /* Data */
    bin LONGBLOB NOT NULL
);







CREATE TABLE PrivateCreators (
    ent_id BIGINT UNSIGNED PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    INDEX (user_id)
);
-- (These should generally be deleted quite quickly, and instead a special bot
-- should rate which entity is created by which user, if and only if the given
-- user has declared that they are the creater themselves (by rating the same
-- predicate before the bot).)
