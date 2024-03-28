
-- /* Semantic inputs */
-- DROP TABLE SemanticInputs;
-- DROP TABLE Private_RecentInputs;
-- DROP TABLE RecordedInputs;
-- /* Indexes */
-- DROP TABLE StringIndexKeys;

-- /* Entities */
-- DROP TABLE Strings;

-- /* Data */
-- DROP TABLE Users;
-- DROP TABLE Texts;
-- DROP TABLE Binaries;

-- /* Ancillary data for aggregation bots */
-- DROP TABLE BotData;

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
 * The statements in this system are always formed from a category entity and a
 * instance entity. The user thus states that the latter is an instance of the
 * given category. The rating then tells how important/useful the user deems
 * the instance to be in that category.
 * Note that all predicates can be reformulated as categories. For instance,
 * the predicate "is a scary movie" can be reformulated as the category "Scary
 * movies."
 **/

-- TODO: Correct the above paragraph and explain the new objects, maybe by
-- fixing:
    -- Note that these types are not
    -- inherent to the instances themselves, as these are generally overloaded
    -- with several types. For example, the entity 'WWII' might be
    -- interpreted as referring to the war itself, or as a subject of history.
    -- And if we want to categorize 'WWII' as e.g. 'good,' it is important to
    -- specify whether we mean as a war or as a history subject. If we mean
    -- the latter, we could then let this obj_type_id be the id of an entity
    -- called 'subject' (where 'WWII' would then be the obj_str_id, and 'good'
    -- would be the cat_id). 


CREATE TABLE SemanticInputs (
    -- User (or bot) who states the statement.
    user_id BIGINT UNSIGNED NOT NULL,

    -- The type of the object being tagged. 
    obj_type_id BIGINT UNSIGNED NOT NULL,

    -- Tag of the statement.
    tag_id BIGINT UNSIGNED NOT NULL,

    -- Rating value of how well the tag fits the object. The first byte
    -- of the SMALLINT is interpreted as a number between 0 and 10, where 0
    -- means 'absolutely/perfectly not' and 10 means 'absolutely/perfectly.'
    -- The last byte can either be used for more precision (in long lists),
    -- or it can also be used by users to denote a precision/uncertainty,
    -- although this won't be a thing until some future implementation.
    rat_val SMALLINT UNSIGNED NOT NULL,

    -- The string of the object being tagged. Note that the object is defined
    -- by its type and its string combined. An 'object' is thus a tuple of
    -- two string IDs, (typeID, strID). When we look up the strings that these
    -- IDs point to, we might get e.g. ('subject of history', 'WWII').
    -- Now you might think that 'WWII' is a good subject, and thus give this
    -- object the tag 'good' with a high rating attached. But if we then
    -- consider the object ('war', 'WWII'), you might not necessarily think
    -- that WWII is good as a war. This is why the type is important when
    -- tagging something, as it provides necessary context for the statement. 
    obj_str_id BIGINT UNSIGNED NOT NULL,

    -- Resulting semantic input: "User #<user_id> states that object 
    -- (#<obj_type_id>, #<obj_str_id>) fits the tag #<tag_id> on a scale
    -- from 0 to 10 (with 5 being neutral) by <rat_val> / 6553.5."

    PRIMARY KEY (
        user_id,
        obj_type_id,
        tag_id,
        rat_val,
        obj_str_id
    ),

    UNIQUE INDEX (user_id, obj_type_id, tag_id, obj_str_id)
);
-- TODO: Compress this table and its sec. index, as well as some other tables
-- and sec. indexes below. (But compression is a must for this table.)


CREATE TABLE Private_RecentInputs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    obj_type_id BIGINT UNSIGNED NOT NULL,
    tag_id BIGINT UNSIGNED NOT NULL,
    obj_str_id BIGINT UNSIGNED NOT NULL,
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
    obj_type_id BIGINT UNSIGNED NOT NULL,
    tag_id BIGINT UNSIGNED NOT NULL,
    obj_str_id BIGINT UNSIGNED NOT NULL,

    rat_val SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (changed_at_time, user_id, obj_type_id, tag_id, obj_str_id)

    -- TODO: Consider creating this index as well:
    -- UNIQUE INDEX (user_id, tag_id, obj_str_id, changed_at_time)
);


/* Indexes */

CREATE TABLE StringIndexKeys (
    -- User (or bot) who governs the index.
    user_id BIGINT UNSIGNED NOT NULL,

    -- Index entity which defines the restrictions on the entity keys.
    idx_id BIGINT UNSIGNED NOT NULL,

    /* The entity index */
    -- Given some constants for the above two columns, the "entity indexes"
    -- contain the "entity keys," which are each just the secondary index of an
    -- entity.
    str VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    PRIMARY KEY (
        user_id,
        idx_id,
        str
    )
);
-- (Also needs compressing.)



/* Entities */

CREATE TABLE Strings (
    -- Entity ID.
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- String. These are used to define objects, as each object is a tuple of
    -- two strings (or string IDs, if one will). The first string in these
    -- tuples denotes the type of the object (as a kind of context), and the
    -- second string is the word/sentence/lexical item/code referencing the
    -- object itself (understood in the context of its type). For instance,
    -- an object might be ('movie', 'The Lord of the Rings'), or
    --  ('subject', 'The Lord of the Rings'), or
    -- ('book', 'The Lord of the Rings'), etc.
    str VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,

    UNIQUE INDEX (str)
);
INSERT INTO Strings (str, id)
VALUES
    ("type", 1),
    ("tag", 2),
    -- internal non-string data types:
    ("f", 3), -- format string.
    ("i", 4), -- index.
    ("u", 5), -- user.
    ("a", 6), -- aggregation bot.
    ("t", 7), -- text.
    ("b", 8); -- binary.



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
VALUES ("initial_user", 1);



CREATE TABLE Texts (
    /* Text ID */
    id BIGINT UNSIGNED PRIMARY KEY,

    /* Data */
    txt TEXT NOT NULL
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
