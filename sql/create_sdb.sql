
-- /* Semantic inputs */
-- DROP TABLE SemanticInputs;
-- DROP TABLE Private_RecentInputs;
-- /* Indexes */
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
-- /* Ancillary data for aggregation bots */
-- DROP TABLE BotData;
--
-- /* Private user data */
-- DROP TABLE Private_UserData;
-- DROP TABLE Private_Sessions;
-- DROP TABLE Private_EMails;



/* Semantic inputs */

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


CREATE TABLE Private_RecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    cat_id BIGINT UNSIGNED NOT NULL,
    inst_id BIGINT UNSIGNED NOT NULL,
    rat_val SMALLINT UNSIGNED,

    live_at_time BIGINT UNSIGNED NOT NULL
);

-- CREATE TABLE RecentInputs (
--     id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--
--     user_id BIGINT UNSIGNED NOT NULL,
--     cat_id BIGINT UNSIGNED NOT NULL,
--     inst_id BIGINT UNSIGNED NOT NULL,
--     rat_val SMALLINT UNSIGNED
--
--     -- changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--
--     -- UNIQUE INDEX (user_id, cat_id, inst_id, changed_at)
-- );
-- "I think I actually will use that solution, i.e. to just let all the bots
-- and (what was) events run immediately for every new input, and I think that
-- I might even out-comment RecentInputs from the database, then. The reasoning
-- is that, if RecentInputs again becomes useful at some point, either to
-- better allow for third-party bots, and/or to prevent users from being able
-- to troll by changing ratings back and forth quickly (which might be
-- important in some special cases, e.g. when it comes to ratings of code
-- safety), then RecentInputs can just be added once again --- also with an
-- index like the secondary one of SemanticInputs and with the changed_at
-- column again, which should then also be the last column of that index. I
-- think this is what I'll do.." *Alternatively, one could also use:
-- CREATE TABLE RecordedInputs (
--     user_id BIGINT UNSIGNED NOT NULL,
--     cat_id BIGINT UNSIGNED NOT NULL,
--     inst_id BIGINT UNSIGNED NOT NULL,
--
--     changed_at_time BIGINT UNSIGNED,

--     rat_val SMALLINT UNSIGNED,
--
--     PRIMARY KEY (user_id, cat_id, inst_id, changed_at)
-- );
-- for helping third-party aggregation bots --- and other SDBs... Hm.. ...Yeah,
-- so one of these tables will probably be needed at some point, but, again,
-- not really at the beginning so we we can leave them out for now.


/* Indexes */

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
    ent_cxt_id BIGINT UNSIGNED,
    ent_def_str VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    PRIMARY KEY (
        user_id,
        idx_id,
        ent_type,
        ent_cxt_id,
        ent_def_str
    )
);
-- (Also needs compressing.)



/* Entities */

CREATE TABLE Entities (
    -- Entity ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Type of the entity. This can for instance be: Type, Category, Template,
    -- Index, User, Text data, Binary data, Aggregation bot, as well as any
    -- user-submitted type.
    type_id BIGINT UNSIGNED NOT NULL,

    -- ID of the entity's context entity. This will typically be that of a
    -- Template entity (i.e. with the type 'Template'), in which case it defines
    -- how the last field, the 'defining string,' is to be interpreted.
    -- For Template entities themselves, however (i.e. when type_id is that of
    -- the 'Template' type entity), the cxt_id is the ID of the template's
    -- intended type. (See initial_inserts.sql for examples.)
    cxt_id BIGINT UNSIGNED,

    -- Defining string of the entity. This can be a lexical item, understood in
    -- the context of the type alone if cxt_id is null. If the cxt_id is the ID
    -- of a Template entity, on the other hand, the def_str can be a series of
    -- inputs separated by '|' of either IDs of the form "#<number>" (e.g.
    -- "#100") or any other string (e.g. "Physics"). These inputs is then
    -- plugged into the placeholders of the template in order of appearence and
    -- the resulting string is then interpreted in the context of the type to
    -- yield the definition of the entity.
    def_str VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    UNIQUE INDEX (type_id, cxt_id, def_str)
);

INSERT INTO Entities (type_id, cxt_id, def_str, id)
VALUES
    (1, NULL, "Type", 1), -- The type of this "Type" entity is itself.
    (1, NULL, "Category", 2), -- This is then the "Category" type entity...
    (1, NULL, "Template", 3), -- ... and so on.
    (1, NULL, "Index", 4),
    (1, NULL, "User", 5),
    (1, NULL, "Aggregation bot", 6),
    (1, NULL, "Text data", 7),
    (1, NULL, "Binary data", 8),
    (5, NULL, "initial_user", 9); -- This is the first user.



CREATE TABLE Users (
    -- User ID.
    id BIGINT UNSIGNED PRIMARY KEY,

    username VARCHAR(50) UNIQUE, -- TODO: Consider adding more restrictions.

    public_keys_for_authentication TEXT
    -- (In order for third parties to be able to copy the database and then
    -- be able to have users log on, without the need to exchange passwords
    -- between databases.) (This could also be other data than encryption keys,
    -- and in principle it could even just be some ID to use for authenticating
    -- the user via a third party.)

);

INSERT INTO Users (username, id)
VALUES ("initial_user", 9);



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





/* Ancillary data for aggregation bots */

CREATE TABLE BotData (
    -- Bot entity or event entity which defines what the data means.
    def_id BIGINT UNSIGNED NOT NULL,
    -- Object entity which the data is about.
    obj_id BIGINT UNSIGNED NOT NULL,
    -- Data.
    data_1 BIGINT UNSIGNED,
    data_2 BIGINT UNSIGNED,
    data_3 BIGINT UNSIGNED,
    data_4 BIGINT UNSIGNED,

    PRIMARY KEY (
        def_id,
        obj_id
    )
);
-- TODO: Compress.



/* Private user data */

CREATE TABLE Private_UserData (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    password_hash VARBINARY(255),

    -- TODO: Implement managing of and restrictions on these fields when it
    -- becomes relevant:
    private_upload_vol_today BIGINT NOT NULL DEFAULT 0,
    private_download_vol_today BIGINT NOT NULL DEFAULT 0,
    private_upload_vol_this_month BIGINT NOT NULL DEFAULT 0,
    private_download_vol_this_month BIGINT NOT NULL DEFAULT 0
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

CREATE TABLE Private_EMails (
    e_mail_address VARCHAR(255) PRIMARY KEY,
    number_of_accounts TINYINT UNSIGNED NOT NULL
);
