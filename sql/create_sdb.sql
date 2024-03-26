
/* Semantic inputs */
DROP TABLE SemanticInputs;
DROP TABLE Private_RecentInputs;
DROP TABLE RecordedInputs;
/* Indexes */
DROP TABLE EntityIndexKeys;

/* Entities */
DROP TABLE Entities;

/* Data */
DROP TABLE Users;
DROP TABLE Texts;
DROP TABLE Binaries;

/* Ancillary data for aggregation bots */
DROP TABLE BotData;

/* Private user data */
DROP TABLE Private_UserData;
DROP TABLE Private_Sessions;
DROP TABLE Private_EMails;



/* Semantic inputs */

/* Semantic inputs are the statements that the users (or aggregation bots) give
 * as input to the semantic network. A central feature of this semantic system
 * is that all such statements come with a numerical value which represents the
 * degree to which the user deems that the statement is correct (like when
 * answering a survey).
 * The statements in this system are always formed from a category entity and a
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

    -- The type of the instances of the category. Note that these types are not
    -- inherent to the instances themselves, as these are generally overloaded
    -- with several types. For example, the entity 'WWII' might be
    -- interpreted as referring to the war itself, or as a subject of history.
    -- And if we want to categorize 'WWII' as e.g. 'good,' it is important to
    -- specify whether we mean as a war or as a history subject. If we mean
    -- the latter, we could then let this inst_type be the id of an entity
    -- called 'subject' (where 'WWII' would then be the inst_id, and 'good'
    -- would be the cat_id).
    inst_type BIGINT UNSIGNED NOT NULL,

    -- Category of the statement.
    cat_id BIGINT UNSIGNED NOT NULL,

    -- Rating value of how well the instance fits the category. The first byte
    -- of the SMALLINT is interpreted as a number between 0 and 10, where 0
    -- means 'absolutely/perfectly not' and 10 means 'absolutely/perfectly.'
    -- The last byte can either be used for more precision (in long lists),
    -- or it can also be used by users to denote a precision/uncertainty,
    -- although this won't be a thing until some future implementation.
    rat_val SMALLINT UNSIGNED NOT NULL,

    -- The (potential) instance of the category. This is the entity being
    -- rated (for the category <cat_id>, as an entity of the type <type_id>,
    -- by the user/bot <user_id>, with a rating value of <rat_val>.)
    inst_id BIGINT UNSIGNED NOT NULL,

    -- Resulting semantic input: "User #<user_id> states that entity #<inst_id>
    -- is an instance of category #<cat_id> with importance/usefulness given
    -- on a scale from 0 to 10 (with 5 being neutral) by <rat_val> / 6553.5."

    PRIMARY KEY (
        user_id,
        inst_type,
        cat_id,
        rat_val,
        inst_id
    ),

    UNIQUE INDEX (user_id, inst_type, cat_id, inst_id)
);
-- TODO: Compress this table and its sec. index, as well as some other tables
-- and sec. indexes below. (But compression is a must for this table.)


CREATE TABLE Private_RecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    inst_type BIGINT UNSIGNED NOT NULL,
    cat_id BIGINT UNSIGNED NOT NULL,
    inst_id BIGINT UNSIGNED NOT NULL,
    rat_val SMALLINT UNSIGNED NOT NULL,

    live_at_time BIGINT UNSIGNED NOT NULL
);

-- RecordedInputs can first of all be used by time-dependent bots (e.g. a mean-
-- of-recent-inputs bot), and can also potentially used by bots that update on
-- scheduled events rather than immediately when the input is received. And
-- furthermore, they can also potentially be used by third-party bots and by
-- SDB peers.
CREATE TABLE RecordedInputs (
    changed_at_time BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,
    inst_type BIGINT UNSIGNED NOT NULL,
    cat_id BIGINT UNSIGNED NOT NULL,
    inst_id BIGINT UNSIGNED NOT NULL,

    rat_val SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (changed_at_time, user_id, inst_type, cat_id, inst_id)

    -- TODO: Consider creating this index as well:
    -- UNIQUE INDEX (user_id, cat_id, inst_id, changed_at_time)
);


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
    ent_def VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    PRIMARY KEY (
        user_id,
        idx_id,
        ent_def
    )
);
-- (Also needs compressing.)



/* Entities */

CREATE TABLE Entities (
    -- Entity ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Definition (i.e. the defining string) of the entity. TODO: elaborate.
    ent_def VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    UNIQUE INDEX (ent_def)
);

-- INSERT INTO Entities (type_id, cxt_id, def_str, id)
-- VALUES
--     (1, 0, "Type", 1), -- The type of this "Type" entity is itself.
--     (1, 0, "Category", 2), -- This is then the "Category" type entity...
--     (1, 0, "Template", 3), -- ... and so on.
--     (1, 0, "Index", 4),
--     (1, 0, "User", 5),
--     (1, 0, "Aggregation bot", 6),
--     (1, 0, "Text data", 7),
--     (1, 0, "Binary data", 8),
--     (5, 0, "initial_user", 9); -- This is the first user.



CREATE TABLE Users (
    -- User ID.
    id BIGINT UNSIGNED PRIMARY KEY,

    username VARCHAR(50) UNIQUE NOT NULL,
    -- TODO: Consider adding more restrictions.

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
